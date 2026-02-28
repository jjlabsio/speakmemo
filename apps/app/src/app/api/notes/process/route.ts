import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { database } from "@repo/database";
import { downloadRecording } from "@repo/storage";
import { transcribeAudio } from "@/lib/whisper";

interface ProcessNoteBody {
  note_id?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ProcessNoteBody;
  const noteId = body.note_id;

  if (!noteId || typeof noteId !== "string" || noteId.trim() === "") {
    return NextResponse.json({ error: "note_id is required" }, { status: 400 });
  }

  const trimmedId = noteId.trim();
  const note = await database.note.findUnique({
    where: { id: trimmedId },
    select: { userId: true, recordingUrl: true, status: true },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (note.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Idempotency: skip reprocessing if already transcribed or summarized.
  if (note.status === "transcribed" || note.status === "summarized") {
    return NextResponse.json({ noteId: trimmedId, status: note.status });
  }

  if (!note.recordingUrl) {
    return NextResponse.json(
      { error: "Note has no recording to process" },
      { status: 400 },
    );
  }

  // Guard: recordingUrl must belong to the authenticated user's prefix.
  const expectedPrefix = `${session.user.id}/`;
  if (!note.recordingUrl.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "Invalid recording path" },
      { status: 400 },
    );
  }

  // Derive the filename from the last path segment of the storage path.
  // e.g. "user-123/1234567890.webm" → "1234567890.webm"
  const filename = note.recordingUrl.split("/").pop() ?? "recording.bin";

  try {
    const audioBlob = await downloadRecording(note.recordingUrl);
    const { text, segments, durationSec } = await transcribeAudio(
      audioBlob,
      filename,
    );

    await database.note.update({
      where: { id: trimmedId },
      data: { transcript: text, segments, durationSec, status: "transcribed" },
    });

    return NextResponse.json({ noteId: trimmedId, status: "transcribed" });
  } catch (error) {
    console.error(
      "[/api/notes/process] Transcription error for note",
      trimmedId,
      ":",
      error,
    );

    try {
      await database.note.update({
        where: { id: trimmedId },
        data: { status: "failed" },
      });
    } catch (dbError) {
      console.error(
        "[/api/notes/process] Failed to mark note as failed:",
        dbError,
      );
    }

    return NextResponse.json(
      { error: "Transcription failed. Please try again.", noteId: trimmedId },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { database } from "@repo/database";

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
    select: { userId: true },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (note.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // STT pipeline placeholder — will be wired to Whisper API in a future phase
  return NextResponse.json({ noteId: trimmedId });
}

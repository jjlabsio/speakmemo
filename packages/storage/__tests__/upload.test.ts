import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockRemove = vi.fn();
const mockDownload = vi.fn();

vi.mock("../src/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
        download: mockDownload,
      }),
    },
  },
}));

describe("upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadRecording", () => {
    it("should upload a file and return path and publicUrl", async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: {
          publicUrl:
            "https://test.supabase.co/storage/v1/object/public/recordings/user1/123.webm",
        },
      });

      const { uploadRecording } = await import("../src/upload");

      const result = await uploadRecording({
        userId: "user1",
        file: new Blob(["audio data"]),
        contentType: "audio/webm",
        fileExtension: "webm",
      });

      expect(result.path).toMatch(/^user1\/\d+\.webm$/);
      expect(result.publicUrl).toContain("recordings");
      expect(mockUpload).toHaveBeenCalledOnce();
    });

    it("should throw when upload fails", async () => {
      mockUpload.mockResolvedValue({
        error: { message: "Bucket not found" },
      });

      const { uploadRecording } = await import("../src/upload");

      await expect(
        uploadRecording({
          userId: "user1",
          file: new Blob(["audio data"]),
          contentType: "audio/webm",
          fileExtension: "webm",
        }),
      ).rejects.toThrow("Failed to upload recording: Bucket not found");
    });

    it("should use userId/timestamp.ext path pattern", async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: "https://example.com/file.mp4" },
      });

      const { uploadRecording } = await import("../src/upload");

      const result = await uploadRecording({
        userId: "abc123",
        file: new Blob(["audio"]),
        contentType: "audio/mp4",
        fileExtension: "mp4",
      });

      expect(result.path).toMatch(/^abc123\/\d+\.mp4$/);
    });

    it("should reject userId with path traversal characters", async () => {
      const { uploadRecording } = await import("../src/upload");

      await expect(
        uploadRecording({
          userId: "../../admin",
          file: new Blob(["audio"]),
          contentType: "audio/webm",
          fileExtension: "webm",
        }),
      ).rejects.toThrow("Invalid userId");
    });

    it("should reject fileExtension with path traversal characters", async () => {
      const { uploadRecording } = await import("../src/upload");

      await expect(
        uploadRecording({
          userId: "user1",
          file: new Blob(["audio"]),
          contentType: "audio/webm",
          fileExtension: "webm/../../../etc",
        }),
      ).rejects.toThrow("Invalid fileExtension");
    });

    it("should pass correct contentType and upsert=false to upload", async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: "https://example.com/file.webm" },
      });

      const { uploadRecording } = await import("../src/upload");

      await uploadRecording({
        userId: "user1",
        file: new Blob(["audio"]),
        contentType: "audio/webm",
        fileExtension: "webm",
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^user1\/\d+\.webm$/),
        expect.any(Blob),
        { contentType: "audio/webm", upsert: false },
      );
    });
  });

  describe("getRecordingUrl", () => {
    it("should return public URL for a given path", async () => {
      mockGetPublicUrl.mockReturnValue({
        data: {
          publicUrl:
            "https://test.supabase.co/storage/v1/object/public/recordings/user1/123.webm",
        },
      });

      const { getRecordingUrl } = await import("../src/upload");

      const url = getRecordingUrl("user1/123.webm");

      expect(url).toBe(
        "https://test.supabase.co/storage/v1/object/public/recordings/user1/123.webm",
      );
    });
  });

  describe("deleteRecording", () => {
    it("should call remove with correct path", async () => {
      mockRemove.mockResolvedValue({ error: null });

      const { deleteRecording } = await import("../src/upload");

      await deleteRecording("user1/123.webm");

      expect(mockRemove).toHaveBeenCalledWith(["user1/123.webm"]);
    });

    it("should throw when delete fails", async () => {
      mockRemove.mockResolvedValue({
        error: { message: "Object not found" },
      });

      const { deleteRecording } = await import("../src/upload");

      await expect(deleteRecording("user1/123.webm")).rejects.toThrow(
        "Failed to delete recording: Object not found",
      );
    });
  });

  describe("downloadRecording", () => {
    it("should return Blob on success", async () => {
      const mockBlob = new Blob(["audio data"]);
      mockDownload.mockResolvedValue({ data: mockBlob, error: null });

      const { downloadRecording } = await import("../src/upload");

      const result = await downloadRecording("user1/123.webm");

      expect(result).toBe(mockBlob);
    });

    it("should throw when download fails", async () => {
      mockDownload.mockResolvedValue({
        data: null,
        error: { message: "Object not found" },
      });

      const { downloadRecording } = await import("../src/upload");

      await expect(downloadRecording("user1/123.webm")).rejects.toThrow(
        "Failed to download recording: Object not found",
      );
    });
  });
});

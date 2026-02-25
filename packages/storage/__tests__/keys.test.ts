import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@t3-oss/env-nextjs", () => ({
  createEnv: ({
    server,
    runtimeEnv,
  }: {
    server: Record<string, { parse: (v: unknown) => unknown }>;
    runtimeEnv: Record<string, unknown>;
  }) => {
    const result: Record<string, unknown> = {};
    for (const [key, schema] of Object.entries(server)) {
      const value = runtimeEnv[key];
      result[key] = schema.parse(value);
    }
    return result;
  },
}));

vi.mock("server-only", () => ({}));

describe("keys", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should export env with validated SUPABASE_URL", async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");

    const { env } = await import("../src/keys");

    expect(env).toBeDefined();
    expect(env.SUPABASE_URL).toBe("https://test.supabase.co");
  });

  it("should export env with validated SUPABASE_ANON_KEY", async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");

    const { env } = await import("../src/keys");

    expect(env.SUPABASE_ANON_KEY).toBe("test-anon-key");
  });

  it("should reject missing SUPABASE_URL", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");

    await expect(import("../src/keys")).rejects.toThrow();
  });

  it("should reject invalid URL format for SUPABASE_URL", async () => {
    vi.stubEnv("SUPABASE_URL", "not-a-url");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");

    await expect(import("../src/keys")).rejects.toThrow();
  });

  it("should reject empty SUPABASE_ANON_KEY", async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "");

    await expect(import("../src/keys")).rejects.toThrow();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("../src/keys", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
  },
}));

describe("client", () => {
  beforeEach(() => {
    vi.resetModules();

    const globalAny = globalThis as Record<string, unknown>;
    delete globalAny.supabase;
  });

  it("should export a supabase instance with storage property", async () => {
    const { supabase } = await import("../src/client");

    expect(supabase).toBeDefined();
    expect(supabase.storage).toBeDefined();
  });

  it("should return the same instance (singleton)", async () => {
    const mod1 = await import("../src/client");
    const mod2 = await import("../src/client");

    expect(mod1.supabase).toBe(mod2.supabase);
  });

  it("should store instance on globalThis in non-production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { supabase } = await import("../src/client");

    const globalAny = globalThis as Record<string, unknown>;
    expect(globalAny.supabase).toBe(supabase);

    process.env.NODE_ENV = originalEnv;
  });
});

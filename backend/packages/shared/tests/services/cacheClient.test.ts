import { describe, expect, it, vi } from "vitest";
import {
  cacheDel,
  cacheGet,
  cacheSet,
  createRecipeSearchHash,
  rateLimitKey,
  recipeSearchKey,
  sessionKey,
  surpriseKey,
  trendingKey,
} from "../../src/services/cacheClient.js";

vi.mock("../../src/config/redis.js", () => ({
  redis: {
    status: "ready",
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe("cacheClient", () => {
  describe("cacheGet", () => {
    it("returns null when key not found", async () => {
      const { redis } = await import("../../src/config/redis.js");
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await cacheGet("test:key");
      expect(result).toBeNull();
    });

    it("returns parsed value when key exists", async () => {
      const { redis } = await import("../../src/config/redis.js");
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify({ foo: "bar" }));

      const result = await cacheGet<{ foo: string }>("test:key");
      expect(result).toEqual({ foo: "bar" });
    });

    it("returns null on Redis error", async () => {
      const { redis } = await import("../../src/config/redis.js");
      vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));

      const result = await cacheGet("test:key");
      expect(result).toBeNull();
    });
  });

  describe("cacheSet", () => {
    it("stores value with TTL", async () => {
      const { redis } = await import("../../src/config/redis.js");
      vi.mocked(redis.set).mockResolvedValue("OK");

      await cacheSet("test:key", { data: 42 }, 3600);
      expect(redis.set).toHaveBeenCalledWith(
        "test:key",
        JSON.stringify({ data: 42 }),
        "EX",
        3600,
      );
    });

    it("does not throw on Redis error", async () => {
      const { redis } = await import("../../src/config/redis.js");
      vi.mocked(redis.set).mockRejectedValue(new Error("Redis down"));

      await expect(cacheSet("test:key", "value")).resolves.toBeUndefined();
    });
  });

  describe("cacheDel", () => {
    it("deletes key", async () => {
      const { redis } = await import("../../src/config/redis.js");
      vi.mocked(redis.del).mockResolvedValue(1);

      await cacheDel("test:key");
      expect(redis.del).toHaveBeenCalledWith("test:key");
    });

    it("does not throw on Redis error", async () => {
      const { redis } = await import("../../src/config/redis.js");
      vi.mocked(redis.del).mockRejectedValue(new Error("Redis down"));

      await expect(cacheDel("test:key")).resolves.toBeUndefined();
    });
  });

  describe("key builders", () => {
    it("recipeSearchKey builds correct pattern", () => {
      expect(recipeSearchKey("abc123")).toBe("recipe:search:abc123");
    });

    it("surpriseKey builds correct pattern", () => {
      expect(surpriseKey("2024-01-01")).toBe("surprise:2024-01-01");
    });

    it("trendingKey builds correct pattern", () => {
      expect(trendingKey("2024-01-01")).toBe("trending:2024-01-01");
    });

    it("sessionKey builds correct pattern", () => {
      expect(sessionKey("sess-456")).toBe("session:sess-456");
    });

    it("rateLimitKey builds correct pattern", () => {
      expect(rateLimitKey("user1", "search")).toBe("rate:user1:search");
    });
  });

  describe("createRecipeSearchHash", () => {
    it("produces deterministic hash for same inputs", () => {
      const hash1 = createRecipeSearchHash(["chicken", "rice"], ["dinner"], 30);
      const hash2 = createRecipeSearchHash(["chicken", "rice"], ["dinner"], 30);
      expect(hash1).toBe(hash2);
    });

    it("produces different hash for different inputs", () => {
      const hash1 = createRecipeSearchHash(["chicken", "rice"], ["dinner"], 30);
      const hash2 = createRecipeSearchHash(["chicken", "rice"], ["lunch"], 30);
      expect(hash1).not.toBe(hash2);
    });

    it("is order-independent for ingredients", () => {
      const hash1 = createRecipeSearchHash(["chicken", "rice"], ["dinner"], 30);
      const hash2 = createRecipeSearchHash(["rice", "chicken"], ["dinner"], 30);
      expect(hash1).toBe(hash2);
    });

    it("produces 64-char hex string (SHA-256)", () => {
      const hash = createRecipeSearchHash(["chicken"]);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

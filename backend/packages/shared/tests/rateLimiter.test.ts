import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generalLimiter, llmLimiter, RateLimitError } from "../src/index.js";
import {
  createMockRequest,
  createMockResponse,
  createNextSpy,
} from "./helpers.js";

describe("rateLimiter middleware", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generalLimiter", () => {
    it("allows requests within the limit", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      for (let i = 0; i < 100; i++) {
        const { calls, next } = createNextSpy();
        generalLimiter(req, res, next);
        expect(calls).toEqual([undefined]);
      }
    });

    it("blocks requests exceeding 100 per minute", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      for (let i = 0; i < 100; i++) {
        const { next } = createNextSpy();
        generalLimiter(req, res, next);
      }

      const { calls, next } = createNextSpy();
      generalLimiter(req, res, next);
      expect(calls[0]).toBeInstanceOf(RateLimitError);
    });

    it("resets after window expires", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      for (let i = 0; i < 100; i++) {
        const { next } = createNextSpy();
        generalLimiter(req, res, next);
      }

      const blocked = createNextSpy();
      generalLimiter(req, res, blocked.next);
      expect(blocked.calls[0]).toBeInstanceOf(RateLimitError);

      vi.advanceTimersByTime(60_001);

      const reset = createNextSpy();
      generalLimiter(req, res, reset.next);
      expect(reset.calls).toEqual([undefined]);
    });
  });

  describe("llmLimiter", () => {
    it("allows up to 30 requests then blocks", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      for (let i = 0; i < 30; i++) {
        const { calls, next } = createNextSpy();
        llmLimiter(req, res, next);
        expect(calls).toEqual([undefined]);
      }

      const blocked = createNextSpy();
      llmLimiter(req, res, blocked.next);
      expect(blocked.calls[0]).toBeInstanceOf(RateLimitError);
    });
  });
});

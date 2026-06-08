import { describe, expect, it } from "vitest";
import { authenticate, signJwt } from "../src/index.js";
import {
  createMockRequest,
  createMockResponse,
  createNextSpy,
} from "./helpers.js";

describe("authenticate middleware", () => {
  describe("stub mode (default JWT_SECRET)", () => {
    it("attaches user from x-user-id header", async () => {
      const req = createMockRequest({
        headers: { "x-user-id": "test-user-1" },
      });
      const res = createMockResponse();
      const { calls, next } = createNextSpy();

      authenticate(req, res, next);

      expect(calls).toEqual([undefined]);
      expect(req.user).toEqual({
        userId: "test-user-1",
        authProvider: "stub",
      });
    });

    it("falls back to stub-user when no x-user-id header", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const { calls, next } = createNextSpy();

      authenticate(req, res, next);

      expect(calls).toEqual([undefined]);
      expect(req.user).toEqual({
        userId: "stub-user",
        authProvider: "stub",
      });
    });

    it("does not block requests (no 401)", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const { calls, next } = createNextSpy();

      authenticate(req, res, next);

      expect(calls).toEqual([undefined]);
    });
  });

  describe("real mode (custom JWT_SECRET)", () => {
    it("accepts a valid JWT token", async () => {
      const token = signJwt({
        sub: "user-abc",
        provider: "google",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      });

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const { calls, next } = createNextSpy();

      authenticate(req, res, next);

      expect(calls).toEqual([undefined]);
    });

    it("returns 401 when no Authorization header (in real mode)", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const { calls, next } = createNextSpy();

      authenticate(req, res, next);

      expect(calls).toEqual([undefined]);
      expect(req.user).toEqual({
        userId: "stub-user",
        authProvider: "stub",
      });
    });

    it("signJwt produces a verifiable token (round-trip)", () => {
      const payload = {
        sub: "user-xyz",
        provider: "email",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = signJwt(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });
  });
});

import { describe, expect, it } from "vitest";
import { authenticate, signJwt, AuthenticationError } from "../src/index.js";
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

    it("returns 401 when no x-user-id header", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const { calls, next } = createNextSpy();

      authenticate(req, res, next);

      expect(calls[0]).toBeInstanceOf(AuthenticationError);
      expect((calls[0] as Error).message).toBe("Authentication required");
      expect(req.user).toBeUndefined();
    });

  });

  describe("token & error handling", () => {
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

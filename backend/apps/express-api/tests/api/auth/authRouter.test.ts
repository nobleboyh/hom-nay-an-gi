import { errorHandler } from "@hom-nay-an-gi/shared";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authRouter,
  resetAuthLimiter,
} from "../../../src/api/auth/authRouter.js";

vi.mock("../../../src/api/auth/authService.js", () => ({
  register: vi.fn(),
  login: vi.fn(),
  googleAuth: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
}));

const { register, login, googleAuth, refreshToken, logout } = await import(
  "../../../src/api/auth/authService.js"
);

beforeEach(() => {
  resetAuthLimiter();
});

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", authRouter);
  app.use(errorHandler);
  return app;
}

const mockUser = {
  id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  displayName: "Test User",
  authProvider: "email",
};

const mockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
};

const mockAuthResult = {
  user: mockUser,
  tokens: mockTokens,
};

describe("POST /api/v1/auth/register", () => {
  it("returns 201 with user and tokens for valid input", async () => {
    vi.mocked(register).mockResolvedValueOnce(mockAuthResult);

    const app = createApp();
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("test@example.com");
    expect(res.body.data.tokens.accessToken).toBe("mock-access-token");
  });

  it("returns 409 for duplicate email", async () => {
    const { AppError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(register).mockRejectedValueOnce(
      new AppError("EMAIL_EXISTS", 409, "Email already registered"),
    );

    const app = createApp();
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "existing@example.com",
      password: "password123",
      displayName: "Test",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_EXISTS");
  });

  it("returns 400 for invalid input (missing password)", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "test@example.com", displayName: "Test" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for short password", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "123",
      displayName: "Test",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for invalid email", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "not-an-email",
      password: "password123",
      displayName: "Test",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns 200 with tokens for valid credentials", async () => {
    vi.mocked(login).mockResolvedValueOnce(mockAuthResult);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBe("mock-access-token");
  });

  it("returns 401 for invalid credentials", async () => {
    const { AuthenticationError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(login).mockRejectedValueOnce(
      new AuthenticationError(
        "AUTH_INVALID_CREDENTIALS",
        401,
        "Email or password is incorrect",
      ),
    );

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wrong@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("returns 400 for missing fields", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/google", () => {
  it("returns 200 with tokens for valid Google token", async () => {
    vi.mocked(googleAuth).mockResolvedValueOnce(mockAuthResult);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/google")
      .send({ idToken: "valid-google-id-token" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.authProvider).toBe("email");
  });

  it("returns 401 for invalid Google token", async () => {
    const { AuthenticationError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(googleAuth).mockRejectedValueOnce(
      new AuthenticationError(
        "AUTH_INVALID_CREDENTIALS",
        401,
        "Invalid Google token",
      ),
    );

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/google")
      .send({ idToken: "bogus-token" });

    expect(res.status).toBe(401);
  });

  it("returns 400 for missing idToken", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/auth/google").send({});

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("returns 200 with new tokens for valid refresh token", async () => {
    vi.mocked(refreshToken).mockResolvedValueOnce({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "valid-refresh-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe("new-access-token");
  });

  it("returns 401 for expired or revoked refresh token", async () => {
    const { AuthenticationError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(refreshToken).mockRejectedValueOnce(
      new AuthenticationError(
        "AUTH_INVALID_REFRESH_TOKEN",
        401,
        "Invalid or expired refresh token",
      ),
    );

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "expired-token" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("returns 200 when authenticated", async () => {
    vi.mocked(logout).mockResolvedValueOnce(undefined);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("x-user-id", "test-user")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 200 in stub mode even without auth header", async () => {
    // In stub mode (default JWT_SECRET), authenticate always passes.
    // Real mode 401 is tested in authenticate.test.ts.
    // This integration test is for routing correctness with any auth.
    vi.mocked(logout).mockResolvedValueOnce(undefined);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Rate limiting on POST /api/v1/auth/login", () => {
  it("returns 429 after 5 rapid requests", async () => {
    vi.mocked(login).mockResolvedValue(mockAuthResult);

    const app = createApp();
    const attempts = Array.from({ length: 6 });

    for (const _ of attempts.slice(0, 5)) {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "password123" });
      expect(res.status).toBe(200);
    }

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(429);
  });
});

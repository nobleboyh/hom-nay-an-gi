import type { NextFunction, Request, Response } from "express";

type MockResponseShape = {
  body: unknown;
  headers: Record<string, string>;
  set: (name: string, value: string) => MockResponseShape;
  setHeader: (name: string, value: string) => void;
  status: (_code: number) => MockResponseShape;
  json: (payload: unknown) => MockResponseShape;
};

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ip: "127.0.0.1",
    ...overrides,
  } as Request;
}

export function createMockResponse(): Response & {
  body: unknown;
  headers: Record<string, string>;
} {
  const response: MockResponseShape = {
    body: undefined,
    headers: {},
    set(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    status(_code: number) {
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response as Response & {
    body: unknown;
    headers: Record<string, string>;
  };
}

export function createNextSpy() {
  const calls: unknown[] = [];

  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };

  return {
    calls,
    next,
  };
}

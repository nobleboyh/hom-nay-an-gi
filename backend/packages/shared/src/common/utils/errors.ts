export class AppError extends Error {
  code: string;
  statusCode: number;
  userMessage: string;

  constructor(code: string, statusCode: number, userMessage: string) {
    super(userMessage);
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource?: string) {
    const userMessage = `${resource ?? "Resource"} not found`;
    super("NOT_FOUND", 404, userMessage);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  details: { field?: string; issue: string }[] | undefined;

  constructor(
    message: string,
    details?: { field?: string; issue: string }[] | undefined,
  ) {
    super("VALIDATION_ERROR", 400, message);
    this.details = details;
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(code: string, statusCode: number, message: string);
  constructor(message: string);
  constructor(codeOrMessage: string, statusCode?: number, message?: string) {
    if (statusCode !== undefined) {
      super(codeOrMessage, statusCode, message as string);
    } else {
      super("AUTH_TOKEN_EXPIRED", 401, codeOrMessage);
    }
    this.name = "AuthenticationError";
  }
}

export class LLMError extends AppError {
  constructor(
    code: "LLM_TIMEOUT" | "LLM_INVALID_RESPONSE" | "LLM_PROVIDER_ERROR",
    message: string,
  ) {
    super(code, 502, message);
    this.name = "LLMError";
  }
}

export class RateLimitError extends AppError {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("RATE_LIMIT_EXCEEDED", 429, "Too many requests");
    this.retryAfterSeconds = retryAfterSeconds;
    this.name = "RateLimitError";
  }
}

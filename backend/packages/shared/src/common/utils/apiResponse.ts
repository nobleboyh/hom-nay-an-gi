export type SuccessEnvelope<T> = {
  success: true;
  data: T;
};

export type ErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function buildSuccessResponse<T>(data: T): SuccessEnvelope<T> {
  return {
    success: true,
    data,
  };
}

export function buildErrorResponse(
  code: string,
  message: string,
): ErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

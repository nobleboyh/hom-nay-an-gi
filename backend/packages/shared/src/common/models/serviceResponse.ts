const version = "1.0.0";

export interface Meta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: Meta;
}

export interface ErrorDetail {
  field?: string;
  issue: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
  meta: Meta;
}

function buildMeta(requestId: string): Meta {
  return {
    requestId,
    timestamp: new Date().toISOString(),
    version,
  };
}

function success<T>(data: T, requestId: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: buildMeta(requestId),
  };
}

function failure(
  code: string,
  message: string,
  requestId: string,
  details?: ErrorDetail[],
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: buildMeta(requestId),
  };
}

export const ServiceResponse = {
  success,
  failure,
};

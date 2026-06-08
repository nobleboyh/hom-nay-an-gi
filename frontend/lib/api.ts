export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: ApiResponseMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown[];

  constructor(code: string, statusCode: number, message: string, details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onTokenExpired: () => Promise<void>;
  onUnauthenticated: () => void;
  defaultTimeoutMs?: number;
}

type RequestConfig = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

const DEFAULT_TIMEOUT = 10_000;
const LLM_TIMEOUT = 20_000;
const LLM_PATH_PREFIX = '/recipes/';

function abortableFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedSignal = init.signal
    ? combineSignals(init.signal, controller.signal)
    : controller.signal;

  return fetch(url, { ...init, signal: mergedSignal }).finally(() => clearTimeout(timeoutId));
}

function combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
  const controller = new AbortController();

  for (const signal of [signal1, signal2]) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }

  return controller.signal;
}

async function resolveTimeoutForPath(path: string, config?: RequestConfig): Promise<number> {
  if (config?.timeoutMs) {
    return config.timeoutMs;
  }

  return path.startsWith(LLM_PATH_PREFIX) ? LLM_TIMEOUT : DEFAULT_TIMEOUT;
}

async function logAndReturnError(response: Response): Promise<ApiFailure> {
  const text = await response.text();
  let parsed: ApiFailure;

  try {
    parsed = JSON.parse(text) as ApiFailure;
  } catch {
    parsed = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: text || `Request failed with status ${response.status}`,
      },
      meta: {
        requestId: 'unknown',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  return parsed;
}

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken, onTokenExpired, onUnauthenticated } = config;

  async function request<T>(
    method: ApiMethod,
    path: string,
    body?: unknown,
    requestConfig?: RequestConfig,
    retryOn401 = true,
  ): Promise<ApiSuccess<T>> {
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const timeoutMs = await resolveTimeoutForPath(path, requestConfig);
    const url = `${baseUrl}${path}`;
    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await abortableFetch(url, init, timeoutMs);

    if (response.status === 401 && retryOn401) {
      await onTokenExpired();
      const refreshedToken = await getToken();

      if (refreshedToken) {
        headers['Authorization'] = `Bearer ${refreshedToken}`;
        const retryResponse = await abortableFetch(url, { ...init, headers }, timeoutMs);

        if (retryResponse.status === 401) {
          onUnauthenticated();
          throw new ApiError('AUTH_TOKEN_EXPIRED', 401, 'Token expired');
        }

        if (!retryResponse.ok) {
          const failureBody = await logAndReturnError(retryResponse);
          throw new ApiError(
            failureBody.error.code,
            retryResponse.status,
            failureBody.error.message,
            failureBody.error.details,
          );
        }

        return (await retryResponse.json()) as ApiSuccess<T>;
      }

      onUnauthenticated();
      throw new ApiError('AUTH_TOKEN_EXPIRED', 401, 'Token expired and refresh failed');
    }

    if (response.status === 401) {
      onUnauthenticated();
      throw new ApiError('AUTH_TOKEN_EXPIRED', 401, 'Token expired');
    }

    if (!response.ok) {
      const failureBody = await logAndReturnError(response);
      throw new ApiError(
        failureBody.error.code,
        response.status,
        failureBody.error.message,
        failureBody.error.details,
      );
    }

    return (await response.json()) as ApiSuccess<T>;
  }

  return {
    get<T>(path: string, config?: RequestConfig) {
      return request<T>('GET', path, undefined, config);
    },
    post<T>(path: string, body?: unknown, config?: RequestConfig) {
      return request<T>('POST', path, body, config);
    },
    put<T>(path: string, body?: unknown, config?: RequestConfig) {
      return request<T>('PUT', path, body, config);
    },
    delete<T>(path: string, config?: RequestConfig) {
      return request<T>('DELETE', path, undefined, config);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

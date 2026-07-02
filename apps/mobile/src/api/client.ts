import Constants from 'expo-constants';

const DEFAULT_API_URL = 'https://productcount.up.railway.app/api/v1';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  DEFAULT_API_URL;

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  deviceId?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.deviceId) headers['X-Device-Id'] = options.deviceId;

  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      `Cannot reach the server at ${API_URL}. Check your internet connection and API URL.`,
      0,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(
      'INVALID_RESPONSE',
      response.ok
        ? 'Server returned a non-JSON response'
        : `Request failed (${response.status}). Check EXPO_PUBLIC_API_URL includes /api/v1`,
      response.status,
    );
  }

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN',
      json.error?.message ?? 'Request failed',
      response.status,
    );
  }
  return json.data as T;
}

/** Base URL without /api/v1 — for health checks */
export function getApiBaseUrl(): string {
  return API_URL.replace(/\/api\/v1\/?$/, '');
}

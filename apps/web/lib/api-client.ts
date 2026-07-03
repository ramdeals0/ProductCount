import type { ApiError, ApiResponse } from '@shopcount/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as ApiResponse<T> | ApiError;

  if (!res.ok || !json.success) {
    const err = json as ApiError;
    throw new ApiClientError(
      res.status,
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? 'Request failed',
    );
  }

  return (json as ApiResponse<T>).data;
}

export function getApiUrl() {
  return API_URL;
}

export async function apiDownload(path: string, token: string, filename: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

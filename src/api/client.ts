import { getToken, updateTokenIfNeeded, logout } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  console.error('[api] VITE_API_URL is not set. Set it in .env');
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const refreshed = await updateTokenIfNeeded();
  if (!refreshed) {
    throw new ApiError('Authentication required', 401);
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and that the API Gateway is running.', 0);
  }

  if (response.status === 401) {
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }

  if (response.status === 403) {
    throw new ApiError('You do not have permission to perform this action.', 403);
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const text = await response.text();
      if (text) detail = text.length > 200 ? text.slice(0, 200) + '…' : text;
    } catch {
      // ignore body parse failure
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export { BASE_URL };

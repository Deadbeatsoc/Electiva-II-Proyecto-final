const DEFAULT_API_BASE_URL = 'http://localhost:4000/api';

const normalizeBaseUrl = (value?: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL;

type RequestOptions = RequestInit & { skipDefaultHeaders?: boolean };

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const url = `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || undefined);

  if (!options.skipDefaultHeaders && !headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = response.status === 204
    ? null
    : isJson
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message?: string }).message)
      : response.statusText || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { apiBaseUrl };

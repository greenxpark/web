import { CONFIG } from '../config';

export function isApiEnabled(): boolean {
  return Boolean(CONFIG.apiUrl.trim());
}

function buildUrl(params: Record<string, string>): string {
  const url = new URL(CONFIG.apiUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

const inFlightGets = new Map<string, Promise<unknown>>();

export interface ApiGetOptions {
  timeoutMs?: number;
  retries?: number;
}

export async function apiGet<T>(
  params: Record<string, string> = {},
  options: ApiGetOptions = {}
): Promise<T> {
  const password = sessionStorage.getItem(CONFIG.storageKeys.adminPassword);
  const finalParams = { ...params };
  if (password) {
    finalParams.password = password;
  }
  const url = buildUrl(finalParams);

  const existing = inFlightGets.get(url);
  if (existing) {
    return existing as Promise<T>;
  }

  const timeoutMs = options.timeoutMs ?? 45000;
  const maxRetries = options.retries ?? 1;

  const executeFetch = async (attempt: number): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('No se pudo conectar con Google Sheets.');
      const data = (await res.json()) as T & { success?: boolean; error?: string };
      if (data.success === false && data.error) throw new Error(data.error);
      return data;
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort && attempt < maxRetries) {
        return await executeFetch(attempt + 1);
      }
      if (isAbort) {
        throw new Error('Tiempo de espera agotado al consultar el servidor.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchPromise = (async () => {
    try {
      return await executeFetch(0);
    } finally {
      inFlightGets.delete(url);
    }
  })();

  inFlightGets.set(url, fetchPromise);
  return fetchPromise;
}

export async function apiPost<T>(body: unknown): Promise<T> {
  inFlightGets.clear();
  const password = sessionStorage.getItem(CONFIG.storageKeys.adminPassword);
  let finalBody = body;
  if (password && typeof body === 'object' && body !== null) {
    finalBody = { ...body, password };
  }
  const res = await fetch(CONFIG.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(finalBody),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error('Error al enviar datos a Google Sheets.');
  const data = (await res.json()) as T & { success?: boolean; error?: string };
  if (data.success === false && data.error) throw new Error(data.error);
  return data;
}


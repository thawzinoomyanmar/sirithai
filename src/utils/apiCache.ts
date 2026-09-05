const CACHE_PREFIX = 'sirithai:api-cache:v1:';
const MAX_ENTRIES = 40;
const MAX_BODY_CHARACTERS = 750_000;
const MAX_TOTAL_CHARACTERS = 3_000_000;

interface CachedResponse {
  savedAt: number;
  expiresAt: number;
  status: number;
  statusText: string;
  contentType: string;
  headers: Array<[string, string]>;
  body: string;
}

const pendingRequests = new Map<string, Promise<CachedResponse>>();

const TTL_RULES: Array<{ pattern: RegExp; milliseconds: number }> = [
  { pattern: /\/api\/alphabet(?:\?|$)/, milliseconds: 60 * 60_000 },
  { pattern: /\/api\/(?:courses|resources|vocab-categories|grammar-chapters|audio-ebooks|ebook-chapters)(?:[/?]|$)/, milliseconds: 15 * 60_000 },
  { pattern: /\/api\/(?:lessons|vocabulary|grammar|dialogue|conversation|chapters)(?:[/?]|$)/, milliseconds: 10 * 60_000 },
  { pattern: /\/api\/(?:dynamic-data|chapter-details)(?:\?|$)/, milliseconds: 5 * 60_000 },
  { pattern: /\/api\/(?:profile|progress|user-courses|activity-logs|activities|payment-logs)(?:\?|$)/, milliseconds: 20_000 },
];

function inferMutationInvalidations(pathname: string): string[] {
  if (/\/api\/(?:orders|submit-transaction|admin\/approve-payment)$/.test(pathname)) {
    return ['/api/profile', '/api/payment-logs', '/api/user-courses', '/api/activity-logs', '/api/activities'];
  }
  if (/\/api\/(?:profile|progress|user-courses|activity-logs|activities)$/.test(pathname)) {
    return ['/api/profile', '/api/user-courses', '/api/activity-logs', '/api/activities'];
  }
  return [];
}

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function normalizeUrl(input: RequestInfo | URL): string {
  const rawUrl = input instanceof Request ? input.url : String(input);
  const url = new URL(rawUrl, typeof window !== 'undefined' ? window.location.origin : 'https://local.invalid');
  url.searchParams.delete('_t');
  url.searchParams.delete('fresh');
  url.searchParams.sort();
  return url.toString();
}

export function getSessionCacheTtl(input: RequestInfo | URL): number {
  const url = normalizeUrl(input);
  return TTL_RULES.find((rule) => rule.pattern.test(url))?.milliseconds || 0;
}

function cacheKey(input: RequestInfo | URL): string {
  return `${CACHE_PREFIX}${normalizeUrl(input)}`;
}

function toResponse(record: CachedResponse, cacheStatus: 'HIT' | 'MISS'): Response {
  const headers = new Headers(record.headers);
  headers.set('Content-Type', record.contentType);
  headers.set('X-Session-Cache', cacheStatus);
  return new Response(record.body, {
    status: record.status,
    statusText: record.statusText,
    headers,
  });
}

function readEntry(key: string): CachedResponse | null {
  if (!storageAvailable()) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedResponse;
    if (!entry || entry.expiresAt <= Date.now() || typeof entry.body !== 'string') {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    try { sessionStorage.removeItem(key); } catch { /* Storage can be disabled. */ }
    return null;
  }
}

function pruneCache(incomingCharacters: number): void {
  if (!storageAvailable()) return;
  const entries: Array<{ key: string; savedAt: number; size: number }> = [];
  try {
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (!key?.startsWith(CACHE_PREFIX)) continue;
      const value = sessionStorage.getItem(key);
      if (!value) continue;
      const parsed = JSON.parse(value) as Partial<CachedResponse>;
      if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) sessionStorage.removeItem(key);
      else entries.push({ key, savedAt: parsed.savedAt || 0, size: parsed.body?.length || 0 });
    }
    entries.sort((a, b) => b.savedAt - a.savedAt);
    let totalCharacters = incomingCharacters;
    entries.forEach((entry, index) => {
      totalCharacters += entry.size;
      if (index >= MAX_ENTRIES - 1 || totalCharacters > MAX_TOTAL_CHARACTERS) {
        sessionStorage.removeItem(entry.key);
      }
    });
  } catch {
    // A cache failure must never prevent an API request.
  }
}

function writeEntry(key: string, entry: CachedResponse): void {
  if (!storageAvailable() || entry.body.length > MAX_BODY_CHARACTERS) return;
  try {
    pruneCache(entry.body.length);
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Quota or privacy-mode failures simply degrade to the network.
  }
}

export function invalidateSessionApiCache(pathFragments?: string | string[]): void {
  if (!storageAvailable()) return;
  const fragments = pathFragments ? (Array.isArray(pathFragments) ? pathFragments : [pathFragments]) : [];
  try {
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX) && (fragments.length === 0 || fragments.some((fragment) => key.includes(fragment)))) {
        keys.push(key);
      }
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Storage can be unavailable without affecting application behavior.
  }
}

export async function sessionCachedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ttlMilliseconds = getSessionCacheTtl(input),
): Promise<Response> {
  const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const requestCache = init.cache || (input instanceof Request ? input.cache : 'default');
  const requestHeaders = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  const cacheControl = requestHeaders.get('Cache-Control') || '';
  const requestUrl = new URL(
    input instanceof Request ? input.url : String(input),
    typeof window !== 'undefined' ? window.location.origin : 'https://local.invalid',
  );
  const shouldCache = method === 'GET' && ttlMilliseconds > 0 &&
    requestCache !== 'no-store' && requestCache !== 'reload' &&
    !cacheControl.includes('no-cache') && !cacheControl.includes('no-store') &&
    !requestHeaders.has('Authorization') &&
    !requestUrl.searchParams.has('fresh') && !requestUrl.searchParams.has('_t');
  if (!shouldCache) {
    const response = await fetch(input, init);
    if (method !== 'GET' && response.ok) {
      const invalidationHeader = response.headers.get('X-Cache-Invalidate');
      const fragments = new Set([
        ...inferMutationInvalidations(requestUrl.pathname),
        ...(invalidationHeader?.split(',').filter(Boolean) || []),
      ]);
      if (fragments.size > 0) invalidateSessionApiCache(Array.from(fragments));
    }
    return response;
  }

  const key = cacheKey(input);
  const cached = readEntry(key);
  if (cached) return toResponse(cached, 'HIT');

  let pending = pendingRequests.get(key);
  if (!pending) {
    pending = (async () => {
      const response = await fetch(input, init);
      const contentType = response.headers.get('Content-Type') || '';
      const body = await response.clone().text();
      const record: CachedResponse = {
        savedAt: Date.now(),
        expiresAt: Date.now() + ttlMilliseconds,
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers: Array.from(response.headers.entries()),
        body,
      };
      if (response.ok && contentType.toLowerCase().includes('application/json')) writeEntry(key, record);
      return record;
    })().finally(() => pendingRequests.delete(key));
    pendingRequests.set(key, pending);
  }

  const record = await pending;
  return toResponse(record, 'MISS');
}

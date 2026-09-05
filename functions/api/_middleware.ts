const CACHE_VERSION = 'api-v1';
const CACHE_NAME = `sirithai:${CACHE_VERSION}`;

interface CacheRule {
  pattern: RegExp;
  ttlSeconds: number;
}

// Only public, non-user-specific reads belong in the shared edge cache.
const CACHE_RULES: CacheRule[] = [
  { pattern: /^\/api\/alphabet$/, ttlSeconds: 86_400 },
  { pattern: /^\/api\/(?:courses|resources|vocab-categories|grammar-chapters)$/, ttlSeconds: 900 },
  { pattern: /^\/api\/(?:lessons|vocabulary|grammar|dialogue|conversation)$/, ttlSeconds: 600 },
  { pattern: /^\/api\/(?:dynamic-data|chapter-details)$/, ttlSeconds: 300 },
  { pattern: /^\/api\/chapters\/[^/]+\/[^/]+$/, ttlSeconds: 600 },
  { pattern: /^\/api\/ebook-chapters(?:\/[^/]+\/[^/]+)?$/, ttlSeconds: 900 },
  { pattern: /^\/api\/audio-ebooks$/, ttlSeconds: 900 },
];

const INVALIDATION_GROUPS: Array<{ pattern: RegExp; paths: string[] }> = [
  {
    pattern: /\/api\/(?:admin\/(?:content|data|bulk-upload)|d1-admin-deploy|api-curriculum)/i,
    paths: [
      '/api/courses', '/api/lessons', '/api/dynamic-data', '/api/vocabulary',
      '/api/vocab-categories', '/api/alphabet', '/api/grammar',
      '/api/grammar-chapters', '/api/dialogue', '/api/conversation',
      '/api/resources', '/api/audio-ebooks', '/api/ebook-chapters',
    ],
  },
  {
    pattern: /\/api\/d1-app-data-deploy/i,
    paths: ['/api/dynamic-data'],
  },
  {
    pattern: /(?:course|curriculum|lesson)/i,
    paths: ['/api/courses', '/api/lessons', '/api/dynamic-data'],
  },
  {
    pattern: /vocab/i,
    paths: ['/api/vocabulary', '/api/vocab-categories', '/api/dynamic-data'],
  },
  {
    pattern: /alphabet/i,
    paths: ['/api/alphabet', '/api/dynamic-data'],
  },
  {
    pattern: /grammar/i,
    paths: ['/api/grammar', '/api/grammar-chapters', '/api/dynamic-data'],
  },
  {
    pattern: /dialogue/i,
    paths: ['/api/dialogue', '/api/dynamic-data'],
  },
  {
    pattern: /conversation/i,
    paths: ['/api/conversation', '/api/dynamic-data'],
  },
  {
    pattern: /resource/i,
    paths: ['/api/resources', '/api/dynamic-data'],
  },
  {
    pattern: /ebook|audio/i,
    paths: ['/api/audio-ebooks', '/api/ebook-chapters', '/api/dynamic-data'],
  },
];

function findCacheRule(pathname: string): CacheRule | undefined {
  return CACHE_RULES.find((rule) => rule.pattern.test(pathname));
}

function hasCacheBypass(request: Request, url: URL): boolean {
  const cacheControl = request.headers.get('Cache-Control') || '';
  return cacheControl.includes('no-cache') || cacheControl.includes('no-store') ||
    url.searchParams.has('fresh') || url.searchParams.has('_t') ||
    request.headers.has('Authorization');
}

function createCacheKey(request: Request, generation = CACHE_VERSION): Request {
  const url = new URL(request.url);
  url.searchParams.sort();
  url.searchParams.set('__edge_cache_version', `${CACHE_VERSION}:${generation}`);
  return new Request(url.toString(), { method: 'GET' });
}

function createGenerationKey(origin: string): Request {
  return new Request(new URL(`/__sirithai_api_cache_generation/${CACHE_VERSION}`, origin).toString());
}

async function getCacheGeneration(cache: Cache, origin: string): Promise<string> {
  const response = await cache.match(createGenerationKey(origin));
  return response ? response.text() : CACHE_VERSION;
}

function responseWithCacheStatus(response: Response, status: 'HIT' | 'MISS' | 'BYPASS'): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Edge-Cache', status);
  headers.set('Access-Control-Expose-Headers', 'X-Cache-Invalidate, X-Edge-Cache');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function getInvalidationPaths(request: Request): string[] {
  const url = new URL(request.url);
  const paths = new Set<string>();
  for (const group of INVALIDATION_GROUPS) {
    if (group.pattern.test(url.pathname)) group.paths.forEach((path) => paths.add(path));
  }
  return Array.from(paths);
}

async function invalidatePublicCache(request: Request, paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const url = new URL(request.url);
  const cache = await caches.open(CACHE_NAME);
  // Rotate the generation so every cached query variant in this PoP becomes
  // unreachable. Old entries expire naturally according to their route TTL.
  await cache.put(createGenerationKey(url.origin), new Response(crypto.randomUUID(), {
    headers: { 'Cache-Control': 'public, max-age=604800' },
  }));
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const rule = findCacheRule(url.pathname);

  if (request.method !== 'GET' || !rule) {
    const response = await context.next();
    if (request.method !== 'GET' && request.method !== 'OPTIONS' && response.ok) {
      const invalidationPaths = getInvalidationPaths(request);
      context.waitUntil(invalidatePublicCache(request, invalidationPaths).catch((error) => {
        console.error(JSON.stringify({ event: 'edge_cache_invalidation_failed', path: url.pathname, error: String(error) }));
      }));
      if (invalidationPaths.length > 0) {
        const headers = new Headers(response.headers);
        headers.set('X-Cache-Invalidate', invalidationPaths.join(','));
        headers.set('Access-Control-Expose-Headers', 'X-Cache-Invalidate, X-Edge-Cache');
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      }
    }
    return response;
  }

  if (hasCacheBypass(request, url)) {
    return responseWithCacheStatus(await context.next(), 'BYPASS');
  }

  const cache = await caches.open(CACHE_NAME);
  const generation = await getCacheGeneration(cache, url.origin);
  const cacheKey = createCacheKey(request, generation);
  const cached = await cache.match(cacheKey);
  if (cached) return responseWithCacheStatus(cached, 'HIT');

  const originResponse = await context.next();
  if (!originResponse.ok || originResponse.status !== 200 || originResponse.headers.has('Set-Cookie')) {
    return responseWithCacheStatus(originResponse, 'BYPASS');
  }

  const headers = new Headers(originResponse.headers);
  headers.set('Cache-Control', `public, max-age=0, s-maxage=${rule.ttlSeconds}`);
  headers.set('X-Edge-Cache', 'MISS');
  const response = new Response(originResponse.body, {
    status: originResponse.status,
    statusText: originResponse.statusText,
    headers,
  });

  context.waitUntil(cache.put(cacheKey, response.clone()).catch((error) => {
    console.error(JSON.stringify({ event: 'edge_cache_put_failed', path: url.pathname, error: String(error) }));
  }));
  return response;
};

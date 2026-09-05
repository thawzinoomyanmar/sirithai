# D1 read caching strategy

This project uses two independent caches before a public content request reaches D1.

1. `sessionStorage` serves repeat requests made by the same browser tab.
2. The Cloudflare Cache API serves repeat requests in the same Cloudflare data center.
3. D1 is queried only when both layers miss or caching is explicitly bypassed.

User profiles, orders, access checks, administrative endpoints, and activity logs are never stored in the shared Cloudflare edge cache. User-specific browser responses such as enrolled courses use only a short, per-tab SessionStorage TTL.

## Edge cache

`functions/api/_middleware.ts` applies caching only to an allowlist of public GET endpoints.

| Data | Edge TTL |
| --- | ---: |
| Alphabet | 24 hours |
| Catalogs, resources, eBooks | 15 minutes |
| Lessons, vocabulary, grammar, conversations | 10 minutes |
| Combined dynamic data and chapter details | 5 minutes |

The complete URL, including normalized query parameters, is part of the key. Authorization headers, `Cache-Control: no-cache`, `Cache-Control: no-store`, `_t`, and `fresh` bypass the cache. Errors and responses containing `Set-Cookie` are not cached.

Responses expose `X-Edge-Cache` with `HIT`, `MISS`, or `BYPASS`. Cache writes and invalidation run through `context.waitUntil()` so they do not delay the response.

Successful curriculum mutations rotate an edge-cache generation. This immediately makes every old query variant unreachable in the current data center. Old objects expire naturally. The mutation response also includes `X-Cache-Invalidate` with the frontend paths that changed.

Cloudflare Cache API storage is local to each data center rather than globally replicated. A mutation invalidates the data center processing that mutation; other locations converge within the configured TTL.

## SessionStorage cache

`src/utils/apiCache.ts` provides `sessionCachedFetch()`. It includes:

- URL normalization and route-specific TTLs matching the edge policy.
- Concurrent-request deduplication so duplicated React loaders share one network call.
- Short 20-second caching for profile/progress/enrollment responses.
- Automatic targeted invalidation when a mutation returns `X-Cache-Invalidate`.
- Versioned keys, expiry cleanup, a 40-entry cap, a 3-million-character total budget, and a 750,000-character per-response limit.
- Graceful fallback when SessionStorage is unavailable or its quota is exhausted.

SessionStorage is cleared automatically when the browser tab closes. A hard refresh can bypass both layers by sending `Cache-Control: no-cache`; frontend synchronization uses `cache: "reload"` when its existing `force` option is selected.

## Verifying production behavior

Request the same public endpoint twice and inspect the response headers:

```sh
curl -sS -D - -o /dev/null https://your-domain.example/api/dynamic-data
curl -sS -D - -o /dev/null https://your-domain.example/api/dynamic-data
```

The first request should report `X-Edge-Cache: MISS` and a later request handled by the same location should report `X-Edge-Cache: HIT`. Browser developer tools expose `X-Session-Cache` on responses returned by the frontend cache.

Monitor D1 rows read after deployment and tune TTLs in one place: `CACHE_RULES` for edge caching and `TTL_RULES` for SessionStorage. Longer TTLs lower D1 usage but increase the maximum time a different data center can serve pre-mutation content.

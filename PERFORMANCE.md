# Performance Baselines & Load Testing

## Overview

This document covers load testing for the `/api/og` share card generation endpoint and client-side `html2canvas` benchmarking.

---

## Server-side: `/api/og` Load Test

### Setup

The test script lives in `load-tests/og-load-test.js` and uses [`autocannon`](https://github.com/mcollina/autocannon).

Install the dependency:

```bash
npm install -g autocannon
# or run without installing:
npx autocannon <url>
```

### Running the tests

```bash
# Start the dev server (or target a staging URL)
pnpm dev

# In a separate terminal:
BASE_URL=http://localhost:3000 node load-tests/og-load-test.js

# Against a deployed environment:
BASE_URL=https://your-staging-url.vercel.app node load-tests/og-load-test.js
```

### Test scenarios

| Scenario | Concurrent connections | Duration |
|----------|----------------------|---------|
| Light    | 10                   | 15 s    |
| Moderate | 50                   | 15 s    |
| Heavy    | 100                  | 15 s    |

### Baseline targets

| Metric            | Target       |
|-------------------|--------------|
| p95 response time | **< 2 000 ms** |
| Error rate        | **< 1 %**    |
| Timeout rate      | **< 0.5 %**  |

### Identified bottlenecks

| Bottleneck | Root cause | Mitigation |
|-----------|-----------|-----------|
| Cold start latency | Vercel Edge Function first-request spin-up (~200–400 ms) | Keep-alive via scheduled synthetic pings; upgrade to a warm-tier plan |
| Font loading | `@vercel/og` fetches fonts on each cold start | Pre-load fonts as module-level `ArrayBuffer` constants in `route.tsx` |
| Archetype image fetch | `fetch(baseUrl + archetypeImagePath)` adds RTT per request | Cache fetched image buffers in module scope (survives across warm invocations) |
| Canvas encoding | `btoa` on large images is CPU-bound | Use `Buffer.from(buf).toString('base64')` (faster) or reduce image resolution |

### Recommended `Cache-Control` headers

The endpoint already sets:

```
Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800
```

This allows Vercel's CDN (and any downstream CDN) to cache OG images for 24 hours and serve stale content for up to 7 days while revalidating. For high-traffic deployments, add a CDN prefix cache key on the full query string to maximise hit rate.

---

## Client-side: `html2canvas` benchmark

### How to run

1. Open Chrome DevTools → **Performance** tab.
2. Click the CPU throttle dropdown and select **4× slowdown** (simulates a mid-range phone).
3. Start recording, trigger share card generation on `/share`, stop recording.
4. Look for the `html2canvas` task in the flame graph.

### Target

| Device profile                | Target render time |
|-------------------------------|--------------------|
| Desktop (no throttle)         | < 800 ms           |
| Mid-range phone (4× throttle) | < 3 000 ms         |
| Low-end phone (6× throttle)   | < 5 000 ms         |

### Identified bottlenecks & remediation

| Bottleneck | Mitigation |
|-----------|-----------|
| 3× scale factor (`scale: 3` in `html2canvas` config) | Reduce to `scale: 2` for mobile user agents |
| Complex CSS gradients & blur filters | Simplify backdrop-filter usage in the card DOM subtree |
| Web font loading at render time | Pre-warm fonts with `document.fonts.load()` before calling `html2canvas` |
| Large DOM subtree | Render a lightweight shadow clone element instead of the full page |

---

## Recommended limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max concurrent OG requests per deployment | ~200 rps | Vercel Edge plan limit; above this, add request queuing |
| OG image cache TTL | 24 h (`s-maxage=86400`) | Sufficient freshness for persona data that changes monthly |
| `html2canvas` scale on mobile | `2` | Balances quality and speed on mid-range devices |
| Client-side generation timeout | 10 s | Show error state if canvas encoding exceeds this threshold |

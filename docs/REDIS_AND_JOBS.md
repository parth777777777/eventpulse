# Redis and background jobs

## Current status

The project has no Redis dependency, queue, worker, cache key, lock, or background job. All state is browser memory. The following is proposed only.

PostgreSQL owns canonical events, source provenance, organizer ownership, bookmarks, and import history. Redis owns short-lived discovery responses, freshness markers, idempotency/locks, and BullMQ coordination; it is never the source of truth.

A discovery key should include schema version, normalized geographic cell, radius, date window, category/cost/source filters. Use a short TTL for results and a separate freshness key. On event changes, invalidate affected cells or accept bounded TTL staleness. A BullMQ job ID such as `source:cell:dateWindow` prevents duplicate imports. Use one active lock per source/cell with expiry, 2–3 retries, exponential backoff, and a dead-letter/review state.

HTTP returns database results without waiting. Multiple users share a job when their normalized key matches. If Redis is unavailable, bypass cache and queueing, query Postgres, and expose a degraded refresh status; the product must still discover existing events. The smallest hackathon implementation is one cache read/write and one deduplicated import queue after the core database flow is stable.

# Decisions and assumptions

| Decision | Context and rationale | Alternatives / trade-offs | Status |
|---|---|---|---|
| PostgreSQL is source of truth | Durable relational ownership, filters, auditability | Redis-only is unsafe; document DB adds complexity | Proposed |
| PostGIS for nearby search | Distances must be accurate and indexed | Browser math is slow/inaccurate at scale | Proposed |
| Redis/BullMQ are optional P1 | Imports and cache must not block HTTP | No queue is simpler and acceptable for seeded MVP | Proposed |
| Import asynchronously | Search returns available data immediately | Synchronous scraping is slow and fragile | Proposed |
| Source attribution is mandatory | Users need provenance and trust | Unattributed aggregation is misleading | Proposed |
| Verification is separate from lifecycle | Organizer trust, event status, and registration differ | One status field causes ambiguity | Proposed |
| Geocoder is server-side and replaceable | Protect keys and manage rate limits | Browser provider coupling is insecure | Proposed |
| Minimize location storage | Precise user location is sensitive and not needed for demo | Persisted home location improves convenience but needs consent | Proposed |
| Mock data is labeled | Current prototype has no persistence | Silent mock/production mixing harms demo trust | Existing/proposed |
| Deduplicate conservatively | Sources may describe the same event | Automatic fuzzy merging can destroy records | Proposed |
| Analytics means explicit product events | Static organizer numbers are not analytics | Vercel page analytics is not event engagement | Proposed |

No Supabase, Redis, PostGIS, worker, source allowlist, or external API is an established decision in the current code. These are recommendations, not evidence of existing integrations.

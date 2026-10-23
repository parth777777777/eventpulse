# 24-hour implementation plan

Prioritize one reliable vertical slice: sign in, choose a demo/manual location, query nearby published events, view detail, bookmark, and create one organizer event.

| Phase | Goal and concrete tasks | Dependencies | Deliverable / acceptance | Priority |
|---|---|---|---|---|
| 1 Stabilize (1–2h) | Fix route/build issues; inventory env; add loading/error/empty states | Existing app | All routes render and build | P0 |
| 2 Data/auth (3–4h) | Supabase Auth, profiles/organizers/events/bookmarks schema and RLS; seed four records | Supabase | Signed-in user can read published events and own bookmarks | P0 |
| 3 Geo search (2–3h) | Add nullable coordinates, PostGIS query, manual Mumbai default, radius validation | DB | Results have server-computed distances and correct radius boundary | P0 |
| 4 Discovery/detail (2h) | Replace `events` reads with server actions/route handlers; detail and registration URL | Data layer | Search/filter/detail work after reload | P0 |
| 5 Organizer (3h) | Create/edit/publish ownership flow and minimal dashboard counts | Auth/RLS | Organizer can publish own event; cannot edit another | P0 |
| 6 Import (3–4h) | One approved source or deterministic seed importer; normalize, provenance, dedupe | DB | Import reruns idempotently and records failures | P1 |
| 7 Redis/jobs (2–3h) | Only if service is ready: cache discovery, enqueue refresh, lock duplicate jobs | Import | Search never waits for job; degraded mode works | P2 |
| 8 Verify/demo (3h) | Build, smoke routes, responsive check, seed reset, demo script | All above | Repeatable judge flow and known fallback | P0 |

Parallel workstreams: developer A owns schema/auth/RLS; B owns server discovery/detail and geolocation; C owns organizer UI/API; D owns importer/verification. Coordinate shared route and type changes through small commits; do not have parallel edits to `eventpulse-pages.tsx` without ownership.

If time runs short, cut Redis, live scraping, organizer verification, and analytics. If geocoding fails, use manually verified seed coordinates and leave user-entered unresolved addresses nullable. If the database is unavailable, keep the prototype clearly labeled as demo-only; do not imply persistence. If Redis is unavailable, bypass it. If an external source is not legally/permissibly verified, use a seeded adapter rather than scraping.

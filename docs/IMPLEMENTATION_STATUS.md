# Implementation status

Evidence is based on the inspected routes and components. A UI control is not treated as proof of backend behavior.

| Feature | Current status | Evidence | Missing work | Priority |
|---|---|---|---|---|
| Discovery home | Implemented as prototype | `EventPulseApp` | Real data | P0 |
| Search | Partial, local filter | `query` and `useMemo` in `eventpulse-app.tsx` | Server search, debounce, validation | P0 |
| Filters | Partial, local tabs | `filter` state | Persisted/query-backed filters | P0 |
| Location selection | Partial visual flow | location popover | Geolocation, search, persistence | P0 |
| Distance | Mock only | `EventItem.distance` | PostGIS calculation | P0 |
| Event Radar | Partial demo | CSS rings and radius filter | Real coordinates/map | P1 |
| Detail pages | Partial | `EventDetailPage` | Real record, registration/share actions | P0 |
| Organizer CRUD | Partial form/UI | organizer routes and `preventDefault` | Auth, API, database | P0 |
| Organizer dashboard | Mock | static metrics and events | Aggregation and authorization | P1 |
| Verification | Missing | no implementation | workflow and moderation | P1 |
| Bookmarks | Local only | React state | Authenticated persistence | P0 |
| Calendar export | Missing | no export action | ICS generation/download | P1 |
| Sharing | Visual button only | detail aside | Web Share/copy URL | P1 |
| Authentication | Missing | no auth dependency/routes | Supabase Auth | P0 |
| Database | Missing | hardcoded `events` | Postgres/PostGIS schema | P0 |
| Ingestion | Missing | no worker/source code | allowlisted adapter | P1 |
| Geocoding | Missing | no provider | server adapter | P1 |
| Redis/jobs | Missing | no dependency/code | optional BullMQ | P2 |
| Deduplication | Missing | no IDs beyond demo IDs | source identity strategy | P1 |
| Analytics | Demo only | static organizer metrics; Vercel Analytics in production | product events | P1 |
| Moderation | Missing | no reports | RLS/admin workflow | P2 |
| Tests | Missing | no test script | unit/e2e smoke tests | P0 |
| Error handling | Minimal | no data/API error paths | loading/empty/error contracts | P1 |
| Responsive UI | Partial implemented | mobile CSS in `globals.css` | verify all new flows | P1 |
| Accessibility | Partial | labels and button aria labels in places | keyboard/focus/audit | P1 |

Most likely live-demo failures are reloads losing bookmarks/location, organizer submit doing nothing, static/misleading distances, and registration/share buttons having no effect. Critical gap order: stabilize routes, add Supabase schema/auth, implement discovery/detail/bookmark vertical slice, then organizer CRUD.

# API contracts

## Existing inventory

No route handlers, API routes, or server actions were found in the inspected app. Route files render UI only. Form submission in `OrganizerFormPage` calls `preventDefault`; buttons such as registration and sharing do not persist or call a backend.

## Minimum proposed contract

All contracts below are proposed, not implemented. Validate with Zod or equivalent on the server, enforce authorization, and return consistent `{ data, error, meta }` envelopes.

| Operation | Method/route | Auth | Purpose |
|---|---|---|---|
| Nearby discovery | `GET /api/events?lat&lng&radiusKm&category&from&to&source` | Public | PostGIS search; returns `distanceKm`, freshness, and import status |
| Detail | `GET /api/events/:id` | Public | Published event and attribution |
| Create | `POST /api/organizer/events` | Organizer | Validate dates, URL, fee, venue, ownership |
| Edit/publish/cancel | `PATCH /api/organizer/events/:id` | Owner/moderator | State transition with audit |
| Bookmark | `PUT/DELETE /api/events/:id/bookmark` | User | Idempotent save/remove |
| Saved | `GET /api/me/bookmarks` | User | User-scoped events |
| Verification | `POST /api/organizers/:id/verification` | Organizer | Submit evidence for review |
| Report | `POST /api/events/:id/reports` | User | Moderation intake |
| Import request | `POST /api/imports` | Admin/service | Enqueue only configured source IDs; never arbitrary URLs |
| Analytics | `GET /api/organizer/analytics` | Organizer | Aggregated views/clicks by owned event |

Discovery accepts finite coordinates and a bounded radius; the server clamps radius, rejects invalid ranges, and returns no distance for online/unresolved events. Error cases include 400 validation, 401 unauthenticated, 403 ownership, 404 missing/unpublished, 409 duplicate/state conflict, 429 rate limit, and 503 dependency unavailable. Registration links are external redirects only after validation; EventPulse must not claim registration completion without a registration integration.

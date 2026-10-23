# Testing and demo reliability

## Existing setup

`package.json` defines `dev`, `build`, and `start` only. No test or lint command is defined, and no test files were found in the inspected tree. Build status should be verified separately; do not treat the prototype as tested merely because it renders in Preview.

## Verification checklist

After backend work, verify: every route builds; search and category filters return expected records; PostGIS distance and radius boundaries are correct; unresolved and online events have no false distance; changing location changes results; bookmarks survive reload and remain user-scoped; organizer ownership blocks cross-user edits; source labels link to attribution; duplicate imports are idempotent; import failures retry and remain observable; cache keys separate geographic cells; registration links are validated; ICS export contains timezone-aware dates; share copies a URL; mobile layout has no overflow; empty/loading/error states are usable; keyboard focus and labels work.

Add unit tests for normalization, coordinate validation, dedupe keys, status transitions, and distance boundary behavior. Add route-level tests for RLS/authorization and one browser smoke test for discovery → detail → bookmark → organizer create.

## Judge demo

1. Open Discover and show curated events with source labels.
2. Search “AI” and select a category.
3. Open Event Radar and change radius, clearly describing the current coordinate/demo limitation if the real map is not shipped.
4. Open a detail page and show date, venue, fee, and source attribution.
5. Demonstrate saved state only if persistence is implemented; otherwise label it as prototype state.
6. Open Organizer and show create/edit only if the backend path is live.

Do not present static distances, demo metrics, local bookmarks, visual buttons, or CSS radar markers as live production features. Do not claim scraping, geocoding, auth, Redis, analytics, or registration completion without direct evidence.

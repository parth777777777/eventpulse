# EventPulse Phase 2 — Acceptance Criteria

Use this as a pass/fail checklist. Mark each item `PASS`, `FAIL`, or `BLOCKED`, and attach test evidence. Do not mark an item passed based only on code inspection when runtime verification is possible.

## Location
- [ ] **LOC-1** — Current location works when permission is granted; selected coordinates reach the search API.
- [ ] **LOC-2** — Denied/unavailable geolocation leaves place search/manual selection available.
- [ ] **LOC-3** — Selecting a place resolves to a valid latitude/longitude pair through a real geocoder.
- [ ] **LOC-4** — Default radius is 25 km in initial state and request behavior.
- [ ] **LOC-5** — Missing location never silently falls back to fixed Mumbai coordinates.
- [ ] **LOC-6** — Search origin is not confused with each event's venue coordinates.

## Filters and URL state
- [ ] **FIL-1** — Category changes the actual results.
- [ ] **FIL-2** — Date range changes the actual results.
- [ ] **FIL-3** — Keyword search changes the actual results.
- [ ] **FIL-4** — Filters update without a full-page reload.
- [ ] **URL-1** — URL query parameters encode meaningful search state: origin coordinates, radius, category, date range, and keyword.
- [ ] **URL-2** — Refreshing or opening a copied discovery URL restores the search state.
- [ ] **URL-3** — Malformed/out-of-range query parameters are handled safely and predictably.

## Geographic correctness
- [ ] **GEO-1** — Displayed distances use event coordinates and the selected origin.
- [ ] **GEO-2** — Radius filtering uses kilometers consistently.
- [ ] **GEO-3** — A known point inside the radius is included; a point outside is excluded.
- [ ] **GEO-4** — Missing/invalid coordinates never produce fabricated distances or fake map positions.
- [ ] **GEO-5** — Geographic distance is straight-line; no road-routing dependency is introduced.

## Results and map
- [ ] **RES-1** — Home discovery uses live persisted/API data, not hardcoded sample events.
- [ ] **RES-2** — `/discover` uses live persisted/API data.
- [ ] **MAP-1** — Cards and markers represent the same active result set.
- [ ] **MAP-2** — Selecting a marker identifies the corresponding event.
- [ ] **MAP-3** — Selecting a card focuses/highlights its marker.
- [ ] **MAP-4** — Changing filters updates markers and cards together.
- [ ] **MAP-5** — Desktop shows cards plus an interactive map.
- [ ] **MAP-6** — Mobile uses a vertically stacked map-and-cards layout.
- [ ] **MAP-7** — Map-provider failure has a useful fallback and does not break list discovery.

## Event detail and registration
- [ ] **EVT-1** — Each event card links to a stable `/events/[id]` URL.
- [ ] **EVT-2** — Direct navigation to the URL works without first visiting discovery.
- [ ] **EVT-3** — Details are fetched from persisted data for the requested ID.
- [ ] **EVT-4** — Available title, description, date/time, format, venue, fee, category, registration deadline/link, and source attribution are displayed appropriately.
- [ ] **EVT-5** — Missing optional fields render gracefully.
- [ ] **EVT-6** — Invalid, unpublished, draft, or unverified events are not exposed to anonymous users.
- [ ] **EVT-7** — Registration action uses the actual stored registration URL; missing URL is handled sensibly.
- [ ] **EVT-8** — Loading, not-found, unpublished, and API-error states are distinguishable.

## Empty/error states
- [ ] **ERR-1** — A successful empty response shows an empty-results state.
- [ ] **ERR-2** — Empty results suggest expanding radius (e.g. 25 km → 50 km) and/or relaxing category/date filters.
- [ ] **ERR-3** — Suggested changes require user action; filters are not silently changed.
- [ ] **ERR-4** — API/network failure shows an error and retry path, not a false empty state.

## Regression and engineering
- [ ] **REG-1** — Organizer application and event creation still work.
- [ ] **REG-2** — Authentication behavior is not regressed.
- [ ] **ENG-1** — Production build passes.
- [ ] **ENG-2** — `git diff --check` passes.
- [ ] **ENG-3** — No secrets or unrelated generated/dependency files are committed.
- [ ] **ENG-4** — New provider/configuration requirements are documented.
- [ ] **ENG-5** — Final report records actual test commands, outcomes, and limitations.

## Suggested test scenarios
1. Grant geolocation and search within 25 km.
2. Deny geolocation and choose a place manually.
3. Choose a location outside Mumbai and confirm results are based on that origin.
4. Apply category, date, and keyword filters individually and in combination.
5. Copy a filtered discovery URL into a fresh browser context and confirm state restoration.
6. Verify known-coordinate distances and radius boundaries.
7. Select a marker, select a card, then change filters and check synchronization.
8. Open an event detail URL directly in a fresh/anonymous context.
9. Confirm draft/unverified records cannot be seen publicly.
10. Compare a successful zero-result search with an API failure.
11. Test a narrow mobile viewport.
12. Run production build, available tests, and diff checks.

## Release gate
All critical criteria must pass before Phase 2 is declared complete. Any `BLOCKED` criterion must include the blocker, user-visible impact, exact configuration or action needed, and a minimal workaround where appropriate. Never fabricate test evidence.

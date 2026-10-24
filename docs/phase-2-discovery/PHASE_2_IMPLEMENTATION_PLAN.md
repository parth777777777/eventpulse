# EventPulse Phase 2 — Implementation Plan

**Status:** Scope agreed; implementation not yet started by this document.
**Scope:** Location-based discovery, live results, filters, interactive map, and shareable event details.

## 1. Product contract

### Location
- Support browser geolocation when the user explicitly chooses current location.
- Support searchable or manually selected places.
- Convert selected places into real latitude/longitude coordinates through a real geocoding mechanism.
- Default search radius: **25 km**.
- Never silently fall back to Mumbai coordinates when location is unavailable.
- Keep the selected search origin distinct from event venue coordinates.

### Discovery and filters
- Both the home discovery experience and `/discover` must use persisted/live event data, not hardcoded arrays as the displayed source of truth.
- Support category, date range, and keyword filters.
- Filter changes must affect the actual result set without a full page reload.
- Preserve the selected origin, radius, and filters in URL query parameters.
- Show distinct loading, error, and empty states.
- Do not turn API failures into an empty-results state.

### Geographic behavior
- Reuse the existing nearby-events API and `nearby_published_events` RPC where appropriate.
- Use stored event coordinates and straight-line geographic distance.
- Keep radius units consistent (kilometers) and validate coordinates/radius.
- Do not fabricate coordinates or distances.
- Events with invalid/missing coordinates must not be placed at fake map locations.

### Map and cards
- Show cards and an interactive map together on desktop.
- On mobile, use a vertically stacked map-and-cards layout.
- Only plot events returned by the active search and with valid coordinates.
- Selecting a marker must identify its event; selecting a card must focus/highlight the corresponding marker.
- Map and cards must remain synchronized after filter changes.
- Provide a useful fallback if the map provider fails.

### Event details
- Use a stable shareable route: `/events/[id]`.
- Fetch the event from persisted data independently of the discovery page state.
- Show available fields: title, description, date/time, venue or online format, location/map link when relevant, fee, category, registration deadline, registration URL, and source attribution.
- Missing optional fields must render gracefully.
- Unpublished/draft/unverified events must not become publicly accessible through the detail route.
- Registration must use the stored registration URL; handle a missing URL sensibly.

### Empty results
- Explain that no events match the current search.
- Offer a one-click radius expansion, such as 25 km to 50 km.
- Suggest relaxing category/date filters where useful.
- Do not silently change the user's selected filters or location.
- Distinguish an empty successful response from an API/network failure.

## 2. Workstreams

### Workstream 1 — Reconnaissance
- Read existing documentation and inspect routes, components, API handlers, types, Supabase schema/RPC, tests, and package dependencies.
- Trace data flow for home discovery and `/discover`.
- Compare documentation to actual code/schema; document discrepancies.
- Inspect existing mapping/geocoding dependencies before selecting a provider.
- Produce a concise file-level implementation plan before substantial edits.

### Workstream 2 — API and data integration
- Reuse the existing nearby-events endpoint and RPC where appropriate.
- Verify coordinates, radius, category, date, and keyword are passed through and affect actual results.
- Add keyword filtering in the smallest compatible layer if absent.
- Standardize response types and coordinate handling.
- Preserve public visibility rules: only eligible published events appear in public discovery.

### Workstream 3 — Location and URL state
- Implement browser geolocation with permission-denied/unavailable handling.
- Implement place search/manual selection with real geocoding.
- Establish a canonical search state for origin, radius, category, date range, and keyword.
- Read and update URL query parameters without unnecessary full-page reloads.
- Validate URL parameters and handle missing/invalid locations explicitly.

### Workstream 4 — Results, map, and filters
- Connect home discovery and `/discover` to live results.
- Implement all agreed filters and clear loading/error/empty states.
- Render event markers from real coordinates.
- Synchronize marker/card selection.
- Implement the responsive stacked mobile layout.
- Keep radius filtering and distance displays geographically consistent.

### Workstream 5 — Event detail route
- Implement `/events/[id]`.
- Fetch persisted data by ID and enforce public visibility.
- Implement loading, not-found, unpublished, and API-error behavior.
- Use the actual registration URL.

### Workstream 6 — Verification and handoff
- Add/update tests for URL parameters, filters, geographic distance, visibility, and event details.
- Run production build and available automated checks.
- Review the diff and preserve unrelated changes.
- Produce an acceptance report with evidence and known limitations.

## 3. Provider/dependency policy
1. Inspect existing dependencies and configured services first.
2. Reuse a suitable existing provider if available.
3. Otherwise, propose the smallest viable map/geocoding provider choice and document usage limits, licensing/attribution, configuration, and costs/quotas before introducing substantial dependencies.
4. Do not assume a free tier or unrestricted public geocoding service.
5. Keep secret keys server-side; only intentionally public browser configuration may be exposed.
6. If credentials are missing, document exact setup requirements and ensure the UI fails gracefully.
7. Map rendering and geocoding may use separate providers.
8. Do not add road routing/travel-time features; the agreed distance metric is straight-line.

## 4. Scope boundaries

### Included
- Home and `/discover` live discovery
- Current location and place selection
- 25 km default radius
- Category, date, and keyword filters
- URL-persisted discovery state
- Interactive map and synchronized cards
- Straight-line distance
- Shareable event detail route
- Registration links
- Loading/error/empty states
- Tests and relevant documentation

### Excluded unless explicitly approved
- Scraper implementation
- New organizer/moderator workflows
- Database redesign or unrelated migrations
- Bookmark persistence
- Notifications, recommendations, or social features
- Road routing and travel-time estimates
- Broad redesign or unrelated refactoring
- Unrelated deployment changes

## 5. Execution sequence
1. Reconnaissance and file-level plan.
2. API/data contract and geographic correctness.
3. Location selection and URL state.
4. Filters, live cards, and map synchronization.
5. Event detail route and registration action.
6. Responsive/error/empty-state polish.
7. Tests, build, diff review, and acceptance report.

The order may change if repository inspection identifies a dependency, but any material deviation must be explained. The implementation must not silently omit a workstream.

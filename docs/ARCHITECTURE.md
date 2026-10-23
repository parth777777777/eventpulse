# Architecture

## Current architecture

EventPulse is a Next.js App Router application. `app/page.tsx` renders `EventPulseApp`; route files under `app/discover`, `app/radar`, `app/saved`, `app/events/[id]`, and organizer routes compose page components from `components/eventpulse-pages.tsx`. The root metadata and analytics wiring are in `app/layout.tsx`; global styling is in `app/globals.css`.

`components/eventpulse-app.tsx` is a client component. It owns the exported `events` array, query/filter state, saved IDs, and the location popover. `components/eventpulse-pages.tsx` reuses the same array and has separate local state for saved events and radar radius. There is no shared server data layer, API, database, auth, or server action.

```mermaid
flowchart TD
  Layout[app/layout.tsx] --> Routes[App Router routes]
  Routes --> Home[EventPulseApp]
  Routes --> Pages[eventpulse-pages.tsx]
  Home --> Data[events in eventpulse-app.tsx]
  Pages --> Data
  Home --> CSS[app/globals.css]
  Pages --> CSS
```

## Proposed target architecture

Use one Next.js application plus one worker process, not microservices. Supabase Auth and PostgreSQL/PostGIS are authoritative. A small Redis/BullMQ deployment is optional P1 infrastructure for asynchronous imports.

```mermaid
flowchart LR
  Browser --> Next[Next.js UI + route handlers]
  Next --> Auth[Supabase Auth]
  Next --> DB[(PostgreSQL + PostGIS)]
  Next --> Cache[(Redis cache)]
  Next --> Queue[BullMQ]
  Queue --> Worker[Node import worker]
  Worker --> Sources[Permitted source adapters]
  Worker --> Geo[Geocoding provider]
  Worker --> DB
  Worker --> Cache
  Next --> Obs[Logs and error monitoring]
```

Boundaries: the UI renders and sends validated requests; Next.js owns request validation and authorization; Supabase Auth owns sessions; Postgres owns events, users, organizers, bookmarks, and audit records; PostGIS owns distance queries; Redis owns ephemeral cache/locks only; BullMQ owns job delivery; the worker fetches allowlisted sources and normalizes records; geocoding is a replaceable server-side adapter; monitoring records failures without becoming application state.

## Discovery flow

```mermaid
sequenceDiagram
  participant U as Browser
  participant N as Next.js
  participant R as Redis
  participant D as PostGIS
  participant Q as BullMQ
  participant W as Import worker
  U->>N: location, radius, filters
  N->>R: read normalized cache key
  N->>D: nearby event query
  D-->>N: current matching events
  N->>Q: enqueue refresh if stale and unlocked
  N-->>U: results + refresh status
  Q->>W: import job
  W->>D: upsert normalized events
  W->>R: invalidate affected keys
```

Smallest viable hackathon architecture: Supabase Auth, one Postgres schema with PostGIS, server-side discovery/detail actions, organizer CRUD, and a static allowlisted seed/import command. Add Redis/BullMQ only after the vertical slice works; use an in-process admin-triggered import fallback if infrastructure is unavailable.

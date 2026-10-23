# EventPulse

EventPulse is a dark, hyperlocal event-discovery prototype for finding workshops, meetups, hackathons, and opportunities near a selected city. Its differentiators are source labels, distance-oriented discovery, a radar view, and an organizer workspace.

## Current status

The current app is a client-rendered prototype backed by exported in-memory demo data. Discovery, search filtering, category tabs, location popover, bookmarks, radar radius filtering, event details, organizer screens, and responsive styling are represented in the UI. Authentication, persistence, real geographic queries, geocoding, imports, Redis, jobs, moderation, and live analytics are not implemented.

## Stack

Verified in `package.json`: Next.js 16.4.3 App Router, React 19, TypeScript 5.7.3, Tailwind CSS 4, `lucide-react`, `@vercel/analytics`, and Base UI/shadcn support. Event data and UI state live in `components/eventpulse-app.tsx` and `components/eventpulse-pages.tsx`.

## Setup

Prerequisites: Node.js compatible with Next.js 16 and pnpm 12.3.4.

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

Only `dev`, `build`, and `start` scripts are defined. No lint or test script is currently defined. The app does not require environment variables for the demo; inspect `.env.development.local` before adding any production integration.

## Mock data

`events` in `components/eventpulse-app.tsx` contains four hardcoded `EventItem` records. Images are remote Unsplash URLs. Saved events, organizer metrics, and location choices are local React state or static JSX; they reset on reload and are not shared between routes.

## Limitations

There is no database, auth, API route, server action, geocoder, importer, queue, Redis cache, PostGIS query, registration tracking, calendar export, or real map. Several buttons are visual or prevent form submission only. Treat all distance, counts, source labels, and organizer metrics as demo values.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Geolocation](docs/GEOLOCATION.md)
- [API contracts](docs/API_CONTRACTS.md)
- [Scraping pipeline](docs/SCRAPING_PIPELINE.md)
- [Redis and jobs](docs/REDIS_AND_JOBS.md)
- [Implementation status](docs/IMPLEMENTATION_STATUS.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Decisions and assumptions](docs/DECISIONS_AND_ASSUMPTIONS.md)
- [Testing and demo](docs/TESTING_AND_DEMO.md)

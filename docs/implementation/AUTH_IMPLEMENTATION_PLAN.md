# EventPulse Authentication Implementation Plan

**Status:** Core authentication implementation complete through AUTH-08; password recovery deferred
**Scope:** Core email/password authentication foundation only
**Canonical source:** This document defines the intended authentication architecture and step dependencies.

## Objective and scope

Add a production-minded Supabase Auth foundation to EventPulse without changing the public event-discovery experience. The core flow includes:

- Email/password signup and login
- Supabase-managed email confirmation
- Cookie-backed persistent sessions
- Logout
- Next.js 16 `proxy.ts` session refresh
- Safe post-login redirects
- Protected `/saved` and organizer routes
- Authenticated identity available for future bookmarks and organizer ownership
- Accessible loading, validation, and error states

This phase does **not** implement persistent bookmarks, organizer CRUD, event ownership, social login, passwordless login, payments, scraping, or a custom authentication system.

Password recovery is deliberately deferred until the core flow passes verification. It is the next authentication milestone, not part of the initial core implementation.

## Current-state findings

Verified against the repository:

- [package.json](../../package.json) declares Next.js `16.4.3`, React 19, TypeScript `5.7.3`, Tailwind CSS 4, and pnpm `12.3.4`.
- [app/](../../app/) contains App Router pages only. There are no route handlers, server actions, API routes, middleware, or `proxy.ts`.
- [components/eventpulse-app.tsx](../../components/eventpulse-app.tsx) is a client component with hardcoded exported demo events, local search/filter state, and local bookmark state.
- [components/eventpulse-pages.tsx](../../components/eventpulse-pages.tsx) renders discover, saved, radar, detail, and organizer views using the same in-memory events. Organizer forms call `preventDefault()` and do not persist.
- [app/layout.tsx](../../app/layout.tsx) owns metadata, global CSS, and production Vercel Analytics.
- [app/globals.css](../../app/globals.css) contains the existing dark visual system, violet/cyan accents, navigation, forms, responsive rules, and focus styling.
- [next.config.mjs](../../next.config.mjs) sets `typescript.ignoreBuildErrors: true`; this is a verification risk and must be investigated separately from authentication changes.
- No Supabase dependency, environment variable, database migration, auth route, auth component, or test script was found.
- [README.md](../../README.md), [docs/ARCHITECTURE.md](../ARCHITECTURE.md), [docs/API_CONTRACTS.md](../API_CONTRACTS.md), [docs/DATA_MODEL.md](../DATA_MODEL.md), [docs/IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md), [docs/IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md), and [docs/DECISIONS_AND_ASSUMPTIONS.md](../DECISIONS_AND_ASSUMPTIONS.md) describe Supabase and persistence as proposed target architecture, not current functionality.

The existing `/`, `/discover`, `/radar`, and `/events/[id]` routes are public demo discovery surfaces. `/saved` is local/demo state, and organizer pages are visual/non-persistent prototypes.

## Architecture decisions

### Supabase and session ownership

- Use `@supabase/ssr` and `@supabase/supabase-js`.
- Supabase Auth owns password hashing, JWT issuance, refresh-token rotation, email confirmation, and session lifecycle.
- Do not implement custom JWT issuance, password storage, refresh logic, or token rotation.
- Use a browser client in `lib/supabase/browser.ts` for interactive browser auth state.
- Use a server client in `lib/supabase/server.ts` for server components, route handlers, and server actions.
- Use a shared `lib/supabase/proxy.ts` helper from a root `proxy.ts`.
- The proxy refreshes the session and propagates cookies; it is not the sole authorization boundary.

### Next.js 16 proxy and server verification

The project declares Next.js 16.4.3, so use `proxy.ts`, not legacy `middleware.ts`. Protected server operations must call the server Supabase client and verify the current user with `supabase.auth.getUser()`. UI hiding and proxy redirects are convenience boundaries only; they are insufficient authorization.

### Route policy

Public routes:

- `/`
- `/discover`
- `/radar`
- `/events/[id]`

Protected routes:

- `/saved`
- `/organizer`
- `/organizer/events/new`
- `/organizer/events/[id]/edit`

Authentication alone does not grant organizer privileges or event ownership. Ownership and organizer roles remain future database/RLS concerns.

### Safe redirects

Accept only same-origin relative paths beginning with `/` and reject values beginning with `//`, containing a scheme, or otherwise resolving to an external origin. Invalid or absent `next` values fall back to `/`. Validate on the server immediately before redirecting, even if the client already validated the value.

### UI preservation

Reuse the existing dark shell, typography, field styles, buttons, focus treatment, and navigation. Add auth-specific UI only. Do not redesign discovery or perform unrelated refactoring. Replace the static account/avatar affordance only where needed to show authenticated identity and logout.

### Demo-only boundaries

Adding authentication does not make bookmarks persistent and does not make organizer forms functional. The implementation must retain clear demo labeling until domain tables, server operations, ownership checks, and RLS exist.

## Routes and files

### Routes to create

- `app/(auth)/login/page.tsx` — email/password login with validated `next`.
- `app/(auth)/signup/page.tsx` — email/password signup and confirmation-pending state.
- `app/auth/callback/route.ts` — exchange Supabase callback code, handle confirmation, and redirect safely.
- `app/auth/logout/route.ts` or an equivalent server action — sign out and redirect to a public route.

### Routes to protect

Protect `/saved` and all organizer routes in `proxy.ts`, then repeat `getUser()` checks in any server-side operation. An anonymous request redirects to `/login?next=<encoded-internal-path>`.

### Routes that remain public

Keep the home page, discovery, radar, and event details accessible without authentication. Do not require login merely to browse public events.

### Planned shared modules

| File | Responsibility |
|---|---|
| `lib/supabase/browser.ts` | Public browser Supabase client |
| `lib/supabase/server.ts` | Cookie-aware server Supabase client |
| `lib/supabase/proxy.ts` | Next.js 16 session refresh and cookie propagation |
| `lib/auth/redirects.ts` | Internal return-path validation |
| `lib/auth/errors.ts` | Safe provider-error mapping |
| `components/auth/auth-form.tsx` | Shared accessible form behavior where it reduces duplication |
| `components/auth/account-menu.tsx` | Authenticated identity and logout affordance |
| `components/auth/auth-state.tsx` | Optional client auth-state subscription and revalidation |
| `proxy.ts` | Root proxy entry point and protected-route redirect policy |
| `app/globals.css` | Auth-only responsive, validation, loading, and focus additions |

### Existing files to modify selectively

- [package.json](../../package.json): add Supabase packages; add test scripts only when test setup is implemented.
- [pnpm-lock.yaml](../../pnpm-lock.yaml): generated by dependency installation in an implementation step.
- [app/layout.tsx](../../app/layout.tsx): preserve metadata/analytics; change only if an auth provider is demonstrably required.
- [components/eventpulse-app.tsx](../../components/eventpulse-app.tsx): shared account identity/menu integration without changing public discovery semantics.
- [components/eventpulse-pages.tsx](../../components/eventpulse-pages.tsx): shared header/account integration and protected-page states.
- [app/saved/page.tsx](../../app/saved/page.tsx), organizer route entries: retain thin route structure while enforcing protection.
- [next.config.mjs](../../next.config.mjs): investigate and, when feasible, remove `typescript.ignoreBuildErrors`; do not claim a clean build while errors are ignored.

Do not initially change the event demo model, public route behavior, or [components/ui/button.tsx](../../components/ui/button.tsx).

## Configuration

Required variables, with actual values kept out of the repository:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

If compatibility with an older Supabase project requires `NEXT_PUBLIC_SUPABASE_ANON_KEY`, document that temporary choice rather than silently supporting multiple sources indefinitely. Never expose a service-role key to browser code.

Supabase dashboard requirements:

- Enable email/password provider.
- Enable email confirmation outside local development.
- Configure site URL for local, staging, and production environments.
- Allow only known callback URLs ending in `/auth/callback`.
- Configure confirmation email links for the callback code flow.
- Configure email delivery and rate limits before production use.

## Database and RLS policy

No application table, profile table, trigger, or migration is required for the core authentication flow. `auth.users.id` is the authoritative identity. Do not create a premature `profiles` table.

When persistent user-owned data is later introduced:

- Derive user identity from `auth.uid()`/validated server user, never from a client-provided ID.
- Enable RLS on every user-owned table.
- Bookmarks must constrain `user_id = auth.uid()` for select/insert/delete.
- Organizer/event policies must verify `organizers.owner_id = auth.uid()` in SQL.
- Organizer roles, moderator claims, publishing rules, and profile schema require a separate reviewed migration.

## Ordered implementation steps

Each step is independently testable after its prerequisites. No step is complete until its acceptance criteria are verified and recorded in the status document.

### AUTH-01 — Confirm baseline and configuration contract

**Dependencies:** None
**Scope:** Add no application behavior yet. Record the exact Next.js version, existing TypeScript/build risks, required environment-variable names, and public/protected route matrix. Establish the test command strategy.

**Acceptance criteria:**

- Baseline findings match the repository.
- No Supabase integration is falsely reported as existing.
- `typescript.ignoreBuildErrors` is tracked as a known risk.
- No secrets are added.

**Tests/evidence:** Repository inspection and a baseline build/type-check attempt, with ignored-error behavior explicitly reported.

### AUTH-02 — Add Supabase dependencies and clients

**Dependencies:** AUTH-01
**Scope:** Add `@supabase/ssr` and `@supabase/supabase-js`; implement browser and cookie-aware server clients; validate public configuration.

**Acceptance criteria:**

- Browser code imports only public variables.
- Server client reads/writes auth cookies through Next.js APIs.
- Missing configuration fails explicitly rather than falling back to mock auth.

**Tests/evidence:** Module/type checks and a configuration failure test.

### AUTH-03 — Implement Next.js 16 session proxy

**Dependencies:** AUTH-02
**Scope:** Create root `proxy.ts` and shared proxy helper for session refresh, cookie propagation, public-route matching, and protected-route redirects.

**Acceptance criteria:**

- Next.js 16 `proxy.ts` convention is used.
- Session refresh cookies reach the browser.
- Anonymous protected navigation redirects to login with a safe `next`.
- Public discovery routes remain accessible anonymously.

**Tests/evidence:** Proxy unit tests for route classification and redirect behavior; integration/browser verification with an authenticated and anonymous session.

### AUTH-04 — Implement callback and safe redirect utilities

**Dependencies:** AUTH-02
**Scope:** Create `/auth/callback`, code exchange handling, confirmation failure states, and server-side internal redirect validation.

**Acceptance criteria:**

- Valid callback codes establish a session.
- Invalid/expired codes produce an explicit failure state.
- External, protocol-relative, and malformed return URLs fall back safely.

**Tests/evidence:** Redirect unit tests and callback integration tests using a dedicated Supabase test project.

### AUTH-05 — Implement signup and email confirmation

**Dependencies:** AUTH-03, AUTH-04
**Scope:** Create `/signup` with accessible email/password fields, confirmation matching, loading/disabled states, provider error handling, and confirmation-pending feedback.

**Acceptance criteria:**

- Valid signup calls Supabase Auth.
- Duplicate and weak-password responses are useful but do not leak unnecessary account details.
- Confirmation-required users are not presented as fully authenticated until callback completion.

**Tests/evidence:** Signup success, duplicate, weak-password, validation, callback success, and callback error tests.

### AUTH-06 — Implement login and logout

**Dependencies:** AUTH-03, AUTH-04
**Scope:** Create `/login`, preserve validated internal destinations, add logout operation, and handle invalid credentials, unconfirmed email, loading, and expired-session states.

**Acceptance criteria:**

- Valid credentials establish a persistent session.
- Invalid credentials do not create an authenticated UI state.
- Login returns to a safe intended route or `/`.
- Logout invalidates the session and returns to a public route.

**Tests/evidence:** Login success/failure, refresh persistence, logout, expired-session, and open-redirect tests.

### AUTH-07 — Integrate protected routes and authenticated identity

**Dependencies:** AUTH-05, AUTH-06
**Scope:** Protect `/saved` and organizer routes; add server-side identity checks where operations exist; add a shared account indicator/menu; preserve demo-only labels and local bookmark behavior.

**Acceptance criteria:**

- Anonymous users are redirected from every protected route.
- Authenticated users can reach protected pages.
- Authentication does not grant organizer ownership or role.
- Public discovery remains unchanged and anonymous.
- No UI implies that bookmarks or organizer forms are persistent.

**Tests/evidence:** Protected/public route tests, account-menu/logout browser flow, and public discovery regression checks.

### AUTH-08 — Add minimal automated verification and build safety

**Dependencies:** AUTH-01 through AUTH-07
**Scope:** Add the smallest suitable automated test setup for safe redirects, session persistence, logout, protected routes, and public routes. Investigate existing TypeScript errors separately, fix auth-caused errors, and remove `ignoreBuildErrors` when feasible.

**Acceptance criteria:**

- Required auth tests execute through a documented command.
- Actual pass/fail output is recorded.
- Authentication-related TypeScript errors are fixed.
- A build with ignored TypeScript errors is not reported as clean verification.

**Tests/evidence:** Test command, targeted results, type-check/build result, and any pre-existing failures clearly separated.

### AUTH-09 — Handoff and deferred milestone review

**Dependencies:** AUTH-08
**Scope:** Update this plan/status pair with actual files, commands, tests, deviations, known limitations, and the next milestone: password recovery.

**Acceptance criteria:**

- Status matches the worktree.
- No deferred feature is reported as implemented.
- Password recovery is recorded as the next authentication milestone.

**Tests/evidence:** Documentation consistency review and clean handoff checklist.

## Security requirements

- Use Supabase-managed JWT sessions; no custom token issuance.
- Refresh sessions through Next.js 16 `proxy.ts`.
- Use secure, appropriately scoped cookies through `@supabase/ssr`; do not manually copy tokens into local storage.
- Verify users server-side with `getUser()` before protected operations.
- Derive ownership from the verified user, never request payloads.
- Validate redirects server-side and reject external/protocol-relative targets.
- Never expose a service-role key or other privileged secret in client bundles.
- Treat proxy/UI protection as insufficient without server authorization.
- Add RLS before introducing persistent bookmarks, profiles, organizer records, or events.
- Do not use client metadata as an authorization role.
- Do not claim success when the callback, session refresh, or logout operation fails.

## Deferred work

- Password recovery: next authentication milestone after AUTH-08.
- Profiles and display-name persistence: only with a demonstrated product requirement.
- Persistent bookmarks and bookmark RLS: requires a real events/bookmarks schema.
- Organizer roles, ownership, verification, and event CRUD: requires reviewed schema, server mutations, and RLS.
- Social login, passwordless login, payments, registration tracking, scraping, geocoding, Redis/jobs, moderation, and analytics changes.
- Broad UI redesign or unrelated refactoring.

## Explicit constraints

1. Do not implement custom JWTs, password storage, refresh-token rotation, or bespoke auth.
2. Do not create a profiles table or application migration prematurely.
3. Do not gate public event discovery.
4. Do not treat local bookmarks or `preventDefault()` organizer forms as persistent.
5. Do not redesign unrelated UI.
6. Do not mark work complete without executed verification.
7. Keep this plan and the status tracker synchronized when architecture or scope changes.

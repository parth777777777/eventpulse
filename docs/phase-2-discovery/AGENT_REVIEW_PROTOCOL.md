# EventPulse Phase 2 — Agent and Review Protocol

## Roles

### Lead implementation agent
The lead coding agent owns implementation on one branch. It is responsible for reconnaissance, planning, implementation, testing, remediation, and the final handoff.

It must:
- Read project documentation and inspect the actual repository before editing.
- Compare existing routes, components, API behavior, schema/RPC, dependencies, and tests against the Phase 2 plan.
- Preserve all existing/unrelated changes.
- Avoid destructive Git commands, blind staging, or changes to unrelated files.
- Reuse existing architecture and dependencies where practical.
- Implement all included workstreams end to end.
- Run relevant tests, production build, and `git diff --check`.
- Report evidence and remaining blockers honestly.

It must not:
- Implement scraping, bookmarks, social features, or unrelated phases.
- Introduce paid/external services or substantial architectural dependencies without explaining requirements and obtaining approval where necessary.
- Expose secret keys in browser code.
- fabricate events, coordinates, distances, successful API responses, or test results.
- Make draft/unverified events public.
- Claim completion solely because the UI renders.

### Independent reviewer: Claude
Claude reviews the lead agent's completed diff and evidence against `ACCEPTANCE_CRITERIA.md`.

Claude should focus on:
- Geographic correctness, units, invalid coordinates, and radius boundaries.
- Real API/data flow and all filters.
- URL state parsing, updates, and refresh/share behavior.
- Public visibility of events and direct detail-route access.
- Marker/card synchronization and responsive layout.
- Error versus empty-result handling.
- Registration URL correctness and regression risk.

Each finding should include:
- Severity: blocker / high / medium / low.
- File path and relevant code location when possible.
- Why it violates a criterion.
- A reproducible test or concrete evidence.
- A recommended minimal fix.

Claude should not edit the same files concurrently with the lead agent. Its default role is independent review, not a parallel rewrite.

## Execution protocol
1. Lead agent inspects the repository and produces a concise implementation plan.
2. Lead agent implements Phase 2 and records test evidence.
3. Lead agent returns a changed-file summary and criterion-by-criterion status.
4. Claude reviews the actual diff and test evidence independently.
5. Lead agent validates findings, fixes confirmed issues, and explains rejected findings.
6. Lead agent reruns relevant tests, production build, and `git diff --check`.
7. Final acceptance is based on evidence, not agent self-assessment.

## Required final handoff
- Files changed and purpose.
- Provider/dependency choices and setup requirements.
- API/query parameter contract and URL-state behavior.
- Tests and commands actually run, with outcomes.
- Production build and diff-check results.
- Acceptance criteria marked PASS / FAIL / BLOCKED with evidence.
- Known limitations and manual setup still required.
- Confirmation that unrelated changes were preserved.

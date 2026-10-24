# EventPulse Phase 2 — Planning Pack

This pack freezes the Phase 2 discovery scope and acceptance gates. It deliberately does **not** include the final coding-agent prompt yet.

## Files
- `PHASE_2_IMPLEMENTATION_PLAN.md` — product contract, workstreams, provider policy, boundaries, and execution sequence.
- `ACCEPTANCE_CRITERIA.md` — pass/fail requirements and reproducible verification expectations.
- `AGENT_REVIEW_PROTOCOL.md` — lead-agent responsibilities and Claude's independent review process.

## How to use
1. Copy this directory into the repository under `docs/phase-2-discovery/`.
2. Ask the lead coding agent to inspect the repository and these documents before implementation.
3. After confirming the plan still matches the repository, create the separate lead-agent prompt.
4. Have Claude review the completed diff against `ACCEPTANCE_CRITERIA.md`.

These are planning artifacts only; no application source code is changed by this pack.

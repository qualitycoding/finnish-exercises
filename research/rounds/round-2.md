# Round 2 (R3 + R4 + R6) — 2026-11-07

R3: C-001 and C-004 are single-source (one publisher; tier-4 pair) → risks R-003, R-004 with mitigations; C-005 single author but the design satisfies it either way. Version check: knowledge item K-20261009T160117Z (browsers cannot be downloaded in the sandbox) contradicted by C-012.
R6 spikes (committed under research/spikes/):
- `scoring-finnish/` — reference scoring on Finnish inputs: ä/ö slip ½, length slip in a short word 0, inflection and gradation matched by stems, but the stem `ei` matched *eilen* → D-004 whole-word rule (C-011).
- `playwright-launch.mjs` — Chromium 153 launched from /opt/pw-browsers (C-012).
- `satisfiability/` — a scoring and validator implementation passes all frozen unit and validator tests (24/24); `node --test tests/` (directory) failed while `node --test tests/*.test.mjs` passed (C-013).
- Pins: `npm view playwright@1.63.0 version` → 1.63.0; `git ls-remote` for actions/checkout v7.0.1 and actions/setup-node v7.1.0 → SHAs in plan/ENVIRONMENT.md (C-009).

## Sources checked
| Source | URL | Accessed | Outcome | Reason |
|---|---|---|---|---|
| npm registry, playwright | https://www.npmjs.com/package/playwright | 2026-11-07 | used | C-009 |
| actions/checkout tags | https://github.com/actions/checkout | 2026-11-07 | used | C-009 |
| actions/setup-node tags | https://github.com/actions/setup-node | 2026-11-07 | used | C-009 |
| qualitycoding/swedish-exercises at b8c4f57 | https://github.com/qualitycoding/swedish-exercises | 2026-11-07 | used | reference implementation, REFRESH.md, live-check.yml (D-001, D-016) |
| qualitycoding/skills at 0feb631 | https://github.com/qualitycoding/skills | 2026-11-07 | used | protocol v3.15, skill learning-exercise-site |

## Red verification (2B.5), 2026-11-07
Against the committed stubs (`assets/scoring.js`, `tools/validate.mjs` throwing `not implemented`, a placeholder `index.html`, the stub theme generated from the validator fixture): unit and validator tests 0 pass / 24 fail (`not implemented` errors and assertion failures; `research/spikes/red-unit-against-stubs.txt`); browser tests 0 pass / 21 fail, every one a Playwright `TimeoutError` waiting for `html[data-ready='1']` (`research/spikes/red-e2e-against-stubs.txt`). No failure came from a syntax error, missing fixture or broken test code. Satisfiability: the unit and validator tests pass 24/24 against `research/spikes/satisfiability` (lesson L-20261107T002000Z).

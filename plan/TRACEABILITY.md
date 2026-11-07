# Traceability

| Requirement | Evidence (tests / checks) | Steps |
|---|---|---|
| SC-1 published, 24 exercises live | Live site check run (live-check.yml), pages build run, CI run on `main` | S-002, S-PUBLISH |
| SC-2 10 items, correct=10, wrong≤2, validator | T-010…T-024, T-031, `node tools/validate.mjs` | S-003, S-004, S-005, S-006 |
| SC-3 retry, persistence, export/import | T-031, T-032, T-042, T-043, T-047 | S-005 |
| SC-4 register labels | V4, V5 (T-014, T-015), T-040 | S-004, S-005, S-006 |
| SC-5 speech + fallbacks | T-034, T-036, T-041, T-046 | S-005 |
| SC-6 navigation | T-033, T-045 | S-005 |
| SC-7 dated, sourced, no invention | V2 (T-012), T-044, content notes, S-ADVERSARIAL spot check | S-006, S-ADVERSARIAL |
| SC-8 learner trial + refresh | GATE-G-LEARN.md, scheduled task id | S-LEARN, S-REFRESH |
| D-004 scoring rules | T-001…T-009, T-035 | S-003 |
| D-006 UI contract | T-030…T-047 | S-005 |
| Security (threat model: hostile import file, corrupted storage, markup injection from data) | T-042 (bad import), S-ADVERSARIAL report, S-REVIEW `innerHTML` check | S-005, S-REVIEW, S-ADVERSARIAL |
| Operational (load failure diagnostics, storage failure) | T-037, T-043 | S-005 |
| Performance | No targets (static pages, ≤ ~30 kB data per theme); no performance test — recorded here as N/A by intake (no target set) | — |

## Every test → requirement

T-001…T-009 → D-004/SC-2; T-010…T-024 → D-003/SC-2/SC-4/SC-7; T-030 → SC-6 (index); T-031 → SC-2/SC-3; T-032 → SC-3; T-033 → SC-6; T-034 → SC-5; T-035 → D-004; T-036 → SC-5; T-037 → operational; T-038, T-039 → SC-4 (explanations usable on phone); T-040 → SC-4; T-041 → SC-5; T-042 → SC-3/security; T-043 → SC-3/operational; T-044 → SC-7; T-045 → SC-6; T-046 → SC-5; T-047 → SC-3.

## Platform mapping (3.9)

| Platform | CI job / waiver |
|---|---|
| Chromium engine (Chrome, Edge, Android Chrome, Samsung Internet) | `ci.yml` job `test` on `ubuntu-24.04` |
| WebKit (iOS/macOS Safari) | D-012 waiver; G-LEARN question 3 on the owner's phone |
| Gecko (Firefox) | D-012 waiver; self-assessment path covered by T-034 |
| ARM64 / libc variant / oldest toolchain | D-012: N/A (no native code) |

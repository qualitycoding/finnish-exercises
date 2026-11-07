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
| D-017/D-018 scoring (near forms, compounds, spoken) | T-025, T-027, T-029 | S-003 |
| D-017/D-018 validator and notes (V8, V9, V13–V17, N0–N4) | T-051…T-058, T-060, T-061, CI 'Check content notes' | S-004, S-006 |
| D-017 import merge, persistence | T-048, T-059 | S-005 |
| D-017 speech (Play never disabled, marker not spoken) | T-049, T-050 | S-005 |
| D-017/D-018 security (no sinks, CSP, no inline styles, no `<>` in data) | T-057, CI steps 'No HTML injection sinks', 'No inline style attributes' | S-002, S-005 |
| D-017/D-018 refresh flow | CI step 'Refresh adds only a theme and its note', REFRESH.md, live-check selection rule | S-002, S-007, S-REFRESH |
| D-019 review fixes: double tap on the sticky bar (B-01) | T-068 | S-REVIEW fixes |
| D-019 robustness: damaged scores, missing theme file, route names, recognition release, speech failures (CR-01, CR-02, CR-06, B-02…B-06) | T-069, T-070, T-071, T-072, T-073 | S-REVIEW fixes |
| D-019 previously untested D-017/D-018 behaviours (CR-04): attempts, import limits, backup reminder, voices, CSP | T-065, T-074, T-075, T-076, T-077, T-078, T-079, T-080 | S-REVIEW fixes |
| D-019 scoring: ä/ö folding, compound tolerance, whole-word stems, sentence splitting (C-02, C-03, C-05, CR-03) | T-062, T-063, T-064, T-081 | S-REVIEW fixes |
| D-019 tools: publisher groups, malformed links (CR-11) | T-066, T-067 | S-REVIEW fixes |
| D-019 content: correct answers score 1, wrong numerals do not, neutral variants, handling fee, single-source facts, 'to be sent' (C-01, C-04, C-05, C-08, C-09, C-10) | T-082…T-088 | S-REVIEW fixes |
| Performance | No targets (static pages, ≤ ~30 kB data per theme); no performance test — recorded here as N/A by intake (no target set) | — |

## Every test → requirement

T-001…T-009 → D-004/SC-2; T-010…T-024 → D-003/SC-2/SC-4/SC-7; T-030 → SC-6 (index); T-031 → SC-2/SC-3; T-032 → SC-3; T-033 → SC-6; T-034 → SC-5; T-035 → D-004; T-036 → SC-5; T-037 → operational; T-038, T-039 → SC-4 (explanations usable on phone); T-040 → SC-4; T-041 → SC-5; T-042 → SC-3/security; T-043 → SC-3/operational; T-044 → SC-7; T-045 → SC-6; T-046 → SC-5; T-047 → SC-3; T-025, T-027, T-029 → D-017/SC-2; T-048 → SC-3/security; T-049, T-050 → SC-5; T-051…T-058 → SC-2/SC-7/security; T-059 → SC-3; T-060 → SC-5/SC-2; T-061 → SC-7; T-062…T-064, T-081 → D-004/D-019 (scoring); T-065 → security; T-066, T-067 → SC-7; T-068…T-080 → SC-3/SC-5/security/operational (D-019); T-082…T-088 → SC-2/SC-7.

## Platform mapping (3.9)

| Platform | CI job / waiver |
|---|---|
| Chromium engine (Chrome, Edge, Android Chrome, Samsung Internet) | `ci.yml` job `test` on `ubuntu-24.04` |
| WebKit (iOS/macOS Safari) | D-012 waiver; G-LEARN question 3 on the owner's phone |
| Gecko (Firefox) | D-012 waiver; self-assessment path covered by T-034 |
| ARM64 / libc variant / oldest toolchain | D-012: N/A (no native code) |

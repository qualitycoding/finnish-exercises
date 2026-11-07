| UTC | step | attempt | outcome | commit | note |
|---|---|---|---|---|---|
| 2026-11-07T02:07:11Z | S-000 | 1 | pass | 0979d99 | tools and access verified; web reachability limited (see DEVIATIONS) |
| 2026-11-07T02:07:25Z | S-001 | 1 | pass | 41b8bc8 | scaffold: LICENSE, .nojekyll, package.json, lockfile (npm ci ok, playwright imports) |
| 2026-11-07T02:07:36Z | S-002 | 1 | pass | ceced3e | 3 workflows written from plan listings and parsed; ci steps=11 |
| 2026-11-07T02:07:50Z | S-003 | 1 | pass | eb2b2c0 | scoring.js from spike with English notes; T-001..T-009,T-025,T-027,T-029 pass (12 tests) |
| 2026-11-07T02:08:08Z | S-004 | 1 | pass | 8f391c5 | validator + note checker from spike; 25 validator tests pass; CLI 'all valid: 1 themes, 4 exercises' |
| 2026-11-07T10:35:46Z | S-005 | 1 | pass | 428c73a | app.js from interrupted run reviewed and reused; style.css added; 62/62 tests local; CI run 42364537580 success |
| 2026-11-07T11:04:08Z | S-006 | 1 | pass | 5d2fd62 | six themes (areas 1-6), stub removed, manifest in area order; validate/check-notes ok; 82/82 tests; register 63 sources |

S-007 screenshots (Pixel 7, full page, viewed with the Read tool):
- index.png: header, intro, score card (0 / 240), tag legend and six theme cards with four exercise rows each; legible at phone width, no horizontal overflow.
- reading-slang.png: reading text with underlined terms, the dialogue marked (keksitty esimerkki) with SLANGI and PUHEKIELI tags, the open gloss "työssä · at work (slang)" and the glossary; ten questions and sources; no overflow. The sticky "Check my answers" bar appears mid-page only because of the full-page capture.
- writing.png: gap fill with grammar hints, three word-order tasks with chips, translations, free-writing with checklist and sources; no overflow (sticky bar again overlaps gap 3 in the capture only).
- speaking.png: instructions, read-aloud and question items with model, record and self-assessment controls; no overflow.
Interface chrome (header, buttons, legend) is in English by design; exercise content is Finnish.
| 2026-11-07T11:05:25Z | S-007 | 1 | pass | bdc70d3 | README, REFRESH, tools/screenshots.mjs, 4 PNGs (all >10 kB), file-name check and forbidden-word grep ok |
| 2026-11-07T12:20:00Z | R-D10 fixes (S-REVIEW, S-ADVERSARIAL) | 1 | pass | 9b5818e | code eeb30fa, content c3bdaed, T-089 9b5818e; 28 new tests T-062…T-089, 25 red on 7c01b28 (T-065, T-076, T-078 are guards); suite 110/110; validate and check-notes ok; freeze manifest ok; CI run 42370042427 success on 3620c33 |
| 2026-11-07T11:57:20Z | S-PUBLISH | 1 | blocked | 9ce3da9 | main pushed; default-branch change refused by proxy; halted at G-PAGES |
| 2026-11-07T12:52:31Z | S-PUBLISH | 2 | pass | 1470999 | Pages on; CI, pages build 42374267602, live check 42374301430 success; default branch main |
| 2026-11-07T12:52:31Z | S-LEARN | 1 | blocked | — | halted at G-LEARN |

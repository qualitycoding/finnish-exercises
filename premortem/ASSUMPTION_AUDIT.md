# Assumption audit (4.7)

Reviewer: fresh-context Opus agent, 2026-11-07. Web searches used: 4 of 5.

Verdicts: **confirmed** means checked and true. **falsified** means checked and false, wholly or in a load-bearing part. **unverifiable** means it could not be checked from this session; the reason is given.

## Assumptions (A-###)

| ID | Premise (one line) | What would falsify it | What I checked | Verdict |
|---|---|---|---|---|
| A-001 | The owner wants planning and building in one session | An owner reply asking for the plan only | The quoted reply in ASSUMPTIONS.md: "Plan and. Build." | confirmed |
| A-002 | `software` + `courseware` + deploys fit the request | The request lacks a web deliverable | The goal (Pages SPA, exercises) matches; adopted by protocol default 0.3.6 | confirmed |
| A-003 | The learner is at CEFR B1–B2 | The owner reports texts as too hard or too easy | Not stated by the owner; it is a default | unverifiable (G-LEARN q1/q5) |
| A-004 | Standard-Finnish texts plus invented spoken dialogues give colloquial exposure without misattribution | Dialogues read as real quotes | The design marks every dialogue '(keksitty esimerkki)'; V5/V6 enforce this | confirmed (as a design); TTS reads the marker aloud (R-027) |
| A-005 | An authoritative register label can be found for at least one `slangi` term in every reading | The label authority is unreachable, or no slang word fits the topic | KS WebFetch refused here (allowlist); 2 searches found no KS abbreviation list | unverifiable; at risk (R-017) |
| A-006 | Finnish gloss · English gloss, with an English UI, suits the learner | The learner wants a Finnish UI | Default; consistent with the swedish-exercises pattern | unverifiable (owner preference) |
| A-007 | 24 exercises × 10 items take about 10 minutes each | Trial times well over 10 minutes | Item mix inspected; writing has 10 tasks plus 50–80 words of free writing | unverifiable; likely long for writing (R-008) |
| A-008 | The listed outlets give two **independent** publishers per fact | Two listed outlets share an owner | HS and IS are both Sanoma; Iltalehti and Kauppalehti are both Alma Media (general knowledge, not re-fetched); V2 counts hosts | **falsified** in its independence part (R-016) |
| A-009 | Browser fi-FI synthesis and recognition work on the learner's phone | No Finnish voice or no fi-FI recognition on the device | Rests on C-001…C-005 (mostly single-source); phone unknown | unverifiable (G-LEARN q3) |
| A-010 | The owner can and will enable Pages, because the proxy refuses the Pages API | The API is reachable, or the owner is unavailable | C-010 records the 403; in this session `gh api` to another repository was also refused by session policy | confirmed (as a procedure) |
| A-011 | The request approves Pages publication | The owner objects to a public site | "Proceed" in the reply; the repository is public | confirmed |
| A-012 | `localStorage` keeps scores between visits | The platform evicts storage | WebKit ITP caps script-writable storage at 7 days without a visit ([Safari 13.1 note](https://mjtsai.com/blog/2020/03/26/safari-13-1-third-party-cookie-blocking-and-7-day-script-writeable-storage/), [iTnews](https://www.itnews.com.au/news/apple-cops-flak-for-deleting-local-browser-storage-after-7-days-539833)) | **falsified** for iOS Safari without Home Screen use (R-019) |
| A-013 | Apache-2.0, with the same text as the swedish-exercises LICENSE | That LICENSE is not Apache-2.0 | `head` of the local clone's LICENSE: "Apache License Version 2.0" | confirmed |
| A-014 | The owner trials one exercise per skill on a phone; at most 3 iterate rounds | The owner is unavailable | Process assumption | unverifiable |
| A-015 | Hobby project; redistributable references | n/a | Request context | confirmed |
| A-016 | Stores were read at `8d6c44c` / `bf95f15` | Local clones at other commits | `git log -1`: `8d6c44c`, `bf95f15` | confirmed |
| A-017 | A weekly refresh, one theme, Saturday 10:23 London, can run unattended | Runs need approval or `add_repo` confirmation; nobody watches | The scheduled-task approval mode is decided server-side when the task is created | unverifiable (R-022) |
| A-018 | All English prose in British English; Finnish rules cite Finnish authorities | Owner prefers otherwise | Matches the owner's saved preference for British English and British/academic sources | confirmed |
| A-019 | Sonnet implements and Opus agents review | n/a | Owner reply: "switch to sonnet" | confirmed |
| A-020 | The seven subject tags fit the store taxonomies | Tags absent from TAXONOMY.md | grep: `domain:finnish-current-affairs`, `tech:web-speech-api` and `tech:github-pages` are absent from both TAXONOMY.md files (the taxonomy has `subject:web-speech-api`); item tags `subject:answer-scoring`, `subject:finnish-exercises`, `subject:finnish-registers`, `subject:node-test-runner`, `subject:yle-content-terms` are also absent | **falsified** (S-KNOW must add the tags to TAXONOMY or remap them) |

## Decision premises (D-###)

| ID | Premise | What would falsify it | What I checked | Verdict |
|---|---|---|---|---|
| D-001 | The reference `swedish-exercises@b8c4f57` exists, is Apache-2.0 and can be ported | Missing or under another licence | `git log` head is `b8c4f57`; LICENSE is Apache-2.0 | confirmed |
| D-002 | The skill's theme schema exists and the Finnish changes are complete | Schema file missing | `skills/learning-exercise-site/references/theme-schema.md` exists | confirmed |
| D-003 | The spike validator satisfies T-010…T-024 | Any failure | Ran in `/tmp/x`: 24/24 pass (with T-001…T-009) | confirmed; but new rules cannot go into `validateTheme` without breaking T-010 |
| D-004 | One edit in a word of 6+ letters is a typo, not a grammar error; prefix stems survive inflection | A grammatical error at edit distance 1; a correct inflection missing the stem | Probe: `hallitukset`/`kaupasta`/`talolta`/`kauppan` → 0.5; `Hinnat nousivat` → 0.5; a compound misses its stem; `Budjetin.` → 0 | **falsified** (R-009, R-010, R-011) |
| D-005 | Every grammatical order can be listed while V9 forbids accepting the reversed order | A sentence whose reverse is grammatical | `Budjetin esitti hallitus` (grammatical OVS) scores 0 against `Hallitus esitti budjetin.`; V9 would reject accepting it | **falsified** as written (R-012) |
| D-006 / D-006a | The UI contract is satisfiable and matches the frozen e2e tests | A test that no app can pass | Read T-030…T-047 against D-006a: consistent; not run (instructed) | unverifiable (not run); no contradiction found |
| D-007 | Voices are available at load or within 2 s via `voiceschanged` | Empty list with no event (iOS/Safari) | No device here; the reference speaks with `lang` only when no voice is found | unverifiable; behaviour on 'none' unspecified (R-020) |
| D-008 | Checking `version === 1` and that `scores` is an object makes import safe | Hostile or old files corrupt or wipe data | The reference import replaces the store wholesale, with no per-entry checks | **falsified** (R-013) |
| D-009 | Two independent publishers per fact are available within 7 days, and host diversity shows independence | Same-owner outlets; a wire story copied | Ownership pairs in the outlet list; V2 counts hosts | **falsified** in the independence part (R-016) |
| D-010 | `merge --no-ff` into `main` and Pages from `main` publishes the site | n/a | Standard git/Pages behaviour | confirmed |
| D-011 | Node 22; Playwright 1.63.0 exists; the directory form of `node --test` fails | Version missing; the directory form works | `npm view playwright@1.63.0 version` → 1.63.0 (latest 1.65.0); Node v22.23.4; `node --test tests/` → `# fail 1` | confirmed |
| D-012 | Only Web Speech is engine-specific, so Chromium-only CI suffices | A WebKit-only failure in plain code (regex lookbehind before iOS 16.4, storage eviction) | Reasoned; the reference uses lookbehind in its sentence splitter | unverifiable (no WebKit here); weak (R-028) |
| D-013 | No generated audio is needed | n/a | Design choice | confirmed |
| D-014 | Every validator rule has a test that must fail, which makes mutation testing redundant | A rule with no failing test | No test for the V8 per-theme ä/ö gap, the V9 reversed-order and canonical-rebuild rules, or the V1 duplicate-id and file-name rules | **falsified** (R-031) |
| D-015 | The Playwright `devices['Pixel 7']` descriptor exists | Descriptor missing | Found `"Pixel 7"` in a local playwright-core `deviceDescriptorsSource.json` (MCP copy, not 1.63.0) | confirmed (version not exact) |
| D-016 | Pages' `pages build and deployment` emits `deployment_status`, which starts `Live site check`; the reference REFRESH is a sound base | No run is triggered; the reference publishes before CI | One search was inconclusive; the API for swedish-exercises runs is not enabled in this session; the reference REFRESH pushes straight to `main` | trigger: unverifiable (R-018); 'sound base': **falsified** (R-015) |

## Single-source claims (claims.json)

| ID | Premise | What would falsify it | What I checked | Verdict |
|---|---|---|---|---|
| C-001 | Desktop Chrome ships no Finnish voice; named OS voices exist | Chrome on macOS/Windows listing Satu/Heidi | Reasoning: Chrome uses OS voices on macOS/Windows, so 'none' holds only for Google's own network voices | unverifiable (single publisher); the About wording over-generalises (R-025) |
| C-002 | Synthesis support matrix | A browser lacking it | Only a knowledge-store item; no primary source | unverifiable (effectively single-source despite 'corroborated') |
| C-003 | Recognition support matrix; Chrome sends audio to a server | Contrary vendor docs | Only a knowledge-store item | unverifiable (effectively single-source) |
| C-004 | fi-FI is supported by Chrome's and Apple's recognisers | fi-FI missing from the vendor lists | Two tier-4 pages only; no search spent | unverifiable; mitigated by fallback (T-034), but bad transcription is not mitigated (R-011) |
| C-005 | iOS synthesis needs a user gesture | Speech without a gesture | Same author on both sources | unverifiable; moot (`#play` is a tap) |
| C-006 | Chrome desktop cuts utterances after about 14 s | n/a | One Readium page | unverifiable; non-load-bearing (sentence splitting satisfies it either way) |
| C-010 | The first Pages build can fail at startup; the proxy refuses the Pages API | API reachable | Knowledge item plus recorded probe; not re-probed | confirmed (from record) |
| C-011 | Two-letter stems need whole-word matching | `ei` not matching `eilen` under the prefix rule | Spike rerun: T-006 passes on whole-word logic | confirmed |
| C-012 | Playwright 1.63.0 launches Chromium from `/opt/pw-browsers` | Launch failure | Committed spike output only (not rerun: browser runs were excluded) | confirmed (from record) |
| C-013 | `node --test tests/` fails on Node 22; the glob works | The directory form passes | Reproduced: `# fail 1` for the directory form; 24/24 with explicit files | confirmed |
| (missing) | `deployment_status` from Pages triggers workflows; non-success states create skipped runs | — | No claim exists | add C-014 after the first observed run (R-018) |

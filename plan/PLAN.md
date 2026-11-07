# PLAN — Finnish current-affairs exercises (qualitycoding/finnish-exercises)

**Status:** see header written at Phase 5 below.

Goal: a single-page app on GitHub Pages with Finnish reading, listening, writing and speaking exercises about current affairs; ~10 minutes each, scored out of 10, retryable, scores saved between visits, slang and colloquial language labelled; refreshed weekly.

Success criteria (all measurable):
- SC-1 Six themes × four exercises published at `https://qualitycoding.github.io/finnish-exercises/` (Live site check green for the deployed commit).
- SC-2 Every exercise has exactly 10 scored items, correct answers score 10 and wrong answers ≤ 2 (T-031), validator and note checker pass (T-010…T-024, T-051…T-061, `node tools/validate.mjs`, `node tools/check-notes.mjs`).
- SC-3 Retry clears and reshuffles; best/last/attempts persist across reloads; export/import works (T-031, T-032, T-042, T-047).
- SC-4 Every glossed term carries a register label; each reading has `slangi` and `puhekieli` terms; legend everywhere (V4, V5, T-040).
- SC-5 Listening uses Finnish synthesis and reports a missing voice; speaking uses `fi-FI` recognition with a self-assessment fallback (T-034, T-036, T-041, T-046).
- SC-6 Next/previous links click through all 24 exercises (T-033); 'Continue' jumps to the first unfinished one (T-045).
- SC-7 Each theme is dated and sourced with ≥2 hosts; each fact in a question has two independent sources (V2, T-044, content notes, S-ADVERSARIAL check).
- SC-8 Learner trial answered `proceed` at G-LEARN; weekly refresh scheduled.

Steps run in order; a step may start when its dependencies pass. Every step appends one line to `EXECUTION_LOG.md` (UTC time, step, attempt, outcome, commit, note), updates `.checkpoints/state.json`, commits and pushes, then checks `git ls-remote origin <branch>` equals `git rev-parse HEAD` (Rule 6).

## Conventions for every step

- **Polling.** "Wait for <run>" means: poll `gh api 'repos/qualitycoding/finnish-exercises/actions/runs?head_sha=<sha>' --jq '.workflow_runs[]|[.name,.status,.conclusion,.id]|@tsv'` every 30 s, up to 20 minutes, for the run named exactly `CI`, `pages build and deployment` or `Live site check`; record its id in `state.json` (`ci_run_ids.<step>`, `pages_run_ids.<step>`, `live_check_run_ids.<step>`); timeout → the step's On failure.
- **Counting checks.** Write zero-count checks as `! grep -qiE '<pattern>' <files>` so they also work under `set -e`.
- **Gates.** "Halt at G-x" = write `GATE-G-x.md` (sections: Evidence, Questions, `Response:` left empty), set `state.json` `gate: "G-x"`, commit, push, and end your session with the questions as your final message. The owner's reply arrives as the next message: paste it verbatim under `Response:`, commit with the change it causes, set `gate: null`.
- **Orchestrator steps.** After S-007 set `awaiting: "S-REVIEW"`, push, and end with `READY FOR S-REVIEW`. The orchestrating session runs S-REVIEW and S-ADVERSARIAL with fresh agents and re-invokes you with the review files for fixes (R-D10) and then S-PUBLISH. The same applies before S-RETRO (`READY FOR S-RETRO`) and for S-REFRESH (the orchestrator creates the schedule).
- **After publication.** All later changes (iterate fixes, gate records, retrospective, lessons) are committed on the impl branch and published by repeating S-PUBLISH steps 1–6 (merge into `main`, push, wait for the three runs).
- **Live check.** A `Live site check` counts only under the D-018 selection rule (some run for the commit whose job `live` concluded `success`; dispatch fallbacks if none appears within 10 minutes of the Pages build).
- **YAML blocks.** The workflow listings in this plan are indented by 5 spaces inside the list; dedent them when writing the files.
- **CI before S-005.** Pushes during S-002…S-004 run CI against stubs and go red; do not wait for them (D-018).
- **New tests during implementation.** Follow the D-018 Phase 2 route.
- **Lesson/knowledge IDs.** Citations may use shortened slugs; they resolve by their timestamp prefix.
- **Test totals.** The runner counts T-031 once per theme × skill, so totals differ from the ID count. "Tests pass" means `node --test tests/*.test.mjs` reports `# fail 0`, `# skipped 0`, `# todo 0` and every ID T-001…T-025, T-027, T-029, T-030…T-061 that exists in `tests/` appears in the output (T-026 and T-028 are unused).

### S-000 Environment & access verification
- Tier: Haiku (run by the Sonnet implementer)
- Profile: software
- Depends on: none
- Inputs: generation branch `gen-20261106T235415Z-finnish-current-affairs-exercises`
- Actions:
  1. `cd /home/claude/finnish-exercises && git fetch origin && git checkout -B impl-20261106T235415Z-finnish-current-affairs-exercises origin/gen-20261106T235415Z-finnish-current-affairs-exercises`
  2. `node --version` (expect v22.x); `ls /opt/pw-browsers` (expect `chromium-1243`); `git ls-remote origin HEAD`; `gh api repos/qualitycoding/finnish-exercises --jq .permissions.push` (expect `true`); `gh api repos/qualitycoding/finnish-exercises/actions/runs --jq .total_count` (expect a number).
  3. `sha256sum -c tests/FROZEN_MANIFEST.sha256` (expect all OK).
  3a. Push probes: `git push --dry-run origin HEAD:refs/heads/impl-20261106T235415Z-finnish-current-affairs-exercises` (expect success) and `gh api repos/qualitycoding/finnish-exercises/actions/workflows --jq .total_count` (expect a number). If `.permissions.push` is absent from the repo JSON, the dry-run push is the deciding check. If the first push containing `.github/workflows/` is later refused (workflow scope), write `BLOCKED.md` asking the owner to grant the session's GitHub App 'Workflows: write' and halt.
  3b. Reachability: WebFetch `https://yle.fi/uutiset`, `https://www.hs.fi/`, `https://www.kielitoimistonsanakirja.fi/` (record each as reachable or not in state.json `hosts`); if Yle is unreachable use the other outlets of S-006 step 1 (R-D6).
  3c. Read the protocol at `/home/claude/qualitycoding/skills/protocols/planning-protocol.md` (clone `https://github.com/qualitycoding/skills` at `0feb631` if absent) and the taxonomies `/home/claude/lessons/TAXONOMY.md`, `/home/claude/knowledge/TAXONOMY.md` (clone `qualitycoding/Lessons` / `qualitycoding/knowledge` read-only if absent).
  4. Create `EXECUTION_LOG.md` with header `| UTC | step | attempt | outcome | commit | note |` and `DEVIATIONS.md` with header `# Deviations`.
- Outputs: `EXECUTION_LOG.md`, `DEVIATIONS.md`
- Evidence produced: none
- Done when: every command prints the expected value; both files exist and are non-empty.
- Checkpoint: rewrite `.checkpoints/state.json` keeping the planning keys and adding an `implementation` object: `{"branch":"impl-20261106T235415Z-finnish-current-affairs-exercises","active_step_id":"S-000","completed":[],"attempts":{},"ci_run_ids":{},"pages_run_ids":{},"live_check_run_ids":{},"gate":null,"awaiting":null,"hosts":{}}`; later steps update these keys.
- On failure: write `BLOCKED.md` naming the failing check; stop.
- Gate: none
- Relevant decisions/claims: D-010, D-011
- Lessons applied: L-20261004T102007Z-sandbox-reset-lost-working-tree, L-20261009T152201Z
- Exclusive resources: none

### S-001 Scaffold
- Tier: Sonnet
- Profile: software
- Depends on: S-000
- Inputs: `/home/claude/qualitycoding/swedish-exercises/LICENSE` (clone with `git clone --depth 1 https://github.com/qualitycoding/swedish-exercises /home/claude/qualitycoding/swedish-exercises` if absent)
- Actions:
  1. Copy `LICENSE` (Apache-2.0) to the repo root. Create empty `.nojekyll`.
  2. Ensure `.gitignore` contains `node_modules`, `test-results/`, `*.log` (it exists already).
  3. Ensure `.gitattributes` contains `* text=auto eol=lf` and `*.png binary` (it exists already) (L-20261028T210000Z-crlf-breaks-hash-manifests-on-windows: the freeze manifest hashes bytes).
  4. Remove the planning symlink if present: `rm -f node_modules`.
  5. `package.json`: `{"name":"finnish-exercises","private":true,"version":"1.0.0","description":"Finnish reading, listening, writing and speaking exercises on current affairs, served by GitHub Pages.","type":"module","license":"Apache-2.0","scripts":{"validate":"node tools/validate.mjs","test":"node tools/validate.mjs && node --test tests/*.test.mjs","serve":"node -e \"import('./tests/server.mjs').then(m=>m.serve('.')).then(s=>console.log(s.url))\"","screenshots":"node tools/screenshots.mjs"},"devDependencies":{"playwright":"1.63.0"}}`
  6. Lockfile: `rm -rf /tmp/lock && mkdir /tmp/lock && cp package.json /tmp/lock/ && (cd /tmp/lock && npm install --package-lock-only --no-audit --no-fund) && cp /tmp/lock/package-lock.json . && npm ci --no-audit --no-fund`.
  7. `! grep -q '"link": true' package-lock.json`.
- Outputs: `LICENSE`, `.nojekyll`, `.gitignore`, `.gitattributes`, `package.json`, `package-lock.json`
- Evidence produced: none
- Done when: files exist; `npm ci` exits 0; `node -e "import('playwright').then(()=>console.log('ok'))"` prints `ok`.
- Checkpoint: step pointer
- On failure: R-D1.
- Gate: none
- Relevant decisions/claims: D-011, A-013
- Lessons applied: L-20261028T210000Z-crlf-breaks-hash-manifests-on-windows
- Exclusive resources: none

### S-002 CI and live-site workflows
- Tier: Sonnet
- Profile: software
- Depends on: S-001
- Inputs: plan/ENVIRONMENT.md, `/home/claude/qualitycoding/swedish-exercises/.github/workflows/` (reference)
- Actions:
  1. Write `.github/workflows/ci.yml` exactly:
     ```yaml
     name: CI
     on:
       push:
         branches: [main, "impl-**", "refresh/**"]
       pull_request:
       workflow_dispatch:
     permissions:
       contents: read
     jobs:
       test:
         runs-on: ubuntu-24.04
         timeout-minutes: 25
         defaults:
           run:
             shell: bash
         steps:
           - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
           - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
             with:
               node-version: "22"
           - name: Frozen tests unchanged
             run: sha256sum -c tests/FROZEN_MANIFEST.sha256
           - name: No failure-swallowing in workflows
             run: |
               set -euo pipefail
               if grep -nE '\|\| *true|continue-on-error|set \+e' .github/workflows/*.yml | grep -v 'grep -nE'; then exit 1; fi
           - name: Install Playwright 1.63.0 and Chromium
             run: |
               set -euo pipefail
               npm ci --no-audit --no-fund
               npx playwright install --with-deps chromium
           - name: No HTML injection sinks
             run: |
               set -euo pipefail
               if grep -nE 'innerHTML|outerHTML|insertAdjacentHTML|document\.write' assets/*.js; then exit 1; fi
           - name: Refresh adds only a theme and its note (refresh branches)
             if: startsWith(github.ref, 'refs/heads/refresh/')
             run: |
               set -euo pipefail
               git fetch --no-tags --depth=1 origin main
               bad=$(git diff --name-status origin/main HEAD | awk '!(($1=="A" && ($2 ~ /^data\/themes\/[^\/]+\.json$/ || $2 ~ /^content-notes\/[^\/]+\.md$/)) || ($1=="M" && $2=="data/manifest.json"))')
               if [ -n "$bad" ]; then echo "::error title=Refresh changed other files::$bad"; exit 1; fi
               git show origin/main:data/manifest.json > /tmp/old-manifest.json
               python3 -c 'import json; o=json.load(open("/tmp/old-manifest.json"))["themes"]; n=json.load(open("data/manifest.json"))["themes"]; assert n[len(n)-len(o):]==o, "old themes must stay, in order, at the end of the manifest"'
           - name: No inline style attributes
             run: |
               set -euo pipefail
               if grep -nE "setAttribute\(\s*['\"]style|\bstyle\s*:" assets/*.js; then exit 1; fi
           - name: Validate exercise data
             run: node tools/validate.mjs
           - name: Check content notes
             run: node tools/check-notes.mjs
           - name: Unit, validator and browser tests
             run: node --test tests/*.test.mjs
     ```
  2. Write `.github/workflows/live-check.yml` exactly:
     ```yaml
     name: Live site check
     on:
       workflow_dispatch:
       deployment_status:
     permissions:
       contents: read
     jobs:
       live:
         if: github.event_name == 'workflow_dispatch' || github.event.deployment_status.state == 'success'
         runs-on: ubuntu-24.04
         timeout-minutes: 10
         env:
           SITE: https://qualitycoding.github.io/finnish-exercises/
         defaults:
           run:
             shell: bash
         steps:
           - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
           - name: Every file is served, every data file is JSON
             run: |
               set -euo pipefail
               files="index.html assets/app.js assets/scoring.js assets/style.css data/manifest.json"
               files="$files $(python3 -c 'import json; print(" ".join("data/" + f for f in json.load(open("data/manifest.json"))["themes"]))')"
               fail=0
               for f in $files; do
                 code=$(curl -sS -o /tmp/body -w '%{http_code}' -L "${SITE}${f}")
                 echo "$f -> $code"
                 if [ "$code" != "200" ]; then echo "::error title=Not served::$f -> HTTP $code"; fail=1; fi
                 case "$f" in
                   *.json)
                     if ! python3 -c 'import json; json.load(open("/tmp/body"))'; then
                       echo "::error title=Not JSON::$f -> $(head -c 120 /tmp/body | tr '\n' ' ')"
                       fail=1
                     fi ;;
                 esac
               done
               exit $fail
     ```
  3. Parse both with `python3 -c "import yaml,sys;[yaml.safe_load(open(f)) for f in sys.argv[1:]]" .github/workflows/*.yml` (install `pip install --break-system-packages pyyaml` if missing) (L-20261009T150801Z).
- Outputs: `.github/workflows/ci.yml`, `.github/workflows/live-check.yml`
- Evidence produced: CI job definition for T-001…T-047
- Done when: both files parse; `grep -c 'actions/checkout@3d3c42e5' .github/workflows/ci.yml` = 1.
- Checkpoint: step pointer
- On failure: R-D12.
- Gate: none
- Relevant decisions/claims: D-011, D-012, D-016, C-009
- Lessons applied: L-20261031T100000Z-actions-run-steps-have-no-pipefail, L-20261029T000000Z-green-ci-gate-never-ran, L-20261028T200000Z-pinned-tool-version-does-not-exist
- Exclusive resources: none

### S-003 Scoring module
- Tier: Sonnet
- Profile: software
- Depends on: S-001
- Inputs: stub `assets/scoring.js`; `research/spikes/satisfiability/scoring.js` (passes T-001…T-009)
- Actions:
  1. Replace the stub with the implementation of D-004, starting from `research/spikes/satisfiability/scoring.js` (not `research/spikes/scoring-finnish/scoring.js`). Replace the feedback notes: `Inget svar.`→`No answer.`; `Rätt!`→`Correct!`; `Almost: check ä and ö.` (keep); `Nästan – ett stavfel.`→`Almost: one typo.`; `Inte riktigt.`→`Not quite.`; `Rätt ordföljd!`→`Correct word order!`; `Fel ordföljd.`→`Wrong word order.`; `Alla nyckelord finns med!`→`All key words are there!`; `Delvis rätt.`→`Partly right.`; `För många nyckelord saknas.`→`Too many key words missing.`; `Mycket bra!`→`Very good!`; `Nästan.`→`Almost.`; `Försök igen.`→`Try again.`; update the comments to English and to Finnish examples.
  2. Apply D-017 scoring changes (the spike already has them). `node --test tests/scoring.test.mjs tests/scoring-v2.test.mjs`
- Outputs: `assets/scoring.js`
- Evidence produced: T-001…T-009, T-025, T-027, T-029 green
- Done when: T-001…T-009, T-025, T-027, T-029 pass; `! grep -qiE 'svar|nyckelord|delvis|försök|ordföljd|rätt|nästan|inte riktigt|mycket bra' assets/scoring.js`.
- Checkpoint: step pointer
- On failure: R-D2 if a test seems wrong; else fix and retry (3 attempts) then BLOCKED.
- Gate: none
- Relevant decisions/claims: D-004, C-011
- Lessons applied: L-20261102T232000Z-one-letter-keyword-stem-accepted-anything
- Exclusive resources: none

### S-004 Data validator
- Tier: Sonnet
- Profile: software
- Depends on: S-003
- Inputs: stub `tools/validate.mjs`; `research/spikes/satisfiability/validate.mjs`
- Actions:
  1. Copy the spike to `tools/validate.mjs`, change its import to `../assets/scoring.js`; copy `research/spikes/satisfiability/check-notes.mjs` to `tools/check-notes.mjs`.
  2. `node --test tests/validate.test.mjs tests/validate-v2.test.mjs tests/validate-v3.test.mjs`, `node tools/validate.mjs` and `node tools/check-notes.mjs`. For the CLI to pass on the stub theme, add `near` lists to its four gaps (as in the T-051 fixture) and create `content-notes/stub-20261107.md` in the D-018 note format with two publisher groups (deleted with the stub in S-006).
- Outputs: `tools/validate.mjs`, `tools/check-notes.mjs`
- Evidence produced: T-010…T-024, T-051…T-058, T-060, T-061 green
- Done when: tests pass; CLI exits 0 printing `all valid: 1 themes, 4 exercises`; `node tools/validate.mjs /nonexistent` exits non-zero.
- Checkpoint: step pointer
- On failure: R-D2.
- Gate: none
- Relevant decisions/claims: D-003
- Lessons applied: L-20261102T231000Z-slang-labels-omitted-in-first-theme-draft, L-20261102T232200Z-text-length-estimated-by-eye
- Exclusive resources: none

### S-005 Application
- Tier: Sonnet
- Profile: software
- Depends on: S-003, S-004
- Inputs: `/home/claude/qualitycoding/swedish-exercises/{index.html,assets/app.js,assets/style.css}` (reference), D-006, D-007, D-008
- Actions:
  1. Read `tests/e2e.test.mjs` first: D-006 and D-006a summarise it, the test file is authoritative. Port `index.html`, `assets/app.js`, `assets/style.css` from the reference to the UI contract D-006/D-006a: Finnish keys and routes, English interface text in British English, labels `slangi`/`puhekieli`/`idiomi`/`sana` (tag colours distinct, text contrast ≥ 4.5:1 per WCAG 2.2 AA; legend text: SLANGI = slang, informal and often group-bound; PUHEKIELI = everyday spoken Finnish; IDIOMI = fixed expression; SANA = ordinary word), `lang="en"` on `<html>` with `lang="fi"` on every Finnish content element, the dialogue blocks rendered under the heading 'Spoken Finnish (puhekieli) – invented example', listening plays `script` then `dialogue`, voice selection D-007 with `#voice-status` and the D-017 speech rules (Play never disabled, marker not spoken, sentence splitting), the D-017 import merge, CSP meta tag, no HTML sinks, `navigator.storage.persist()`, the back-up reminder, recognition `fi-FI`, storage key and import/export D-008, `#save-error`, `a#continue`, `.news-date`, `.sources`.
  2. About page `#/tietoja` (title 'About'): how scoring works (D-004 in plain words), register labels, browser support (synthesis: a Finnish voice is needed — Chrome on desktop may have no Finnish voice and the page tells you if none is found; Edge, Safari and Android Chrome usually have one; recognition: Chrome, Edge, Safari; Firefox uses self-assessment), the privacy note that Chrome and Edge send recorded speech to an online service, export/import.
  3. Run `node --test tests/e2e.test.mjs` against the stub theme; then the full `node --test tests/*.test.mjs`.
  4. Push the branch now and wait for `CI` on HEAD per Conventions (L-20261009T191300Z); record it as `implementation.ci_run_ids.S-005` in `state.json`.
- Outputs: `index.html`, `assets/app.js`, `assets/style.css`
- Evidence produced: T-030…T-050, T-059 (22 IDs) green locally and in CI
- Done when: tests pass (see Conventions, Test totals) locally; the CI run for HEAD concludes `success` (`ci_run_ids.S-005`).
- Checkpoint: CI run id
- On failure: R-D7; R-D2 for a suspected wrong test.
- Gate: none
- Relevant decisions/claims: D-006, D-007, D-008, C-001…C-006
- Lessons applied: L-20261102T230300Z-dom-append-given-arrays-dropped-content, L-20261102T230700Z-navigation-test-raced-hashchange, L-20261009T191300Z
- Exclusive resources: none

### S-006 Content: six themes
- Tier: Sonnet
- Profile: software (courseware)
- Depends on: S-004, S-005
- Inputs: D-002, D-009; the rules are steps 1–6 below (S-007 later copies them into `REFRESH.md`)
- Actions (per theme, one at a time; run `node tools/validate.mjs` after each theme):
  0. Definitions. *Independent publishers*: two different publisher groups of D-017 (Yle; Sanoma; Alma Media; MTV; STT; each government authority). *Label mapping from Kielitoimiston sanakirja*: entries marked *slangia* or *slang.* → `slangi`; *puhekieltä*/*ark.* (arkikieltä) → `puhekieli`; fixed multi-word expressions listed as idioms → `idiomi`; if a word is not in the dictionary, or the site is unreachable, apply the D-017 slang fallback (two independent sources) or avoid the word; spoken-pronoun/verb forms of K-20261107T001500Z are `puhekieli`. Each `slangi` gloss names the region or age group where the source says so. Tools: WebSearch and WebFetch.
  1. Run `date -u +%Y%m%d` once; that date is the suffix of all six ids. Search the web for Finnish news of the last 7 days (Yle Uutiset `yle.fi/uutiset`, Yle Selkouutiset `yle.fi/selkouutiset`, HS, IS, Iltalehti, MTV Uutiset, Kauppalehti, valtioneuvosto.fi). Pick six stories from six different areas: (1) politics and society, (2) economy and work, (3) science, health and environment, (4) culture and sport, (5) everyday life and new rules, (6) season, weather and Nordic life. Each story must have ≥2 independent publishers for every fact the exercises use. If an area has no suitable story in 7 days, widen to 14 days for that area; if there is still none, use area (6) twice with different topics and log it in `DEVIATIONS.md`.
  2. Write `content-notes/<id>.md` in the D-018 format (`Area: n`, `## Facts`, `## Real people`, `## Word order`). Paraphrase only; no source sentence copied; no quote over 15 words.
  3. Write `data/themes/<id>.json` per D-002: reading 200–450 words (text plus dialogue together) in standard Finnish ending in a spoken-Finnish dialogue `(keksitty esimerkki) …` using ≥1 `slangi` and several `puhekieli` terms (e.g. *mä/sä*, *me mennään*, *onks*, *toi/tää*, *ihan/tosi*, *kiva*, *duuni*, *himaan* — label each correctly; check each slang word in Kielitoimiston sanakirja `kielitoimistonsanakirja.fi` where it is listed and record the check in the content note); listening script 80–220 words in standard Finnish plus a dialogue of 40–100 words, total 120–320; 8 mc/tf + 2 dictation; writing: exactly 4 gaps (case endings, verb tenses, consonant gradation), each with a `near` list of typical wrong forms (wrong case, wrong tense, missing gradation; never the ä/ö-only variant), at least one answer containing ä or ö; 3 word-order tasks (D-017 neutral order, 3–6 chips); 3 translations with stems that survive inflection (e.g. `hallitu`, `päät`) and whole words only for 1–2 letter stems; free writing with checklist saying where each register fits (puhekieli fine in a text message to a friend, not in an email to a council); speaking 6 read-aloud sentences (no digits and no number words, V11/V15) + 4 questions (with `variants` where a natural short answer hits every group). Use absolute dates in texts, never *eilen*/*tällä viikolla*. Every gloss is `Finnish explanation · English`.
  4. Theme ids are `<ascii-slug>-<yyyymmdd>` with the research date; `dateLabel` in Finnish (`7. marraskuuta 2026`). Manifest order: newest first, the six themes in area order 1–6.
  5. After all six: remove `themes/stub-20261107.json` from the manifest and delete it and `content-notes/stub-20261107.md`. The newest theme (first in the manifest) must have ≥2 glossed terms in its reading text, a `slangi` term, and a gap answer with ä/ö (T-035, T-038, T-040 run on it). Run the full suite.
  6. Re-read every sentence that names a real person against its content-note source (L-20261102T231800Z).
- Outputs: `data/themes/*.json` (6), `data/manifest.json`, `content-notes/*.md` (6)
- Evidence produced: V1–V12 pass on real content; T-031, T-035, T-040, T-044 run on every real theme
- Done when: `node tools/validate.mjs` prints `all valid: 6 themes, 24 exercises` (it now also checks V13 and V17); `node --test tests/*.test.mjs` passes; `ls content-notes/*.md | wc -l` = 6; `! grep -q stub data/manifest.json`; `node tools/check-notes.mjs` exits 0; every content note lists two sources per fact.
- Checkpoint: themes done so far
- On failure: R-D3, R-D4, R-D5, R-D6.
- Gate: none
- Relevant decisions/claims: D-002, D-005, D-009, A-004…A-008, C-007, C-008, C-012
- Lessons applied: L-20261102T231800Z-invented-statements-attributed-to-real-athlete, L-20261102T231000Z, L-20261102T232200Z, L-20261009T123005Z-corroborated-label-without-independent-sources, L-20261004T102001Z-recalled-literature-facts-wrong
- Exclusive resources: none

### S-007 README, refresh procedure, screenshots
- Tier: Sonnet
- Profile: software
- Depends on: S-005, S-006
- Inputs: reference `README.md`, `REFRESH.md`
- Actions:
  1. `README.md` (British English): what it is, link `https://qualitycoding.github.io/finnish-exercises/`, themes table with dates, exercise/scoring table, register labels, browser speech support, content and sources policy, development commands, licence.
  2. `REFRESH.md` per D-016 and the D-017/D-018 refresh flow: setup (`npm ci`; run `npx playwright install chromium` only if `$PLAYWRIGHT_BROWSERS_PATH/chromium-1243` is missing), baseline `npm test`, `refresh/<id>` branch, D-018 note format and publisher groups, slang fallback, absolute dates, no numerals in spoken targets, `git fetch origin main && git rebase origin/main` before pushing, CI must pass on the branch, fast-forward only, re-read every real-person sentence, the D-018 live-check selection rule, and a report with `git diff --stat origin/main~1 origin/main` (Finnish adaptation of the reference: sources list of S-006 step 1, keys `luku/kuuntelu/kirjoitus/puhe`, labels, dialogue and gloss rules, `dateLabel` in Finnish, commit message `Weekly theme: <title> (<dateLabel>)`, the three-run confirmation: CI, pages build and deployment, Live site check).
  3. `tools/screenshots.mjs` per D-015: `mkdir -p docs/screenshots`; start `serve('.')` from `tests/server.mjs`, Playwright `chromium` with `devices['Pixel 7']`, open `#/`, the first theme's `luku` (click the first `.term` that has `.tag.slangi` before capturing), `kirjoitus` and `puhe`; wait for `html[data-route]`; `fullPage: true`; run it; open each PNG with the Read tool; note in `EXECUTION_LOG.md` what each shows (legible at phone width, tags visible, no overflow).
  4. File-name check: every path mentioned in README/REFRESH exists (`git ls-files`) (L-20261004T162226Z).
- Outputs: `README.md`, `REFRESH.md`, `tools/screenshots.mjs`, `docs/screenshots/{index,reading-slang,writing,speaking}.png`
- Evidence produced: D-015 visual check
- Done when: the four PNGs exist and are > 10 kB each; `! cat README.md REFRESH.md | grep -qiE 'övning|svenska på|på riktigt|vardagligt'`.
- Checkpoint: step pointer
- On failure: R-D12.
- Gate: none
- Relevant decisions/claims: D-015, D-016
- Lessons applied: L-20261004T162226Z-stale-reference-to-missing-file, L-20261102T232000Z-american-conventions
- Exclusive resources: none

### S-REVIEW Traditional code review
- Tier: Opus (fresh context; dispatched by the orchestrating session)
- Profile: software
- Depends on: S-007
- Inputs: `git diff origin/gen-20261106T235415Z-finnish-current-affairs-exercises...HEAD`
- Actions: review per protocol 3.8.1 (anti-patterns, untested paths, security incl. `innerHTML` use with data, dependency currency by comparing `npm view playwright version` against the pin). Write `reviews/CODE_REVIEW.md` with severity per Rule 4; fix Critical/High (R-D10).
- Outputs: `reviews/CODE_REVIEW.md`
- Evidence produced: review findings
- Done when: file exists; no open Critical/High.
- Checkpoint: findings count
- On failure: R-D10
- Gate: none
- Relevant decisions/claims: D-006
- Lessons applied: L-20261031T100100Z-verify-conformance-claims-against-the-tree
- Exclusive resources: none

### S-ADVERSARIAL Adversarial review
- Tier: Opus (fresh context)
- Profile: software
- Depends on: S-REVIEW
- Inputs: the branch; the running site (`npm run serve`)
- Actions: per 3.8.2: hostile imports (huge file, prototype-pollution keys `__proto__`, wrong types), corrupted `localStorage`, rapid double clicks on `#check`, recognition errors (`onerror` with `not-allowed`, `no-speech`), voices never loading, missing data file, markup in data that would inject HTML; content: answer each exercise as a learner would with plausible alternative phrasings and list any correct answer marked wrong; spot-check two facts per theme against their content-note sources. Each confirmed break → new test via Phase 2 or accepted risk.
- Outputs: `reviews/ADVERSARIAL_REVIEW.md`
- Evidence produced: breaks and dispositions
- Done when: file exists; Critical/High breaks fixed.
- Checkpoint: breaks count
- On failure: R-D10
- Gate: none
- Relevant decisions/claims: D-008, D-009
- Lessons applied: L-20261009T191400Z-worker-never-terminated (resource release on error paths)
- Exclusive resources: none

### S-PUBLISH Merge to main and deploy
- Tier: Sonnet
- Profile: software
- Depends on: S-ADVERSARIAL
- Inputs: green CI on the implementation branch HEAD
- Actions:
  1. If `git ls-remote origin refs/heads/main` prints nothing (the repository has no `main` yet): `git checkout -B main impl-20261106T235415Z-finnish-current-affairs-exercises`. Otherwise: `git fetch origin main && git checkout -B main origin/main && git merge --no-ff impl-20261106T235415Z-finnish-current-affairs-exercises -m "Publish Finnish exercises"`.
  2. `git push origin main`; verify with `git ls-remote origin main`.
  2a. Set `main` as the default branch per D-018 (owner at G-PAGES if refused).
  3. Wait for CI on that commit (`success`).
  4. `gh api repos/qualitycoding/finnish-exercises --jq .has_pages`; if `false`, halt at **G-PAGES**.
  5. After `done` (or if already `true`): find the `pages build and deployment` run for the commit: `gh api 'repos/qualitycoding/finnish-exercises/actions/runs?head_sha='$(git rev-parse HEAD) --jq '.workflow_runs[]|[.name,.status,.conclusion,.id]|@tsv'`. If Pages was enabled after the push and no run exists, push an empty commit `git commit --allow-empty -m "Trigger Pages build"` (a planned action, not a deviation; write an `EXECUTION_LOG.md` line) and repeat. Apply R-D8 on `startup_failure`.
  6. Wait for `Live site check` for the same commit and accept it only per D-017 (job `live` = `success`; dispatch if absent after 10 minutes) (R-D9).
- Outputs: `main` branch; run ids in `state.json`
- Evidence produced: SC-1
- Done when: for the same commit on `main`: CI `success`, pages build and deployment `success`, Live site check accepted by the D-018 rule, and `default_branch` = `main`.
- Checkpoint: run ids
- On failure: R-D7, R-D8, R-D9
- Gate: G-PAGES (if Pages is off); G-002 pre-approved (A-011)
- Relevant decisions/claims: D-010, A-010, A-011, C-010
- Lessons applied: L-20261015T090000Z-public-repo-artifacts-are-publication (publication only under A-011), K-20261102T231600Z-pages-first-build-startup-failure
- Exclusive resources: `main` branch

### S-LEARN Learner trial
- Tier: Sonnet
- Profile: software (courseware)
- Depends on: S-PUBLISH
- Inputs: run ids, screenshots, content notes
- Actions: write `GATE-G-LEARN.md` with the evidence bundle and questions of `plan/GATES.md`; halt.
- Outputs: `GATE-G-LEARN.md`
- Evidence produced: SC-8 (on `proceed`)
- Done when: the owner's response is recorded in `GATE-G-LEARN.md` and its branch taken.
- Checkpoint: gate state
- On failure: n/a
- Gate: G-LEARN
- Relevant decisions/claims: A-014, A-017
- Lessons applied: L-20261101T042000Z-commit-gate-records-with-the-response
- Exclusive resources: none

### S-REFRESH Scheduled weekly refresh
- Tier: Sonnet (schedule created by the orchestrating session, which has the scheduling tool)
- Profile: software (courseware)
- Depends on: S-LEARN with response `proceed` or `proceed-with-rescope`
- Inputs: `REFRESH.md`, live-check workflow (both on `main` from S-007/S-002)
- Actions:
  1. Confirm `REFRESH.md` and `.github/workflows/live-check.yml` are on `main`, `default_branch` is `main`, and the Live site check succeeded at least once (S-PUBLISH step 6).
  2. Look up the session's environment with the scheduling tools (`list_environments` if offered; otherwise omit `environment_id` so the task inherits this session's environment). Create a cloud scheduled task (no local device), push notifications on, cadence from G-LEARN (default `CRON_TZ=Europe/London 23 10 * * 6`), name `Finnish exercises weekly theme`.
  3. Prompt (verbatim): "Weekly refresh for github.com/qualitycoding/finnish-exercises. Attach the repository with push access (add_repo qualitycoding/finnish-exercises, access push) and clone it. Run `git push --dry-run origin HEAD:main`; if refused, stop and report which GitHub App setting the owner must change. Then follow REFRESH.md in the repository exactly: add one new theme with its content note on a branch refresh/<id> (append-only, new dated id first in data/manifest.json, never edit or delete existing themes), push the branch, wait for CI success on it, then fast-forward main with `git push origin refresh/<id>:main` (never --force), rotate the topic area away from the newest theme, two independent sources per fact, re-read every sentence naming a real person against its source, publish only if `node tools/validate.mjs`, `node tools/check-notes.mjs` and `node --test tests/*.test.mjs` pass (fix content, never tests or validator rules; stop after three attempts), and report the theme title, sources, commit and the results of CI, pages build and deployment and Live site check for that commit. If anything failed or was skipped, say so first. Write in British English."
  4. Tell the owner the first run time and the approval setting the task received.
- Outputs: scheduled task id recorded in `GATE-G-LEARN.md`
- Evidence produced: SC-8
- Done when: the task exists (listed by the scheduling tool) with the cadence and prompt above.
- Checkpoint: task id
- On failure: report that the schedule could not be created and why; the site remains valid.
- Gate: none (decided at G-LEARN)
- Relevant decisions/claims: D-016, A-017
- Lessons applied: none
- Exclusive resources: none

### S-RETRO Retrospective
- Tier: Opus (fresh context)
- Profile: software
- Depends on: all previous steps
- Inputs: protocol 3.7.1 inputs
- Actions: per 3.7.1, including the deviation diff against this plan and `plan/ENVIRONMENT.md`, and the plan-control-to-delivery map (L-20261004T102010Z).
- Outputs: `RETROSPECTIVE.md`, new `lessons/L-*.md`, `knowledge/K-*.md`, source-register additions
- Evidence produced: none
- Done when: every finding links to an `L-`/`K-` file; Appendix C schema check exits 0.
- Checkpoint: counts
- On failure: fix records; rerun schema check.
- Gate: none
- Relevant decisions/claims: —
- Lessons applied: L-20261004T102010Z-plan-controls-not-traced-to-delivery
- Exclusive resources: none

### S-KNOW Lessons & knowledge push
- Tier: Haiku
- Profile: software
- Depends on: S-RETRO
- Inputs: `lessons/`, `knowledge/`
- Actions: per 3.7.2 with gate G-003 (targets `qualitycoding/Lessons`, `qualitycoding/knowledge`; both need push access via `add_repo … access push` at that time).
- Outputs: pushes to the stores, or bundles
- Evidence produced: none
- Done when: per 3.7.2 item 4.
- Checkpoint: pushed IDs
- On failure: bundle fallback.
- Gate: G-003
- Relevant decisions/claims: A-016
- Lessons applied: L-20261009T140014Z (gate ids namespaced: G-PAGES, G-LEARN)
- Exclusive resources: store repositories

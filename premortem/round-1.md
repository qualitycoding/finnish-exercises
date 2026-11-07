# Pre-mortem round 1

Reviewer: fresh-context Opus agent, 2026-11-07. Scope: `HANDOFF.md`, `plan/*.md`, `research/claims.json`, `research/PRIOR_KNOWLEDGE.md`, `premortem/RISK_REGISTER.md`, `tests/*.mjs`, `research/spikes/satisfiability/*`, the reference `qualitycoding/swedish-exercises` at `b8c4f57` (local clone).

**Premise.** It is May 2027, six months after launch. Every step was carried out exactly as written, and the site has still failed. The reports below explain how. New risks are R-009 onwards in `RISK_REGISTER.md`.

## What was run (evidence)

| Check | Result |
|---|---|
| `sha256sum -c tests/FROZEN_MANIFEST.sha256` | 4/4 OK |
| Spike `scoring.js` + `validate.mjs` (import fixed) under `/tmp/x`: `node --test tests/scoring.test.mjs tests/validate.test.mjs` | 24/24 pass, so T-001…T-024 are satisfiable |
| `node --test tests/` (directory form) on Node v22.23.4 | fails (`# fail 1`), confirming C-013 |
| `npm view playwright@1.63.0 version` / `npm view playwright version` | `1.63.0` exists; latest is already `1.65.0` |
| `git ls-remote` for checkout v7.0.1 / setup-node v7.1.0 | SHAs match C-009 |
| Probe of spike scoring (`/tmp/probe.mjs`) | see the table below |
| Reference `swedish-exercises/assets/app.js` import and `REFRESH.md` | import **replaces** the whole store with no per-entry checks; refresh pushes **straight to `main`** after local tests |
| WebFetch `kielitoimistonsanakirja.fi` from this session | refused (`URL_NOT_ON_ALLOWLIST`) |

Scoring probe (spike `scoring.js`, the code S-003 starts from):

| Learner input → target | Points | Correct? |
|---|---|---|
| gap `hallitukset` → `hallituksen` (plural nominative given for genitive) | 0.5 | no: wrong form rewarded |
| gap `kaupasta` → `kaupassa` (elative given for inessive) | 0.5 | no: the case being tested is wrong |
| gap `talolta` → `talolla` | 0.5 | no |
| gap `kauppan` → `kaupan` (gradation error) | 0.5 | no: gradation is what the gap tests |
| translate `Hinnat nousivat.` with keywords `[hinna/hinta],[nouse]` | 0.5 | no: past tense is a correct translation |
| translate `Valtionbudjetista keskustellaan eduskunnassa.` with `[eduskun],[keskustel],[budjet]` | 0.5 | no: compound words miss `budjet` |
| respond `Budjetin.` to *Mitä hallitus esitti?* | 0 | no: a natural elliptical Finnish answer gets nothing |
| read-aloud transcript `hallitus esitti 3 budjettia` → `…kolme budjettia` | 0.5 | no: recognisers write numbers as digits |
| read-aloud transcript `eduskunta keskustelee valtion budjetista tänään` → `…valtionbudjetista tänään` | 0 | no: the recogniser split a compound |
| read-aloud, one ending misheard (`eduskunnalla`/`eduskunnalle`) in 6 words | 0.5 | harsh |
| order `Budjetin esitti hallitus` → `Hallitus esitti budjetin.` | 0 | grammatical OVS order (marked) |

## Incident reports by lens

### 1. Technical correctness
- **IR-1 The typo allowance gives half marks for the grammar error the gap is testing (R-009).** The S-006 gaps test case endings and consonant gradation, but D-004 gives ½ for any one-letter edit in a word of 6+ letters. Changing one case ending is usually one edit (`-ssa`/`-sta`, `-lla`/`-lta`, `-n`/`-t`), and so is a gradation slip (`kaupan`/`kauppan`). Learners were told 'Almost: one typo' when they had picked the wrong case. The frozen T-003 fixes this behaviour for `hallituken`. The fix therefore has to add something (a list of known wrong forms) and must not remove the allowance.
- **IR-2 Speaking scores are dominated by the recogniser, not by the learner (R-011).** For a 6-word read-aloud sentence, one misheard ending already drops below 0.9, which gives ½. Compound splits and digits give 0 or ½. D-004's 'best of 3 attempts' is also ambiguous: it could mean 3 taps or `maxAlternatives = 3`, and the plan does not say whether the best recognition alternative is scored (R-023).
- **IR-3 The import corrupts or wipes progress (R-013).** D-008 checks only `version === 1` and that `scores` is an object. The reference port replaces the whole store on import, so importing last month's export on the phone wiped this month's scores. A file with `"best":"10"` (a string) made `#total-best` concatenate strings. If the port merges with `Object.assign`/`target[k] = v`, an imported `"__proto__"` key re-parents `scores`, and every exercise then shows 10/10.

### 2. Dependency drift
- On the day of planning, Playwright `1.63.0` is already two minor versions behind (`1.65.0`). This is harmless for a static site, but S-REVIEW's currency check will flag it every time (R-029, Low).
- `ubuntu-24.04` apt dependencies for `--with-deps chromium` and Chrome's Web Speech service (on-device recognition, changes to the voice list) can change under the site. CI cannot detect a Web Speech change because the API is mocked. G-LEARN question 3 is the only real-device check, and it runs once (R-029).
- The suite grows by four T-031 cases and four T-033 hops per weekly theme. At about 32 themes by month 6 and about 58 by month 12, the browser suite approaches the 25-minute `timeout-minutes` limit. The index then lists over 200 links on a phone (R-021).

### 3. Single-source and inferred claims
- C-001 (no Finnish voice in desktop Chrome) comes from one publisher. The About text built on it, 'Chrome on desktop has none', is wrong for Chrome on macOS, which exposes Apple *Satu*, and for Windows with the Finnish language pack, which has *Heidi* (R-025).
- C-004 (recognition supports fi-FI) has only two tier-4 sources. The self-assessment fallback covers missing recognition, but it does not cover recognition that exists and transcribes Finnish badly. That is IR-2.
- C-002 and C-003 rest on one knowledge-store item each and are labelled 'corroborated'. Under L-20261009T123005Z they are single-source.
- The Live site check depends on Pages' built-in `pages build and deployment` emitting `deployment_status` events that start another workflow. No claim records this. It is inferred from the reference repository and could not be checked from this session (R-018).

### 4. Implementer misinterpretation
- **D-005 contradicts V9 (R-012).** D-005 says to list **every** grammatical order. V9 rejects any task whose reversed canonical order is accepted, and in Finnish the reverse of an SVO sentence is often grammatical (OVS, marked). The implementer has two choices: drop the grammatical order, which breaks D-005, or rewrite the sentence until the reverse is ungrammatical, which the plan never says. T-004's own example marks a grammatical OVS order as wrong.
- **What `#play` does when no voice is found is unspecified (R-020).** D-007 sets `data-voice='none'` but does not say whether `#play` stays enabled. On iOS, `getVoices()` is often empty at load, and `voiceschanged` may not fire within 2 s. A port that disables `#play` on `none` silences listening on the iPhone, which has *Satu*.
- **New validator rules cannot go into `validateTheme` (constraint on all mitigations).** The frozen T-010 asserts that the fixture produces `[]`. Any new mandatory field or rule inside `validateTheme` makes T-010 fail. New content rules must run in a separate function called by `validateAll` and the CLI, with new tests T-025 onwards added through Phase 2.
- Kielitoimiston sanakirja may be unreachable. This session's WebFetch was refused. S-006 step 0 then allows `puhekieli` only for pronoun and verb forms, and says to avoid every other unverified word. V5 still requires at least one `slangi` in every reading. The step cannot be completed without guessing (R-017).

### 5. Integrity
- **The weekly refresh publishes unverified content (R-015).** Pages deploys `main` on every push, whatever CI says. The reference REFRESH pushes straight to `main`. The refresh prompt does not require content notes (D-009), a second-publisher check per fact, the S-ADVERSARIAL spot check, or a ban on force-pushing. By month 6, about 26 themes had been published that no one but the writing agent had checked. One of them attributed a paraphrased position to a minister, and the reference was only on the news page.
- **'Independent publishers' are not independent (R-016).** The outlet list in S-006 step 1 contains pairs with the same owner: HS and IS are both Sanoma, and Iltalehti and Kauppalehti are both Alma Media. Separate Yle hosts (`yle.fi`, `svenska.yle.fi`) also pass V2, which counts hosts, not publishers. A fact 'corroborated' by HS and IS sharing one wire story counts as single-source under L-20261009T123005Z.

### 6. Past lessons
- L-20261029T000000Z (green CI gate never ran) recurs as R-018. `deployment_status` fires for `queued`/`in_progress`/`success`. Each event creates a `Live site check` run whose job is skipped unless the state is `success`. The polling convention picks 'the run named exactly Live site check' and does not say which one, so a skipped run can be read as the check.
- L-20261102T231800Z (invented statements about a real person) recurs through the refresh path (R-015), because the S-006 step 6 re-read and the S-ADVERSARIAL spot check never run on weekly content.
- L-20261009T123005Z (corroborated without independent sources) recurs as R-016.

### 7. Security
- **Hostile import JSON (R-013).** There is no size cap, no key pattern, and no type or range check on `best`/`last`/`attempts`/`history`. `__proto__` handling depends on how the port merges.
- **Markup injection (R-014).** The validator checks `[[…]]` markup but not raw `<`/`>` in any string (`options`, `explain`, `hint`, `title`, `summary`, `sources[].title`, `model`, `checklist`). The theme text is written by an agent from news web pages. If any renderer uses `innerHTML` (the reference does not, but D-006 does not forbid it), script runs on `qualitycoding.github.io`. That origin is shared by **every** Pages site of the owner, so the script could read and rewrite the stored data of all of them. No CSP is planned.
- Prototype pollution through theme JSON is not reachable if the app only reads named fields. Treat it as covered by the no-`innerHTML` rule and the key-pattern rule.

### 8. Operational
- The Live check can report success without having run, or it can never start (R-018).
- The scheduled task's approval mode and the `add_repo … access push` confirmation can stall unattended runs. Notifications go out only when 'something noteworthy' happens, so the owner sees nothing and no new theme appears for weeks. Nothing in the repository detects stale content (R-022).
- A concurrent push (an iterate fix or the owner) makes the refresh's push non-fast-forward. The prompt does not forbid `--force`. OPERATIONS.md does, but the refresh agent is not told to read OPERATIONS.md (part of R-015).

### 9. CI coverage
- CI runs only Chromium, with Web Speech mocked. Any WebKit-only failure goes unseen until a learner reports it on an iPhone, for example a regex lookbehind in sentence splitting on iOS < 16.4, a storage policy, or `voiceschanged` behaviour (R-028).
- CI does not check that refresh commits are append-only (existing theme files unchanged, ids kept). It does not check the content notes. It does not run on `refresh/**` branches. The workflow-swallow grep and `sha256sum -c` are sound.
- D-014's premise that 'every validator rule has a test that must fail' is false. The per-theme ä/ö gap rule (V8), the reversed-order rule and the canonical-rebuild rule (V9), and the duplicate-id and file-name rules (V1 in `validateAll`) have no failing test (R-031).

### 10. Courseware
- **Scoring fairness for Finnish:** inflection (IR-1), synonyms, compounds and tense in keyword items (R-010), free word order (R-012), and recogniser artefacts (R-011). Each is a correct answer marked wrong or a wrong answer marked half right.
- **Session length:** R-008 stands. Writing has 10 scored tasks plus 50–80 words of free writing, which is likely over 10 minutes at B1.
- **Register-label accuracy:** the mapping from *ark.* to `puhekieli` mixes colloquial vocabulary (*kiva*) with spoken morphology (*mä*, *mennään*). Requiring a `slangi` term every week pushes in Helsinki *stadi* slang presented as general Finnish (R-024). There is also R-017.
- **Speech coverage:** R-003/R-004 stand. Added: the iOS voice list can be empty at load (R-020). TTS reads the marker '(keksitty esimerkki)' aloud and splits at ordinals such as '7.' (R-027).
- **Persistence loss:** iOS Safari deletes script-writable storage after seven days of browser use without a visit to the site (WebKit ITP). A learner on a fortnightly rhythm lost everything (R-019). There is also the import overwrite (R-013).
- **Stale content:** old themes keep relative time words such as 'this week' and 'yesterday' with only a date label (R-026). The refresh silently stopped (R-022).
- **A refresh breaking saved scores:** append-only is a prompt instruction, not a check. A refresh that 'fixes' an old theme's id orphans its scores (R-015 mitigation adds the CI check).

## Frozen tests: satisfiable? contradictory?

- **T-001…T-024** are satisfiable (24/24 against the spike).
- **T-030…T-047** were not run (instructed). On reading, nothing in them is unsatisfiable, and the reference app passes analogous tests. The points of contact with the decisions:
  - T-003 fixes the one-edit ½ (`hallituken`). The R-009 mitigation is additive for that reason.
  - T-004 shows a grammatical OVS order scoring 0. That is an example of the function, not a rule, but it models the R-012 problem for the implementer.
  - T-010 fixes the fixture to `[]`, so new rules must live outside `validateTheme`.
  - The T-031 wrong run plus D-004 'best of 3 attempts': if per-item bests survive `#retry`, the wrong run scores 10. The test would catch this, so it is not silent.
- **No frozen test is invalid.** One decision contradicts a frozen-rule-backed decision: D-005 against V9's reverse ban (R-012).

## Mitigations requiring plan changes (Critical/High)

See the Mitigation column of R-009…R-020 in `RISK_REGISTER.md`. Every new test goes through Phase 2 (unfreeze, add, red-verify, re-freeze) with a `D-###` amendment.

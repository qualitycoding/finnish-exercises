# Pre-mortem round 2

Reviewer: fresh-context Opus agent, 2026-11-07, plan at commit `4a7505b`. Scope: D-017 in `plan/DECISIONS.md`, `plan/PLAN.md` (ci.yml, S-005, S-006, S-REFRESH), `tests/*-v2.test.mjs`, `research/spikes/satisfiability/*`, round-1 files, the reference `qualitycoding/swedish-exercises` (local clone). Budget: about 15 minutes; no browser suite run, no web search. New risks are R-032 onwards in `RISK_REGISTER.md`.

## What was run (evidence)

| Check | Result |
|---|---|
| `sha256sum -c tests/FROZEN_MANIFEST.sha256` | 7/7 OK |
| Spike `scoring.js` + `validate.mjs` (import fixed) under `/tmp/x`: `node --test tests/*.test.mjs` (scoring, scoring-v2, validate, validate-v2) | 35/35 pass, so T-001…T-029 and T-051…T-058 are satisfiable |
| Probe of spike `scoreKeywords` | `kaup` matches *Kaupungissa* (city), `talo` matches *Talous*, `vero` matches *Veroton*: each 1 point |
| Probe of spike `scoreSpoken` (correct readings, recogniser writes digits) | `Kuusi ministeriä erosi.` → ½ (0.75); `Kahden ministerin mukaan.` → ½ (0.73); `…kolme miljardia` → ½ (0.83); `viisi prosenttia` → `5 %` → 0 (0.48) |
| Spike V15 on read targets | *Kuusi*, *Kahden*, *kolmen miljardin*, *viidellä prosentilla* not caught; *Sata* caught |
| Reference `assets/app.js` | DOM helper `h()` sets every attribute with `setAttribute`, and 13 call sites pass `style` (including the progress bar width) |
| PLAN ci.yml refresh step | guards only `data/themes` (two-dot diff against the tip of `main`) |
| T-058 | asserts `validateAll` returns `[]` when the content note is just `# notes` |

## Verdicts on round-1 Critical/High risks

| Risk | Verdict | Why |
|---|---|---|
| R-009 one-edit ½ for the tested grammar error | Closed | `near` list scores 0 before the typo rule (T-025); V13 in `contentRules` (T-054); T-003 still green. D-017 needs ≥1 near form (the register said ≥2), which is enough. |
| R-010 keyword stems miss correct answers | Closed (residual Medium) | Compounds are fixed (T-027). The elliptical answer is handled by rewording the question, and `variants` are checked when given (T-055). Mandatory `variants` (the round-1 mitigation) were not adopted. They now cannot go into `validateTheme`, `contentRules` or `validateAll`, because T-051 and T-058 freeze a fixture without them. Substring matching adds over-matching (R-038). |
| R-011 recogniser artefacts | **Not closed** | Character-level `scoreSpoken` fixes split compounds and single misheard endings, and best of 3 is defined. But V15's word list misses *kuusi*, *nolla*, every inflected form (*kahden*, *kolmen*, *viiden*, *miljoonan*) and *prosentti\**. Correct readings still score ½ or 0 (R-032). |
| R-012 D-005 vs V9 | Closed | D-017 makes neutral order the target and supersedes 'every grammatical order'. V9 is now 3–6 chips (T-053). |
| R-013 import wipe / pollution | Closed | Merge rules, key regex, `Object.create(null)` semantics and per-entry checks. T-048 covers older export, `__proto__`, string `best` and bad key. |
| R-014 HTML injection | Closed for injection | Sink ban (CI grep), V16 (T-057) and CSP. The CSP itself breaks the ported UI (R-035). |
| R-015 refresh publishes unverified content | **Not closed** | Branch → CI → fast-forward and the append-only check close the publish-before-CI part. Two gaps remain. First, the CI guard covers only `data/themes`, so a refresh can weaken `tools/validate.mjs`, `ci.yml`, `assets/` or drop themes from the manifest and still pass (R-033). Second, V17 only checks that a file exists, and the frozen T-058 accepts `# notes`. The weekly prompt does not ask for the S-006 step 6 named-person re-read, and nothing checks two publisher groups per fact (R-034). |
| R-016 publisher independence | Closed in prose | The D-017 group table and the PLAN S-006 step 0 definition. Nothing checks it mechanically, so it is folded into R-034. |
| R-017 slang authority unreachable | Closed | D-017 fallback (two independent sources found by search, both URLs in the note, never recall alone). |
| R-018 Live check counted when skipped | Closed for S-PUBLISH | Acceptance is at job level (`live` = `success`) with a dispatch fallback (Conventions, S-PUBLISH step 6). `REFRESH.md` is not told to apply the same rule (R-039, Medium). |
| R-019 iOS 7-day storage deletion | Closed (residual Medium, inherent) | `persist()` (T-059), Home Screen advice and a back-up reminder based on `lastExport`. |
| R-020 `#play` disabled with no voice | Closed (residual Medium) | Play is never disabled and speaks with `fi-FI` (T-049). 'Re-run voice selection' on tap could import D-007's 2 s wait (R-036). |
| R-031 rules without failing tests | Closed | T-052 (V8), T-053 (V9 reversed and chip count), T-058 (V1 duplicate and file name, V17). The V9 canonical-rebuild branch is still untested, but it is close to a tautology (Low). |

## New Critical/High risks

### R-032 (High) V15 misses most Finnish number forms
The spike's `NUMBER_WORDS` lists only base forms, and lacks *kuusi* and *nolla*. News sentences use inflected numerals (*kahden ministerin*, *kolmen miljardin*, *viidellä prosentilla*). Recognisers write these as digits. A learner who reads correctly gets ½, or 0 for `prosenttia`→`%`, with no workaround. **Fix:** in `contentRules` (T-051's fixture has no numerals in spoken targets, so it stays green), reject any read or dictation word matching
`/^(nol+|yh(den|te|de)|yksi|kah(den|te|de)|kaksi|kolm|nelj|vii(si|de|te)|kuu(si|de|te)|seitsem|kahdeks|yhdeks|kymmen|sa(ta|da|toj|tai)|tuha(t|nn|nsi|tta)|miljoon|miljard|prosent|puolitoista)/`
(drop *sataa* 'it rains' from the list), plus `ensimmäi`/`toise` ordinals. Add a Phase 2 test (T-060: *Kahden ministerin mukaan.* and *Hinnat nousivat prosentilla.* → `[V15]`).

### R-033 (High) Refresh-branch CI guards only `data/themes`
`ci.yml` checks only that no existing `data/themes/*.json` changed. A refresh that 'fixes' a failing validation by editing `tools/validate.mjs`, removes themes from `data/manifest.json` (which orphans scores and content) or edits `assets/` still gets CI `success` and is fast-forwarded to `main`. The CI then reports success on weakened checks. The prompt's 'never validator rules' is the only control. **Fix:** replace the step body with an allow-list. It fails unless every path in `git diff --name-status origin/main HEAD` is an `A` under `data/themes/<id>.json` or `content-notes/<id>.md`, or an `M` of `data/manifest.json`. It also fails unless `node -e` confirms that the old manifest's `themes` array is a suffix of the new one. The refresh report includes `git diff --stat origin/main HEAD` so the owner sees any edit to `ci.yml` itself, because the branch's own workflow file runs.

### R-034 (High) Content notes are not verified on the weekly path
V17 checks only that a file exists, and the frozen T-058 accepts a note that is just `# notes`, so a stronger V17 cannot live in `validateAll`. Nothing checks two publisher groups per fact. The verbatim refresh prompt omits the S-006 step 6 re-read of every sentence naming a real person. This is the round-1 failure (unverified claims about real people published weekly), and it is still possible. **Fix:** add `tools/check-notes.mjs <id>`, separate from `validateAll` so T-058 stays valid. It runs in CI on `refresh/**` for each added theme. The note must have a facts table whose every row has ≥2 https URLs. Their registrable domains must map to ≥2 distinct groups of a JSON publisher-group map (D-017 table; subdomains collapse; STT counted once). It must also have a 'Named persons' section with one URL per sentence. Add Phase 2 tests for it. Append to the refresh prompt: 'write the content note as in S-006 step 2 and re-read every sentence naming a real person against its source (S-006 step 6)'.

### R-035 (High) CSP `style-src 'self'` blocks the reference UI's inline styles
S-005 says to port `app.js` from the reference and add the D-017 CSP. The reference `h()` applies `style` through `setAttribute`, at 13 call sites including the dynamic progress-bar width. Under `style-src 'self'`, Chromium refuses each one and logs a console error. That fails the frozen no-console-error assertions (`tests/e2e.test.mjs` lines 121, 140, 184) and leaves the bars at zero width. Round 1's '(inline styles moved to CSS)' was dropped from D-017, so the implementer has to guess whether to rewrite the styles or weaken the CSP (`'unsafe-inline'`). **Fix:** D-017/S-005 text. Move static `style` attributes to classes in `style.css`. Set dynamic values with CSSOM (`el.style.setProperty('width', …)`), which CSP does not block. Never weaken `style-src`. Add a CI grep step that fails on `setAttribute\(['"]style|style: *['"\`]` in `assets/*.js`. Keep `img-src data:` for the `data:,` favicon.

## Medium/Low (registered, not blocking)
- R-036: 'every tap re-runs voice selection (D-007)' could bring in D-007's 2 s `voiceschanged` wait. On iOS a delayed `speak()` loses user activation and is silent. T-049 also reads `__langs` straight after the click. Fix: on tap, select from `getVoices()` synchronously only.
- R-037: the append-only diff is two-dot against the tip of `main`. If `main` moved after branching, its newer themes show as `D` and the refresh fails. A rebase then pushes a commit to `main` that has had no CI. Fix: require `git merge-base --is-ancestor origin/main HEAD` (else 'rebase on main and push the branch again') and fetch enough history.
- R-038: substring matching for stems of 4+ letters over-matches (`kaup`→*kaupunki*, `talo`→*talous*, `vero`→*veroton*). Fix: authoring rule and a `contentRules` check against a small decoy list, or substring matching only for stems of 5+ letters (T-027 uses `vero` and `kaup`, so a decoy list is the compatible choice).
- R-039: `REFRESH.md` is not told to apply D-017's Live check acceptance and dispatch fallback. Fix: state the rule in REFRESH.md.
- R-040 (Low): document drift. D-003/D-005 say up to 8 chips while D-017 says 3–6. The register gives the R-011 ½ threshold as 0.7, but D-017 uses 0.6, and T-029 needs ≤ 0.655. PLAN S-006 step 3 lists '4 gaps' twice. V15's list contains *sataa* ('it rains').

## Summary
Round-1 risks: 10 closed, 2 not closed (R-011, R-015). New: 0 Critical, 4 High (R-032…R-035), 4 Medium (R-036…R-039), 1 Low (R-040). No frozen test is invalid. All non-browser frozen tests are satisfiable (35/35).

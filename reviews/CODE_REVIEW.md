# Code review (S-REVIEW)

Branch `impl-20261106T235415Z-finnish-current-affairs-exercises`, HEAD `7c01b28`. Reviewed by a fresh-context agent.
Scope: `git diff 0979d99...HEAD` excluding `research/`, `knowledge/` and `lessons/`; read `index.html`, `assets/*.js`, `assets/style.css`, `tools/*.mjs`, `.github/workflows/*.yml`, `README.md`, `REFRESH.md`, `package.json`, `data/` and the content notes.

Nothing was fixed or committed. Evidence below was produced by running the code: `node --test tests/*.test.mjs` (82 pass, 0 fail, 0 skipped, 0 todo, about 50 s), `node tools/validate.mjs`, `node tools/check-notes.mjs`, `sha256sum -c tests/FROZEN_MANIFEST.sha256` (all OK), `npm audit` (0 vulnerabilities) and a throw-away Playwright probe kept outside the repository (`/tmp/review/probe.mjs`).

## Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 5 |
| Low | 10 |

No open Critical or High finding, so the S-REVIEW done-when condition ("no open Critical/High") holds. The five Medium findings are worth fixing before S-PUBLISH because each is cheap and two of them (CR-01, CR-03) are real, reproducible faults.

## Findings

### CR-01 (Medium) A malformed saved score blanks the whole app

- **Location:** `assets/app.js:179-181` (`fmtScore`), `:187-192` (`badgeFor`), `:529-531` (`renderIndex`), `:752` (`renderExercise` status line), `:1257-1259` (`boot`).
- **Evidence:** `loadStore` (`:44-56`) accepts any object as `scores` and `badgeFor` calls `fmtScore(s.best)` and `fmtScore(s.last)` without checking types. In the probe, each of these stored values made `route()` throw:
  - `{"scores":{"<id>-luku":{"best":"7","last":3,"attempts":1,"history":[]}}}` → `n.toFixed is not a function`
  - `{"best":null}` → `Cannot read properties of null (reading 'toFixed')`
  - `{"best":5}` (no `last`) and `"x"` → `Cannot read properties of undefined (reading 'toFixed')`

  `route()` throws inside `boot()` before `data-ready` is set, so the page stays on "Loading the exercises…" with no message. The error is an unhandled rejection. D-006 says `data-ready` becomes `1` or `error`; here it stays unset. The same fault breaks the exercise page's "Best so far" line (`:752`). Only `#/tietoja` still renders, so a learner has no hint that "Reset all results" would fix it. Nothing the app writes can produce such a value, but `localStorage` is per origin and `qualitycoding.github.io` also serves sibling project sites, and users edit storage by hand. The import path validates entries (`cleanEntry`), so only the load path is unprotected. The probe also showed that `null`, `[]`, `"not json"` and `{"scores":[]}` are handled, so the gap is entry-level only.
- **Fix:** sanitise on load. Run every entry through `cleanEntry` (or a lenient variant that coerces `best`, `last` and `attempts` with `Number(...)||0`) inside `loadStore`, and drop entries that fail. Make `fmtScore` total (`Number.isFinite(n) ? ... : "–"`). Wrap `route()` in `try/catch` that shows an error panel and sets `data-ready="error"`. Add a test that seeds the store with each value above and expects the index to render.

### CR-02 (Medium) Speech synthesis failures are neither handled nor reported

- **Location:** `assets/app.js:387-403` (`speakParagraphs`), `:405-411`, `:1118-1121`, `:950-951`, `:1040`.
- **Evidence:** `speech.synth.cancel()` and `speech.synth.speak(u)` are not wrapped in `try/catch`, and no utterance has `onerror`. With a `speak` that throws (probe C) a tap on `#play` produces an uncaught `PAGEERR synthesis-failed` and the learner sees nothing. When `speechSynthesis` is absent, `speakParagraphs` returns `false` and every caller ignores it, so the Play, part, Slowly, "Hear the model" and "Hear the question" buttons do nothing silently (only the voice-status line on the listening page explains it, and the dictation and speaking pages have no such line). Real engines report `synthesis-failed`, `audio-busy`, `not-allowed` and `voice-unavailable` through `utterance.onerror` (D-006a.13 allows `getVoices/speak/cancel/addEventListener`, and the frozen mock tolerates a missing `onerror`).
- **Fix:** wrap `cancel/speak` in `try/catch`; set `u.onerror` (assign the property, the mock ignores it) to write a visible `role="status"` message such as "Your browser could not play the audio. Read the transcript instead."; surface the `false` return (no synthesis) as the same message next to the button that was pressed. Add one e2e test with a throwing `speak` and one with `speechSynthesis` deleted.

### CR-03 (Medium) A sentence ending in a number is read as an ordinal and merged with the next sentence

- **Location:** `assets/app.js:366-380` (`sentences`, the `ordinal` test `/^\d+\.$/`); data `data/themes/kruunusillat-ratikka-20261107.json:141`.
- **Evidence:** the listening script says "Reitillä kulkevat linjat 11 ja 12. Ylen mukaan ensimmäinen ratikka …". The splitter treats `12.` as an ordinal, so the two sentences become one utterance, and a Finnish voice reads "12." as the ordinal *kahdestoista*. A scan of all themes found this one instance (`node` scan of script, dialogue and spoken targets for `\d+.` followed by a capital letter). V11 and V15 only cover dictation and read-aloud targets, not scripts, so the validator cannot catch it. D-017 specifies "not split after an ordinal (`\d\.`)", which the code follows literally; the rule is too coarse.
- **Fix:** treat `\d+.` as an ordinal only when the next word starts with a lower-case letter (the *7. marraskuuta* case), otherwise split. Independently, write the numbers out (*linjat yksitoista ja kaksitoista*) or reword that script sentence. Add a unit test for the splitter (it is currently untested; export it or test through the page with the speech mock, checking `window.__spoken`). Consider extending V11 to scripts (digits followed by a full stop and a capital).

### CR-04 (Medium) Several D-017 and D-018 behaviours and README claims have no test

- **Location:** `tests/` (frozen files are untouched, per the Phase 2 route new tests need a new file such as `tests/review-v1.test.mjs`); `README.md:35`, `README.md:60-68`.
- **Evidence:** a search of `tests/*.test.mjs` finds no assertion for:
  - the 1 MB import limit (probe D shows it works, but nothing guards it), `history` limits, the `attempts` and score ranges, and "bad file leaves scores untouched" beyond the single wrong-version case in T-042;
  - the three-attempt cap and disabled button in speaking, the fourth-tap rule, and `#retry` re-enabling it (README line 35 says "best of three attempts");
  - recognition `onerror` paths (`not-allowed`, `no-speech`), which D-017 and S-ADVERSARIAL name;
  - the "Back up your scores" reminder (`needsBackup`, `lastExport`);
  - voice waiting on `voiceschanged` (2 s) and the "no speech synthesis" message;
  - the sentence splitter and abbreviations (D-017 "Speech");
  - corrupted storage (see CR-01) and a throwing `speak` (CR-02);
  - the CSP meta element and the CI-only checks (no test fails if someone adds an inline script or `setAttribute('style', …)`; CI greps cover only `assets/*.js`).
- **Fix:** add a Phase 2 test file covering the list above, red-verified against the current commit, with its hash appended to `tests/FROZEN_MANIFEST.sha256` and IDs added to `plan/TRACEABILITY.md`. Include an assertion that `index.html` carries the exact D-017 CSP and that no page logs a CSP violation.

### CR-05 (Medium) Public claim that labels follow Kielitoimiston sanakirja is not backed by what was done

- **Location:** `assets/app.js:638` (About page: "Labels follow Kielitoimiston sanakirja where the word is listed"); `content-notes/*.md` "Slang check" sections; `DEVIATIONS.md` (S-006 slang entry); `README.md:26-27`.
- **Evidence:** the dictionary was unreachable for the whole build (DEVIATIONS S-000 and S-006), and five of the six notes say "Kielitoimiston sanakirja unreachable". The slang evidence per word comes from Wikipedia (8 links), Preply (8) and Sublearn (4). These are a general encyclopedia and two commercial learning sites, and D-017 requires "two independent sources", which these only loosely meet (Preply and Sublearn are both learner-oriented lists). The fourth note (ennallistamissuunnitelma) has no "unreachable" remark but is also fallback. `tools/check-notes.mjs` does not check the slang section, so nothing mechanical enforces D-017 here. The About sentence reads as if the dictionary had been consulted.
- **Fix:** reword the About text to match the facts (for example: "Slang labels were checked against at least two independent sources; the evidence is in the repository"), or consult the dictionary when it is reachable and state that. Add a `## Slang check` presence and two-URL check to `tools/check-notes.mjs` (with a frozen test via Phase 2), and say in REFRESH.md that the check must be repeated against the dictionary when it becomes reachable.

### CR-06 (Low) Route values index plain objects, so `constructor`, `toString` and `__proto__` are treated as exercise kinds

- **Location:** `assets/app.js:711-713` and `:747-748`.
- **Evidence:** `theme.exercises?.[kind]` and `builders[kind]` use the raw hash segment. Probe B: `#/harjoitus/<id>/constructor` and `.../toString` render a page titled "undefined" (ready stays `1`, no error), and `.../__proto__` throws `builders[kind] is not a function`, leaving "Loading the exercises…" on screen. Only a hand-typed URL triggers it and nothing is injected (the "does not exist" page for an unknown theme id contains no markup, probe H), but it breaks the "an unknown exercise says so" contract.
- **Fix:** `if (!KINDS.includes(kind) || !theme || !Object.hasOwn(theme.exercises ?? {}, kind))` before use; `route()` try/catch as in CR-01.

### CR-07 (Low) Import follows D-017 in effect but not in the letter, and `at` is not checked as an ISO date

- **Location:** `assets/app.js:23`, `:89-140`.
- **Evidence:** checked against D-017/D-018, rule by rule:
  - size > 1 MB rejected (`:595`): conforms.
  - `JSON.parse`, `version === 1`, `scores` object: conforms (`:124`).
  - key pattern: identical to D-017 (`:23`); probe D shows `__proto__`, `constructor` and malformed keys skipped and `({}).best` undefined afterwards.
  - value checks: `best`/`last` halves 0–10, `attempts` integer 0–100000, `history` array, 200-item read cap, `score` halves, `at` string ≤ 40 characters: conform.
  - merge: `best = max`, `attempts = max`, `last` from the newer last history time or local, history union by `at`, newest 20: conform (`mergeEntry`).
  - `lastExport` and `drafts` ignored: conform (probe: `drafts` stayed `{}`; local `lastExport` kept).
  - never `Object.assign`: conforms.
  - "build a fresh object with `Object.create(null)` semantics": **not done**. Entries are plain objects and the store is a plain `{}`. It is safe only because `KEY_PATTERN` rejects every special key first.
  - `at` "ISO date": only length is checked, so `"zzzz"` is accepted and, because history times are compared as strings (`newestAt`), always wins as the newest entry and can overwrite `last`.
- **Fix:** validate `at` with `/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/` (or `Date.parse` finite); optionally use `Object.create(null)` or a `Map` for the merged scores to make the safety local rather than dependent on the key pattern. Add the tests listed in CR-04.

### CR-08 (Low) Recognition errors force self-assessment and show raw error codes

- **Location:** `assets/app.js:1007-1011`, `:477`.
- **Evidence:** any rejection of `listenOnce` (including the benign `no-speech` and `aborted`) sets `selfMode = true`, reveals the self-rating box and prints "Speech recognition did not work (no-speech)". `tries` is not incremented on errors, so the three-attempt rule does not bound error retries. `not-allowed` is handled in the same way, which is right; the other codes are not distinguished. Also `onresult` reads `e.results[0]` without a guard (`:472`); an empty `results` throws inside the handler and the promise settles only after the 15 s timer.
- **Fix:** map codes: `no-speech`/`aborted` → "I heard nothing – try again" and count the attempt; `not-allowed`/`service-not-allowed`/`network`/`audio-capture` → self-assessment with a plain English reason. Guard `e.results?.[0]`.

### CR-09 (Low) Source links and the synthesis status line are not defended in depth

- **Location:** `assets/app.js:1096` (source `href`), `:431-441`, `:340-363`.
- **Evidence:** `href: s.url` goes straight into `setAttribute`. V2 requires https at validation time and the CSP blocks `javascript:` navigations in current browsers, but the page itself does not check the scheme, so data that bypasses CI (a hand edit on `main`) would render a live link. Separately the voice status is computed once, 2 s after load; if voices arrive later it keeps saying "No Finnish voice found" while `#play` would work (D-007 only requires the load-time wait, so this is a UX nit).
- **Fix:** render the link only when `/^https:\/\//.test(s.url)`; re-run `apply` on `voiceschanged`.

### CR-10 (Low) Drafts share the score key and are written on every keystroke without error handling

- **Location:** `assets/app.js:81-85`, `:1174-1177`.
- **Evidence:** `saveDraft` parses and re-serialises the entire store on each `input` event, ignores a failed write, and has no size limit. A very long draft in the same `localStorage` value as the scores can exhaust the quota; the next `recordScore` then fails and shows `#save-error` for the score even though the draft caused it. A failed draft save is silent although D-006 wants storage failures shown.
- **Fix:** debounce (about 500 ms), cap length (for example 10 000 characters) and show a small "draft not saved" note when `saveStore` returns false.

### CR-11 (Low) Source-group table in the note checker is narrow

- **Location:** `tools/check-notes.mjs:7-13` and the header comment on line 1 ("Planning spike").
- **Evidence:** the group table has five entries. `mtv.fi` (same publisher as `mtvuutiset.fi`) and other Alma Media or Sanoma hosts (for example `uusisuomi.fi`, `tivi.fi`) would count as separate groups, so a note citing `mtv.fi` and `mtvuutiset.fi` would pass N2 with a single publisher. `svenska.yle.fi` is handled by the `endsWith` rule. The module and `tools/validate.mjs` still carry "Planning spike" header comments, which is misleading in shipped code. `new URL(url)` throws on a malformed URL, so a bad note crashes the checker instead of reporting an [N…] problem; the same happens in `validate.mjs:54` for `new URL(s.url)` (the regex before it prevents most cases but not `https://` alone).
- **Fix:** add `mtv.fi`, `uusisuomi.fi`, `tivi.fi`, `mikrobitti.fi`, `taloussanomat.fi`, and wrap `new URL` in `try/catch` that returns a problem. Update the header comments.

### CR-12 (Low) Playwright is two minor versions behind the pin

- **Location:** `package.json` (`"playwright": "1.63.0"`), `package-lock.json`, `ci.yml`, README.
- **Evidence:** `npm view playwright version` prints `1.65.0`; the pin is `1.63.0`. D-011 deliberately pins `1.63.0`, `npm audit` (with and without `--omit=dev`) reports 0 vulnerabilities, and there are no runtime dependencies, so this is a currency note only. The GitHub Actions are pinned by commit SHA and the SHAs match the tags named in the comments (`actions/checkout` v7.0.1 = `3d3c42e…`, `actions/setup-node` v7.1.0 = `949feb2…`, checked with `git ls-remote`).
- **Fix:** none required. At the next planned maintenance bump to 1.65.x, run the suite and update D-011, the lockfile and the README line. Do not bump during S-PUBLISH.

### CR-13 (Low) README and REFRESH.md inconsistencies

- **Location:** `README.md:72-76` ("Adding a theme"), `REFRESH.md` step 4.4.
- **Evidence:** README step 3 says "Run `npm test` and push", which would push straight to a branch without the D-018 flow (`refresh/<id>`, CI, Refresh guard, fast-forward). REFRESH.md matches D-017/D-018 closely: allow-list in CI and guard, `git fetch origin main && git rebase origin/main` before pushing, `refresh/<id>` branch, fast-forward only with `git push origin refresh/<id>:main`, up to three retries, the guard lookup `select(.display_title=="Refresh guard <sha>")` with `completed<TAB>success<TAB><id>` (I compared the command with D-018 and `refresh-guard.yml` `run-name: Refresh guard ${{ github.event.workflow_run.head_sha }}`; they agree), and the live-check selection rule with the dispatch fallback. Two gaps: REFRESH.md does not say that `<sha>` must be the full 40-character hash (`run-name` uses the full `head_sha`, so an abbreviated hash never matches), and it does not say what to do with the `refresh/<id>` branch afterwards. README also says the tests check "the half-point rule, speech synthesis and the self-assessment fallback" (true: T-035, T-036, T-034) and "retry, navigation" (T-031, T-033), so those claims are backed; "best of three attempts" is not (CR-04).
- **Fix:** point the README step at REFRESH.md only; add "use `git rev-parse HEAD` (40 characters)" to REFRESH.md step 4; add a branch clean-up line.

### CR-14 (Low) Accessibility and polish

- **Location:** `index.html:20` (`aria-live="polite"` on the whole `<main>`), `assets/app.js:226-234` (`role="button"` containing a `tooltip` and a tag), `assets/style.css` (no `.term:focus-visible` rule).
- **Evidence:** every route change replaces the whole region, so a screen reader announces the entire page; each gloss is a focusable `role="button"` with nested text, and keyboard focus shows only the browser default outline (`input`/`textarea` have an explicit rule at line 171, `.term` does not). `html lang="en"` with `lang="fi"` on Finnish content is correct.
- **Fix:** put `aria-live` on a small status element instead of `<main>`, move focus to the `h1` after a route change, and add `.term:focus-visible { outline: 2px solid var(--blue); }`.

### CR-15 (Low) Clickjacking and other header-only protections are impossible with the meta CSP

- **Location:** `index.html:6`.
- **Evidence:** the meta CSP matches D-017 exactly. It covers everything the app loads: `index.html`, two modules and the stylesheet (`'self'`), JSON through `fetch` (`connect-src 'self'`), the data-URL favicon (`img-src data:`), no fonts, no `url()` or `@import` in `style.css` (grep), and no inline script or style (probe F: no console or CSP errors on all six page kinds). The inline `style` property is only set through CSSOM (`style.setProperty`, `:535`), which `style-src 'self'` allows. The CI sink grep covers `assets/*.js` for the four listed sinks and the style grep for `setAttribute('style'` and `style:`. What a meta element cannot do: `frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options`, so the site can be framed. The app has no authenticated action, so the impact is low.
- **Fix:** none needed. Optionally record the limitation in README ("GitHub Pages cannot send security headers") and add `object-src 'none'` explicitly (already implied by `default-src 'self'`).

## Checks that passed (no finding)

- **HTML injection:** no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` or `srcdoc` anywhere in `assets/*.js` (grep, comments included). The `h()` helper sets text through `textContent` or text nodes; attributes come from code except `href` (CR-09) and values placed in `title`/`data-*`/`aria-label`, which are attribute-safe. Theme data, content-type text in `#load-error`, hash values (`data-route` is set through `dataset`) and import messages all reach the DOM as text. Probe H: a hash carrying `<img onerror>` produced zero `img` elements.
- **D-017/D-018 rules checked against the code:** `scoreTyped(…, near)`, stem lengths in `scoreKeywords`, `scoreSpoken` thresholds 0.9/0.6; V13–V17 present; chips 3–6; `navigator.storage.persist()` called once with a 2 s race and `console.warn`; backup reminder with `lastExport` older than 7 days; `#play` never disabled and re-selects the voice on every tap with `lang = 'fi-FI'` even without a voice; marker stripped before speaking; three recordings per speaking item, fourth tap ignored, button disabled; recognition detected by truthiness of `SpeechRecognition || webkitSpeechRecognition`; `maxAlternatives = 3`; handlers assigned as properties; no `setAttribute('style')` or `style:` in `assets/*.js`; `#check` is idempotent (probe G: three rapid clicks recorded one attempt).
- **Tests:** 82 pass; frozen hashes match; no frozen file changed.
- **Workflows:** CI triggers include `refresh/**`; the allow-list step (add-only for `data/themes/*.json` and `content-notes/*.md`, modify-only for `data/manifest.json`, old list kept as tail) is in `ci.yml` and repeated in `refresh-guard.yml`, which runs from the default branch via `workflow_run` and checks the exact `head_sha`. Edits to `.github/workflows/` or `tests/` on a refresh branch fail the allow-list, so a refresh cannot weaken CI. No `|| true`, `continue-on-error` or `set +e`. The live check parses each JSON file and fails on non-200.
- **British English:** README, REFRESH.md, UI strings and tool messages use British spelling ("organisation", "Licence" heading; "License" appears only in the proper name Apache License). A grep for common American spellings found none.
- **Secrets:** none found in tracked files outside `research/`, `knowledge/` and `lessons/`.

## Open items for the implementer

Fix CR-01 to CR-05 before S-PUBLISH (new tests via the D-018 Phase 2 route, amendment recorded as a new D-0xx). CR-06 to CR-15 may be fixed in the same pass or logged as accepted in `DEVIATIONS.md`.

## Disposition (R-D10 fixes, recorded 2026-11-07)

Commits: **A** `eeb30fa` (code and unit/browser tests), **B** `c3bdaed` (content, notes, register, content tests, D-019), **C** `9b5818e` (T-089, About negation note, README). New tests T-062…T-067, T-081 (`tests/review-v4.test.mjs`), T-068…T-080 (`tests/e2e-review-v4.test.mjs`), T-089 (`tests/e2e-review-v4b.test.mjs`), T-082…T-088 (`tests/content-review-v4.test.mjs`); amendment D-019; red outputs in `research/spikes/red-review-v4-*.txt`.

| ID | Severity | Disposition |
|---|---|---|
| CR-01 | Medium | **Fixed** (A): stored scores are sanitised on load, `fmtScore` is total, `route()` has an error boundary; T-069, T-089. |
| CR-02 | Medium | **Fixed** (A): `speak`/`cancel` wrapped, `utterance.onerror` and the no-synthesis case show `.speech-problem` next to the pressed control; T-072. |
| CR-03 | Medium | **Fixed** (A, B): `splitSentences` treats `\d+.` as an ordinal only before a lower-case word (T-064); the Kruunusillat script reads the line numbers out (T-086). |
| CR-04 | Medium | **Fixed** (A): tests for the 1 MB / key / ISO-time / range / history limits (T-075), the three-attempt cap, fourth tap and retry (T-074), recognition `no-speech` and `not-allowed` (T-074), the backup reminder (T-076), voices arriving late and the no-synthesis line (T-077), the splitter (T-064, T-086), damaged storage (T-069), a throwing `speak` (T-072), the exact CSP and no inline code or sinks (T-065), no CSP violation on any page type (T-078). T-065, T-076 and T-078 pass on the old code (guards for behaviour that was already right). |
| CR-05 | Medium | **Fixed** (A): the About text says the labels come from two independent web sources and that Kielitoimiston sanakirja could not be consulted (T-079); README and REFRESH.md say the dictionary check is still to be done. **Not done, accepted:** the suggested mechanical `## Slang check` check in `tools/check-notes.mjs`; all six notes have the section, and a new N-rule would need its own amendment for a hobby site. |
| CR-06 | Low | **Fixed** (A): kinds are checked against `KINDS` and own properties; T-073. |
| CR-07 | Low | **Fixed** (A): `at` must be an ISO time, keys must belong to the manifest's exercises, `best = max(best, last)`; T-075. **Accepted:** `Object.create(null)` for the merged store; the key allow-list is now limited to the manifest's exercises, which makes it unnecessary. |
| CR-08 | Low | **Fixed** (A): `no-speech`/`aborted` count as an attempt without opening self-assessment, other codes open it with a plain reason, empty `results` are guarded; T-074. |
| CR-09 | Low | **Fixed** (A): only `https:` source links are rendered (the T-044 selector is unchanged); the voice line follows `voiceschanged` (T-077). |
| CR-10 | Low | **Fixed in part** (A): drafts are capped at 10 000 characters and a failed save shows `#draft-error` (T-080). **Accepted:** no debounce; a write of at most 10 kB per keystroke is cheap and the frozen draft behaviour saves on every input. |
| CR-11 | Low | **Fixed** (A): more hosts in the Sanoma, Alma and MTV groups, a malformed URL is its own group (note checker) or rule V2 (validator) instead of an exception, stale "Planning spike" headers removed; T-066, T-067. |
| CR-12 | Low | **Accepted:** the review itself says no change is needed. D-011 pins Playwright 1.63.0, `npm audit` reports 0 vulnerabilities, there are no runtime dependencies, and a bump during S-PUBLISH would change the tested toolchain. Revisit at the next planned maintenance. |
| CR-13 | Low | **Fixed** (A): README "Adding a theme" points to REFRESH.md section 4 and forbids pushing straight to `main`; REFRESH.md says `<sha>` is the full 40-character hash and deletes the `refresh/<id>` branch after the fast-forward. |
| CR-14 | Low | **Fixed** (A): `aria-live` moved from `<main>` to a visually hidden `#route-status`, focus moves to the `h1` after a route change, `.term:focus-visible` outline; T-079. |
| CR-15 | Low | **Accepted:** GitHub Pages cannot send security headers, the meta CSP matches D-017 and the app has no authenticated action. The limitation is now written in the README (C). `object-src 'none'` is already implied by `default-src 'self'`. |

Found while fixing: `.selfscore { display: flex }` overrode the `hidden` attribute, so the self-assessment box was always visible next to the microphone button; fixed with a global `[hidden]` rule (A), see lesson `L-20261107T115000Z-css-display-overrides-hidden-attribute`.

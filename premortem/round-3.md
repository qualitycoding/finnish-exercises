# Pre-mortem round 3 (fresh context, commit 213c303)

Scope: is R-032…R-035 closed by D-018 as written, and did D-018 introduce new Critical/High risks?
Method: read D-017/D-018, PLAN S-002 `ci.yml`, S-004, S-006, S-PUBLISH, S-SCHEDULE prompt, the spike (`validate.mjs`, `check-notes.mjs`, `scoring.js`) and frozen tests. Ran the unit and validator tests against the spike copied to `/tmp/y` (`scoring.js` → `assets/`, `validate.mjs` with its import changed to `../assets/scoring.js` and `check-notes.mjs` → `tools/`, `tests/*.test.mjs` without `e2e*`): **37/37 pass**. No browser-suite run, no web search.

## Verdicts on round-2 risks

| Risk | Verdict | Evidence |
|---|---|---|
| R-032 numerals | **Closed.** | `NUMERAL` in `contentRules` catches *Kahden*, *prosentilla*, *Kuuden*, *Ensimmäinen*; *sataa* passes (T-060 green on the spike). It also over-matches some ordinary words; see R-042 (Medium). |
| R-033 refresh scope | **Partly closed.** | The allow-list (`awk` over `git diff --name-status`, run under `set -euo pipefail` after `git fetch origin main`) blocks changes to `tools/`, `assets/` and `tests/`, as well as renames and deletions. Paths it cannot parse (spaces, quoted names) count as violations, so it fails safe. The manifest-tail check with `n[len(n)-len(o):]==o` is right, including when the new list is shorter. The gap: the guard lives in `ci.yml` itself, so a refresh that edits `ci.yml` can remove it. See **R-041 (High)**. |
| R-034 content notes | **Closed** (residual Medium as in R-002). | `check-notes.mjs` needs ≥2 publisher groups for each fact row and an https URL for each real-person row, and it runs in CI after the validator. The weekly prompt now includes the named-person re-read. It cannot tell whether `None.` under *Real people* is true; the S-ADVERSARIAL review and the re-read have to cover that. |
| R-035 CSP/styles | **Closed.** | The frozen e2e files assert no style attributes. A CSP refusal of a stray inline style shows up as a console error, which fails e2e (fail-safe). The CI grep's escaping is correct inside bash double quotes. `el.style.setProperty` is allowed by `style-src 'self'`. This does not conflict with D-006a (item 15 only needs no console errors). |

## New findings

### R-041 (High): the refresh guard can be removed by the branch it guards
Push-triggered workflows run the `ci.yml` at the pushed commit. A refresh commit that deletes the `Refresh adds only a theme…` step or gives it `if: false` makes CI report success without the check running. The same goes for the `sha256sum -c` step. The 'No failure-swallowing' grep catches neither. R-033 named `ci.yml` as an attack surface. The likeliest way this happens is an agent "fixing CI" after failed attempts.
**Fix.** Add `.github/workflows/refresh-guard.yml`:
```yaml
name: Refresh guard
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: ['refresh/**']
permissions:
  contents: read
jobs:
  guard:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@<same pin as CI>
        with: { ref: '${{ github.event.workflow_run.head_sha }}', fetch-depth: 0 }
      - shell: bash
        run: |
          set -euo pipefail
          # same allow-list awk + manifest-tail python as the CI step
```
`workflow_run` always runs the copy on the default branch, so it depends on the D-018 change of the default branch to `main`. REFRESH.md, the S-SCHEDULE prompt and D-018 should require `Refresh guard` = `success` for the commit before `git push origin refresh/<id>:main`. S-SCHEDULE step 1 already checks `default_branch` = `main`.

### R-042 (Medium): `NUMERAL` rejects ordinary words
It rejects *yhteiskunta, yhteistyö, yhteinen, yhteys, yhdessä, toiset, toisessa, viite, nolo, satanut, kaksikielinen*. The V15 message names the word, so the author can rephrase. Nothing is blocked; the sentences become less natural. Fix: list these words in the S-006/REFRESH.md guidance, or narrow the stems in a Phase 2 amendment (T-060 stays satisfiable).

### R-043 (Medium): default-branch fallback depends on a conditional gate
Changing the default branch needs admin permission, which the app token probably lacks. The fallback is "owner at G-PAGES", but G-PAGES only happens when `has_pages` is `false`. Fix: if the change is refused, halt at G-PAGES (or the next gate) whatever the value of `has_pages`.

### R-044 (Low): drift
S-PUBLISH step 6 still cites the D-017 live rule. `check-notes` counts a `|:---|` alignment row as a fact row (a false N2 failure). It also does not check the `Area:` line or the `## Word order` section that S-006 step 2 requires.

### Checked and found no new risk
- The Phase 2 route (append-only manifest lines; frozen files never edited) is consistent with R-D2/R-D10.
- Running CI on every push before S-005 is explicitly not awaited.
- `live-check.yml` uses `deployment_status`/`workflow_dispatch`, so it does not depend on the default branch apart from dispatch, which comes after step 2a.
- The ä/ö rule on V13 `near` lists agrees with T-035.

## Tally
0 Critical, 1 High (R-041), 2 Medium (R-042, R-043), 1 Low (R-044).

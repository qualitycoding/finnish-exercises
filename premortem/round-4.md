# Pre-mortem round 4 (fresh context, working tree)

Scope: does the round-3 fix (D-018 'Refresh guard', PLAN S-002 step 2b `refresh-guard.yml`, REFRESH.md and the S-REFRESH prompt) close R-041? Are R-043 and R-044 closed? Are there any Critical or High risks left in the plan?
Method: read PLAN S-002 (`ci.yml`, `live-check.yml`, `refresh-guard.yml`), S-007, S-PUBLISH, S-REFRESH, the polling rule, D-018, GATES G-PAGES and the `check-notes.mjs` spike. No tests run, no web search, no browser.

## Verdicts

| Risk | Verdict | Evidence |
|---|---|---|
| R-041 guard removable by the branch it guards | **The design closes the bypass, but the plan gives no reliable way to find the guard's run (see R-045, High).** | `workflow_run` runs the workflow file from the default branch, and S-PUBLISH step 2a and S-REFRESH step 1 make that `main`. A refresh commit that edits `refresh-guard.yml` on its own branch therefore cannot change what runs. Any change under `.github/` (editing `ci.yml`, renaming it, adding a fake workflow named `CI`) shows up in `git diff --name-status origin/main HEAD` as something other than `A data/themes/*.json`, `A content-notes/*.md` or `M data/manifest.json`, so the guard fails. `branches: ["refresh/**"]` filters on the triggering run's head branch, which is right. The checkout of `head_sha` comes from the same repository, the job has `contents: read`, and it runs no repository code: only `git`, `awk` and inline Python that parses JSON. If CI is renamed, never completes or is cancelled, the guard either does not run or fails at `test "$CONCLUSION" = "success"`. The prompt requires the guard to succeed before `git push origin refresh/<id>:main`, so the refresh times out without publishing, which is the safe outcome. One residual risk remains: the rule is followed by the agent, not enforced by branch protection. That is unchanged from earlier rounds and accepted under A-011. |
| R-043 default-branch fallback | **Closed.** | S-PUBLISH step 2a: "If refused, halt at G-PAGES (whatever `has_pages` says)". The G-PAGES trigger lists step 2a, and the gate question includes *Settings → General → Default branch*. Small drift remains: at step 2a, CI has not yet been waited for, so the G-PAGES evidence bundle ("CI run id and conclusion") may only show a pending run (R-046). |
| R-044 drift | **Mostly closed.** | S-PUBLISH step 6 now cites the D-018 selection rule. The spike's `rows()` drops `/^\|\s*:?-/`, so a `|:---|` row is no longer counted as a fact (D-018 'Table separators'). Still open: nothing checks `Area:` or `## Word order`. No review step names them, and `check-notes.mjs` does not test them (R-046, Low). |

## New risks

### R-045 (High): the 'Refresh guard' run cannot be found by commit sha

For `workflow_run` events, `GITHUB_SHA` and `GITHUB_REF` are the default branch's latest commit and ref. As far as I know, the run is also filed under that commit, which is why `workflow_run` results do not show up as checks on PR commits. I could not confirm this here because web search was not allowed. If it holds, the plan's only lookup method (the polling rule, `actions/runs?head_sha=<sha>`, which also only knows the names `CI`, `pages build and deployment` and `Live site check`) never finds `Refresh guard` for the refresh commit. Neither REFRESH.md nor the prompt gives any other method. Two outcomes follow:
- Every weekly refresh waits 20 minutes and stops. The feature fails, and the scheduled agent has no workaround.
- Worse, the agent improvises and accepts a `Refresh guard` run listed under `main`'s sha or the latest one, which may belong to an earlier refresh. A check then reports success without having run on this commit (Critical-class if it happens).

The guard has never been exercised before the first scheduled run, so the first anyone learns of this is a failed or bypassed weekly run.

**Fix (plan text only, no frozen-test impact):**
1. In S-002 step 2b, add a run name keyed to the triggering commit, after `name: Refresh guard`:
   `run-name: Refresh guard ${{ github.event.workflow_run.head_sha }}`
2. In D-018 'Refresh guard', the polling rule and REFRESH.md, define the only valid lookup:
   `gh api 'repos/qualitycoding/finnish-exercises/actions/workflows/refresh-guard.yml/runs?event=workflow_run&per_page=50' --jq '.workflow_runs[]|select(.display_title=="Refresh guard <sha>")|[.status,.conclusion,.id]|@tsv'`
   It must print a `completed	success` row for the exact refresh sha. Any other run, including one listed under another sha, does not count. Poll for up to 20 minutes, then stop without pushing.
3. Optional: in S-REFRESH step 1, exercise the guard once before scheduling. Push a throwaway `refresh/guard-selftest` branch from `main` that touches `README.md`, confirm that `Refresh guard <sha>` concludes `failure` (and that the lookup finds it), then delete the branch. This proves the trigger and the lookup end to end.

### R-046 (Low): residual drift
- S-002 'Done when' still says "both files parse", although there are three.
- S-REFRESH step 1 does not confirm that `.github/workflows/refresh-guard.yml` is on `main`.
- The G-PAGES evidence bundle at step 2a may have no completed CI run.
- Nothing checks `Area:` or `## Word order` (left over from R-044).

Fix: "all three files parse"; add `refresh-guard.yml` to S-REFRESH step 1; at step 2a, record the CI run id and its status even if it is pending; have S-ADVERSARIAL or the reviewer check that each note's first line is `Area: <1–6>` and that it has `## Word order`.

## Other areas checked, no new Critical/High

- Interaction between `ci.yml` and the guard: the in-CI allow-list step stays as a first line of defence, and the guard is the authoritative check.
- The 'No failure-swallowing' grep also scans `refresh-guard.yml`, which contains none of the patterns.
- `workflow_run` chain depth is 1, well under GitHub's limit of 3.
- Pushes made with the app token do trigger CI, because they are not made with `GITHUB_TOKEN`.
- Diff base: the guard fetches the full `main` and checks out with `fetch-depth: 0`, so `origin/main` resolves.
- The manifest-tail assertion is unchanged and correct.

## Summary

R-041: bypass closed by design; the verification is not yet usable because of R-045. R-043 closed. R-044 mostly closed (Area/Word order check open, Low).
**0 Critical, 1 High (R-045), 0 Medium, 1 Low (R-046).**

# Pre-mortem round 5 (final round, fresh context)

Scope: check that the round-4 fixes close R-045 and R-046, and that they add no new Critical or High risk. Read: `premortem/round-4.md`; `plan/PLAN.md` (Polling rule, S-002 step 2b with `ci.yml` triggers, S-PUBLISH step 2a, S-REFRESH steps 1–3, D-018 note format in S-CONTENT); and `plan/DECISIONS.md` D-018 'Refresh guard'. No web search and no test runs. The GitHub Actions statements below come from my own knowledge.

## Round-4 risks

| Risk | Status | Evidence |
|---|---|---|
| R-045 guard run not findable by commit | **Closed.** | S-002 step 2b sets `run-name: Refresh guard ${{ github.event.workflow_run.head_sha }}`. `run-name` may use the `github` and `inputs` contexts, so `github.event.workflow_run.head_sha` is valid for a `workflow_run` event. When `run-name` is set, the REST field `display_title` holds the evaluated value. D-018 gives one lookup: the workflow-scoped `refresh-guard.yml/runs?event=workflow_run&per_page=50` endpoint, which lists newest first. It selects `display_title == "Refresh guard <sha>"`, requires `completed\tsuccess\t<id>`, polls for 20 minutes, and otherwise stops without pushing. It also says "No other run counts". The full 40-character sha makes the title unique per commit, so an earlier refresh's run cannot match. REFRESH.md (S-007 step 2) and the scheduled prompt (S-REFRESH step 3) both point to this lookup. S-REFRESH step 1a tests the lookup before the schedule exists. |
| R-046 drift | **Closed.** | S-002 'Done when' now reads "all three workflow files parse". S-REFRESH step 1 lists `refresh-guard.yml`. S-PUBLISH step 2a names the CI run id "even if it is still running". D-018 gives the checks for `Area:` and `## Word order` to S-ADVERSARIAL and the refresh checklist. They are not automated, which D-018 accepts in writing. |

## New findings (none Critical or High)

### R-047 (Medium): the self-test says "wait for CI" when CI is meant to fail, and it only tests the guard's first step
`ci.yml` runs on `refresh/**` and has its own allow-list step, gated on `startsWith(github.ref, 'refs/heads/refresh/')`. So the self-test commit, which changes `README.md`, makes **CI** fail. The guard still runs (`types: [completed]`), but it fails at "CI succeeded for this commit". Its own allow-list step never runs. Two things follow:
- The Polling rule says "wait for <run>", and step 1a does not say that CI is expected to fail. An implementer may treat CI's failure as a step failure and go to On failure, when they should carry on to the guard lookup. That is mild guesswork, but the wording "README.md is outside the allow-list" shows a failure is expected.
- A `failure` result proves the lookup works, which is R-045's purpose. It does not prove that the guard's allow-list or manifest checks work. If they were broken (for example an always-failing step), the first real refresh would fail safe: it would time out without pushing. So this is not Critical.

Fix (plan text only): in step 1a, write "wait for `CI` on that sha to **complete** (it is expected to conclude `failure` at its allow-list step); then find the guard run … and confirm it concluded `failure`". Also add one line to the Polling rule saying the `Refresh guard` run is found only by the D-018 lookup. The rule lists only three run names.

### R-048 (Low): the self-test branch is left behind on timeout
In step 1a, `git push origin --delete refresh/guard-selftest` runs only after a successful lookup. If the lookup times out, the branch stays on the remote. It cannot reach `main`, because only a guard `success` permits a fast-forward and this commit fails CI. It is clutter, though, and it would re-trigger CI if pushed again. The local checkout also stays on the self-test branch.
Fix: "delete the remote branch and `git checkout main` in every outcome, including timeout". The plan also assumes a git commit identity is set. Add `git config user.name/user.email` if it is missing.

### Checked, no issue
- With the `workflow_run` trigger, `run-name` is evaluated from the triggering event's payload, not from the `main` checkout. `head_sha` is the refresh commit's sha, which is the same sha the guard checks out.
- The guard still runs from `main` (the default branch), so a refresh branch cannot change its `run-name`. If someone added a workflow with the same name, it would not appear under `workflows/refresh-guard.yml/runs`, so it cannot be mistaken for the guard.
- `per_page=50` is enough: at one refresh a week, plus the self-test, the target run is always on the first page within the 20-minute window.
- The self-test does not touch `main`, the manifest or Pages. The refresh ids are dated, so they cannot clash with `guard-selftest`.

## Verdict
R-045 closed, R-046 closed.
**0 Critical, 0 High** (1 Medium R-047, 1 Low R-048; both are plan-text fixes with no effect on frozen tests).

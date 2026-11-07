# Operations (software.deploys)

- **Runbook.** The site is static files on `main`. To publish a change: commit to `main`, push, then confirm three runs for the commit with `gh api 'repos/qualitycoding/finnish-exercises/actions/runs?head_sha=<sha>' --jq '.workflow_runs[]|[.name,.conclusion]|@tsv'`: `CI` and `pages build and deployment` `success`, and the Live site check accepted by the D-018 selection rule (job `live` = `success`).
- **Monitoring.** `Live site check` runs on every successful deployment and on demand (`workflow_dispatch`); the weekly refresh task reports its three run results. The owner gets a push notification from the scheduled task.
- **Rollback command.** `git revert --no-edit <bad-sha> && git push origin main` (never force-push `main`: learners' saved scores are keyed by theme ids and must keep matching published themes). A theme can be hidden without breaking scores by removing it from `data/manifest.json` only.
- **Escalation.** The owner (repository admin). Pages settings can only be changed by the owner (proxy refuses the Pages API).
- **Post-release verification.** The three runs above; for content, the learner trial (G-LEARN).

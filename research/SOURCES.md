# Sources (working list)

The compiled register with licences is `knowledge/K-20261107T003000Z-source-register-finnish-exercises.md`. Documentation locators for literal commands (1.3.6):
- `node --test <glob>` — verified by spike (research/spikes/satisfiability; round-2 log), Node v22.23.4.
- `npx playwright install --with-deps chromium` — command used unchanged by the reference CI (qualitycoding/swedish-exercises `.github/workflows/ci.yml` at b8c4f57, which ran green with Playwright 1.63.0); `npx playwright install chromium` spike-run here (exit 0).
- `npm install --package-lock-only` — npm 10 docs, `npm install` `--package-lock-only` flag; spike: run in S-001 (lockfile created in /tmp/lock).
- `gh api repos/<o>/<r>/actions/runs` and `/rerun` — GitHub REST "Workflow runs" endpoints; actions/runs probed in 0.1 (HTTP 200).
- `git ls-remote`, `git merge --no-ff`, `git bundle create` — git 2.x manual pages.
- `sha256sum -c` — GNU coreutils manual.

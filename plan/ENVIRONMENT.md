# Environment (pinned, verified 2026-11-07)

| Item | Pin | Existence check (1.3.6) |
|---|---|---|
| Node.js | 22.x (sandbox `v22.23.4`; CI `actions/setup-node` `node-version: "22"`) | `node --version` in sandbox. |
| npm package `playwright` | `1.63.0` (devDependency, exact) | `npm view playwright@1.63.0 version` → `1.63.0`. |
| Chromium for Playwright | revision bundled with 1.63.0 (sandbox: `/opt/pw-browsers/chromium-1243`, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, Chrome 153.0.8010.12) | Spike `research/spikes/playwright-launch.mjs`, output committed. CI: `npx playwright install --with-deps chromium`. |
| `actions/checkout` | `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1) | `git ls-remote https://github.com/actions/checkout refs/tags/v7.0.1` → that SHA. |
| `actions/setup-node` | `949feb2413d6458794dcd2491c4babbbce0c15c1` (v7.1.0) | `git ls-remote https://github.com/actions/setup-node refs/tags/v7.1.0` → that SHA. |
| Runner label | `ubuntu-24.04` | Listed in protocol 3.9 (verified 2026-11); also used by `qualitycoding/swedish-exercises` CI. |
| Python (for checks only) | 3.13 sandbox / runner default `python3` | Used only for JSON parsing in `live-check.yml`. |

## Setup commands (verified in the sandbox on 2026-11-07)

```sh
cd /home/claude/finnish-exercises       # the clone
npm ci --no-audit --no-fund             # after S-001 creates package.json + package-lock.json
node --test tests/*.test.mjs            # unit, validator and browser tests
node tools/validate.mjs                 # data validator
sha256sum -c tests/FROZEN_MANIFEST.sha256
```

In the sandbox, browsers come from `/opt/pw-browsers` (preinstalled); do **not** run `npx playwright install` there. In CI, run `npx playwright install --with-deps chromium`.

## Lockfile rule

Generate `package-lock.json` in a clean directory (`/tmp/lock`) and copy it in, so it never records a local `link` (skill §8.4).

## Tool config

No config files: `node --test` takes the glob on the command line; Playwright is driven from the test file (no `playwright.config`).

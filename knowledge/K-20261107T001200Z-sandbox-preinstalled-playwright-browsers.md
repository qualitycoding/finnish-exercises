---
id: K-20261107T001200Z-sandbox-preinstalled-playwright-browsers
statement: In the Claude cloud sandbox (2026-11), Playwright 1.63.0 browsers are preinstalled under /opt/pw-browsers (PLAYWRIGHT_BROWSERS_PATH set; chromium-1243, Chrome 153.0.8010.12), so Chromium tests run locally without downloading.
status: current
supersedes: [K-20261009T160117Z-playwright-sandbox-browsers]
tags: [subject:sandbox-environment, tech:playwright, phase:verification]
applies_to_version: playwright 1.63.0
source: { url: "research/spikes/playwright-launch.output.txt", doi: "", title: "Planning spike", locator: "output", accessed: "2026-11-07", tier: 1 }
confidence: verified
derived_from: [C-012]
discovered_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T00:12:00Z
---
Supersedes the earlier finding that browser binaries cannot be downloaded: the download is still not needed because they are preinstalled.

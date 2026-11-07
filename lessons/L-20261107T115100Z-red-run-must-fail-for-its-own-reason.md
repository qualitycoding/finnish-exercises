---
id: L-20261107T115100Z-red-run-must-fail-for-its-own-reason
title: First red runs of the review tests failed or passed for the wrong reason
status: active
supersedes: []
recurrence_of: none
occurrences: 1
severity: Low
tags: [domain:language-learning, tech:nodejs, tech:playwright, phase:verification, kind:process]
recorded_by: implementer
run: impl-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T11:51:00Z
---
## Trigger
Red-verifying tests/review-v4.test.mjs, tests/e2e-review-v4.test.mjs and tests/content-review-v4.test.mjs against commit 7c01b28 in a worktree.
## What went wrong
(1) The unit file imported the new export `splitSentences` by name, so on the old code the whole file died with a SyntaxError instead of each test failing for its own reason. (2) T-068 waited for `#score` with `waitForSelector`, so on the old code it ended in a 30 s timeout instead of the assertion that names the double-tap fault. (3) T-084 passed on the old code because an answer with every ä/ö dropped happened to hit two of four groups exactly, which also earns ½ there.
## Correction
Imported the module as a namespace, replaced the wait by a short sleep followed by assertions, and added a case in which the old code scores 0 and the new code ½ (Kruunusillat kirjoitus 10). Re-ran the red verification and saved the new output.
## Prevention rule
After a red run, read the failure message of every test: it must be the assertion that states the missing behaviour, and a test that passes on the old code must either be a documented guard or be strengthened until it fails there.
## Detection check
Open research/spikes/red-*.txt and compare each `not ok` with its error line; list the tests that pass in the red run and justify each in the amendment record.
## Evidence
research/spikes/red-review-v4-unit.txt, red-review-v4-e2e.txt, red-review-v4-content.txt.

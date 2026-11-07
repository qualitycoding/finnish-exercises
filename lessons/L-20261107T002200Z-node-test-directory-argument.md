---
id: L-20261107T002200Z-node-test-directory-argument
title: node --test given a directory did not run the test files
status: active
supersedes: []
recurrence_of: null
occurrences: 1
severity: Low
tags: [tech:javascript, phase:verification, kind:tooling]
recorded_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T00:22:00Z
---
## Trigger
Running Node's built-in test runner on a folder of .test.mjs files on Node 22.
## What went wrong
'node --test tests/' reported a single failing entry and ran nothing.
## Correction
Used 'node --test tests/*.test.mjs'.
## Prevention rule
Pass node --test an explicit glob of test files, never a bare directory.
## Detection check
The CI and package.json test commands contain 'tests/*.test.mjs'.
## Evidence
research/rounds/round-2.md; K-20261107T001300Z-node-test-directory-argument

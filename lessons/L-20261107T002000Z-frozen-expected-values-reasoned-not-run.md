---
id: L-20261107T002000Z-frozen-expected-values-reasoned-not-run
title: Frozen test expectations were written by reasoning and two were wrong until a spike ran them
status: active
supersedes: []
recurrence_of: L-20261008T151500Z-reasoned-expected-value-wrong
occurrences: 2
severity: High
tags: [domain:language-learning, tech:javascript, phase:specification, kind:verification-gap]
recorded_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T00:20:00Z
---
## Trigger
Writing frozen unit tests with exact expected values (similarity scores, folded strings) before any implementation exists.
## What went wrong
T-007 expected a full point for a six-word answer against a five-word target (actual similarity 0.83 → half point), and T-002 folded å to o instead of a. Both were caught only on review and by running a reference implementation.
## Correction
Fixed the two assertions, then ran every frozen unit and validator test against a throwaway implementation (research/spikes/satisfiability) before freezing: 24/24 passed.
## Prevention rule
Before freezing a test with exact expected values, run it against a working reference or spike implementation and commit that run's output.
## Detection check
The plan's research/spikes contains a satisfiability run whose output shows every frozen unit test passing.
## Evidence
research/spikes/satisfiability; tests/scoring.test.mjs T-002, T-007.

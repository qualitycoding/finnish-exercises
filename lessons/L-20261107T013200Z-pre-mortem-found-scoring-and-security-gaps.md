---
id: L-20261107T013200Z-pre-mortem-found-scoring-and-security-gaps
title: The first plan draft let a gap's tested grammar error earn half a point and left import and HTML-injection paths unguarded
status: active
supersedes: []
recurrence_of: null
occurrences: 1
severity: High
tags: [domain:language-learning, tech:javascript, phase:specification, kind:verification-gap]
recorded_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T01:32:00Z
---
## Trigger
Porting a scoring scheme and an app from one language's exercise site to another (here Swedish → Finnish).
## What went wrong
The one-typo half-point rule rewarded wrong case endings one letter away from the answer (hallitukset for hallituksen); keyword prefix matching missed compounds; the reference import replaced the whole store; theme text could reach innerHTML; a refresh branch could change its own CI checks. All were found only by the pre-mortem rounds.
## Correction
D-017/D-018: near-miss lists, inner-stem matching, spoken character similarity, merging import, CSP and sink bans, refresh guard from main.
## Prevention rule
When porting a scoring scheme to a new language, probe it with typical learner errors in that language (wrong ending, gradation, compounds, split words) before freezing tests, and review every data-to-DOM and import path for injection and overwrite.
## Detection check
A spike file of learner-error probes exists in research/spikes and its rows appear as frozen tests.
## Evidence
premortem/round-1.md, round-2.md, round-3.md; tests/*-v2.test.mjs, tests/validate-v3.test.mjs.

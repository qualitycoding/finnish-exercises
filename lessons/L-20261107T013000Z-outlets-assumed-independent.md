---
id: L-20261107T013000Z-outlets-assumed-independent
title: Finnish news outlets were treated as independent sources although several share an owner
status: active
supersedes: []
recurrence_of: L-20261009T123005Z-corroborated-label-without-independent-sources
occurrences: 1
severity: Medium
tags: [domain:language-learning, domain:finnish-current-affairs, phase:planning, kind:wrong-assumption]
recorded_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T01:30:00Z
---
## Trigger
Requiring 'two independent sources' for news facts and listing outlets such as HS, IS, Iltalehti and Kauppalehti.
## What went wrong
The plan counted outlets (and the validator counted hosts), but HS and IS are both Sanoma, and Iltalehti and Kauppalehti are both Alma Media; the pre-mortem's assumption audit falsified A-008.
## Correction
Defined publisher groups (D-017) and a checker that requires two groups per fact (tools/check-notes.mjs, T-061).
## Prevention rule
When a plan requires independent sources, list the owner group of every allowed outlet and check independence by group, not by host.
## Detection check
The checker maps hs.fi and is.fi to the same group (T-061).
## Evidence
premortem/ASSUMPTION_AUDIT.md (A-008); plan/DECISIONS.md D-017, D-018.

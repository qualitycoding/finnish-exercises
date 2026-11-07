---
id: L-20261107T120000Z-theme-text-length-and-unopened-sources
title: New themes were drafted too short for the validator and listed a source that had not been opened
status: active
supersedes: []
recurrence_of: none
occurrences: 1
severity: Low
tags: [domain:language-learning, domain:finnish-current-affairs, phase:implementation, kind:process-gap]
recorded_by: implementer
run: impl-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T12:00:00Z
---
## Trigger
Writing the six S-006 themes with a generator script and running tools/validate.mjs after each one.
## What went wrong
Every new theme failed V5 (reading under 200 words) or V6 (listening under 120 words) on the first run, and one theme also had the wrong item-type mix (V3). The first draft of theme 4 also listed a second foundation page in its sources that had never been opened.
## Correction
Added attributed sentences and dialogue lines until the validator passed, removed one true/false item, and deleted the unopened page from the theme sources.
## Prevention rule
Count the words of the reading and listening scripts against the V5 and V6 limits, and the item mix against the frozen mix, before writing the items; list in a theme only URLs that were opened.
## Detection check
node tools/validate.mjs after each theme; compare each theme's sources with the rows added to the source register.
## Evidence
Validator output for finlandia-ehdokkaat-20261107 and ennallistamissuunnitelma-20261107 (S-006).

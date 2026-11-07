---
id: L-20261107T013100Z-localstorage-assumed-durable-on-ios
title: Saved scores were assumed to persist in localStorage, but Safari deletes script-written storage after 7 days without a visit
status: active
supersedes: []
recurrence_of: null
occurrences: 1
severity: Medium
tags: [domain:language-learning, tech:javascript, phase:planning, kind:wrong-assumption]
recorded_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T01:31:00Z
---
## Trigger
A static site promises to 'save scores between visits' with localStorage and the learner uses an iPhone.
## What went wrong
A-012 assumed localStorage is durable; the assumption audit found Safari's 7-day cap on script-writable storage for sites not added to the Home Screen.
## Correction
D-017: navigator.storage.persist(), a Home Screen note, a back-up reminder and a merging import (T-048, T-059).
## Prevention rule
When a web app persists user data in browser storage, plan an export/import path and state the iOS 7-day limit to the user.
## Detection check
The About page names the limit and offers export; T-059 passes.
## Evidence
premortem/ASSUMPTION_AUDIT.md (A-012); round-1 sources (mjtsai.com 2020-03-26; itnews.com.au).

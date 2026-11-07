---
id: L-20261107T120100Z-single-source-facts-in-items
title: Draft items asked facts that only one publisher group had reported
status: active
supersedes: []
recurrence_of: L-20261107T013000Z-outlets-assumed-independent
occurrences: 1
severity: Medium
tags: [domain:finnish-current-affairs, phase:implementation, kind:wrong-assumption]
recorded_by: implementer
run: impl-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T12:01:00Z
---
## Trigger
Writing the Finlandia and restoration-plan themes from a Yle article plus one second page each.
## What went wrong
The drafts asked about announcement weekdays, the aim of the regulation and the order of announcements, which only Yle states; the second page did not confirm them.
## Correction
Replaced those items with questions on facts both groups confirm and kept the Yle-only facts as text sentences that begin with "Ylen mukaan".
## Prevention rule
Before writing an item, check that the fact appears in two publisher groups; otherwise attribute it in the text and do not ask about it.
## Detection check
Each content note lists, per fact, two sources and the items that use it; facts marked "context only" must not appear in the Items column.
## Evidence
content-notes/finlandia-ehdokkaat-20261107.md, content-notes/ennallistamissuunnitelma-20261107.md.

---
id: L-20261107T002100Z-register-counts-written-by-hand
title: Source-register counts were typed by hand and did not match the table
status: active
supersedes: []
recurrence_of: null
occurrences: 1
severity: Low
tags: [applies:all, phase:research, kind:process]
recorded_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T00:21:00Z
---
## Trigger
Writing the statement line of a source register (R7) with outcome and licence counts.
## What went wrong
The first statement said 13 used / 7 corroborating / 4 not relevant / 16 unknown licences; the table had 15 / 6 / 3 / 14.
## Correction
Counted the table rows with a script and rewrote the statement.
## Prevention rule
Compute every count in a register statement from its table with a script and paste the script's output.
## Detection check
A one-line Python count of the table's Outcome and Licence columns equals the numbers in the statement.
## Evidence
knowledge/K-20261107T003000Z-source-register-finnish-exercises.md

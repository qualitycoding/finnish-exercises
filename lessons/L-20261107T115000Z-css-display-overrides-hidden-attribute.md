---
id: L-20261107T115000Z-css-display-overrides-hidden-attribute
title: A CSS display rule overrode the hidden attribute, so the self-assessment box was always visible
status: active
supersedes: []
recurrence_of: none
occurrences: 1
severity: Low
tags: [domain:language-learning, tech:javascript, phase:implementation, kind:verification-gap]
recorded_by: implementer
run: impl-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T11:50:00Z
---
## Trigger
Writing the review-fix browser test T-074, which asserts that staying silent in a speaking item does not open the self-assessment box.
## What went wrong
`app.js` sets the `hidden` attribute on `.selfscore`, but `style.css` gave `.selfscore` `display: flex`, which beats the browser's `[hidden]` rule. The box had been visible on every speaking item since S-005; no frozen test looked at its visibility, and the code review read the JavaScript only.
## Correction
Added `[hidden] { display: none !important; }` to `assets/style.css`; T-074 now asserts the box is hidden until the learner asks for it or a recognition error opens it.
## Prevention rule
When code toggles `hidden`, assert visibility in a browser test (`isHidden()`), and give every class that sets `display` a check that `[hidden]` still wins, or add the global `[hidden]` rule at the start.
## Detection check
A browser test that reads `isHidden()` / `isVisible()` for each element the code hides with `hidden`.
## Evidence
tests/e2e-review-v4.test.mjs T-074; commit with the style fix.

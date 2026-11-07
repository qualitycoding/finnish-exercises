# Risk register

| ID | Description | Lens | Severity | Likelihood | Root cause | Traces to | Mitigation |
|---|---|---|---|---|---|---|---|
| R-001 | A correct Finnish answer is marked wrong (free word order, inflected synonyms) | scoring fairness | Medium | Medium | Finnish morphology and word order admit many correct forms | D-004, D-005 | All grammatical orders listed; stems survive inflection; S-ADVERSARIAL answers like a learner; G-LEARN q2 → test case before fix |
| R-002 | Content contains an invented or wrong statement about a real person or a stale fact | content integrity | High | Low | News texts written by an agent | D-009, S-006 | Content notes with two publishers per fact and a source per named-person sentence; S-006 step 6; S-ADVERSARIAL spot check; G-LEARN q5 |
| R-003 | No Finnish voice on the learner's browser (desktop Chrome) → listening unusable | speech coverage | Medium | Medium | C-001 (single publisher) | D-007 | `#voice-status` message with alternatives; transcript after listening; G-LEARN q3 |
| R-004 | Recognition does not support fi-FI on some browser → speaking scores 0 | speech coverage | Medium | Low | C-004 (tier-4 sources only) | D-006 | Self-assessment switch always available (T-034); G-LEARN q3 |
| R-005 | Pages not enabled or first build fails → site not live | operational | Medium | Medium | Proxy refuses Pages API (C-010) | S-PUBLISH | G-PAGES human action; R-D8 rerun; Live site check |
| R-006 | Weekly refresh breaks saved scores or publishes unverified content | refresh | High | Low | Agent edits existing themes or tests | D-016, S-REFRESH | Append-only ids, validator + tests must pass, three-run confirmation, never edit tests (REFRESH.md) |
| R-007 | Scores lost when changing device or clearing storage | persistence | Low | Medium | localStorage is per browser | D-008 | Export/import (T-042) |
| R-008 | Exercises take much longer than 10 minutes at B1–B2 | session length | Medium | Medium | Finnish morphology load | V5/V6 bounds | Length bounds; G-LEARN q1 → shorten texts in iterate round |

# Prior knowledge (R0)

Stores read: lessons `qualitycoding/Lessons` @ `8d6c44c`; knowledge `qualitycoding/knowledge` @ `bf95f15` (2026-11-06). Task tags: `domain:language-learning`, `tech:javascript`, `tech:playwright`, `tech:github-pages`, `tech:github-actions`, `tech:web-speech-api`, `domain:technical-writing` (prose), plus `applies:all`.

## Prevention-rule checklist (used by the cold read and the pre-mortem)

1. Every mechanically checkable content rule is a validator rule before the second unit of content (slang labels, lengths, keywords).
2. Check every sentence naming a real person against a cited source before freezing; otherwise remove it or move it into an invented, unnamed frame.
3. Keyword lists: minimum stem rules and model answer hits every group — validated mechanically.
4. Length bounds encoded in the validator before writing content; run it after each unit.
5. Write prose in British English; cite British/Finnish authorities, not US ones.
6. Retrieve facts (versions, defaults, citations) from the primary source in the same turn, or label them UNVERIFIED.
7. Corroborated = two distinct publishers, counted by publisher, not URL.
8. Map every plan control to a file or test before closing implementation.
9. Freeze tests with their executable form; route threshold changes through the reset rule.
10. Every behaviour/number claim in docs cites a test or measurement, or says UNVERIFIED.
11. No credentials in command lines.
12. S-000 reads the stores; record commits read.
13. Public repository: any upload is publication → gate it.
14. Probe api.github.com separately from github.com before concluding a write path is impossible.
15. Write each source into the round log as it is opened.
16. `.gitattributes` pins hashed files to LF.
17. CI: pipefail in every `run:` with pipes; no failure-swallowing; confirm each gate can fail.
18. Resolve every pin against the upstream tag list.
19. Parse workflows with a YAML loader before freezing.
20. Push and run the CI browser job after the first UI step, not the last.
21. SPA tests wait for an app-set route marker.
22. Never pass arrays or null to `append`/`replaceChildren`; use a flattening helper.
23. Before release, check every file name mentioned in docs exists.
24. Commit each gate record with the response.
25. Namespace gate ids that are not protocol gates.
26. Before relying on a platform API, open its documentation/package and record the locator.
27. Never await a browser speech/audio promise without a timeout.

## How each loaded lesson is applied

| Lesson | Applied as |
|---|---|
| L-20261102T231000Z-slang-labels-omitted-in-first-theme-draft | Validator V5/V6 (T-015, T-016) frozen before content; S-006 runs the validator per theme. |
| L-20261102T231800Z-invented-statements-attributed-to-real-athlete | D-009 content notes; R-D5; S-006 step 6; S-ADVERSARIAL spot check. |
| L-20261102T232000Z-one-letter-keyword-stem-accepted-anything | D-004 whole-word rule for ≤2-letter stems (T-006) and V10 generic-sentence check (T-020, T-021). |
| L-20261102T232200Z-text-length-estimated-by-eye | V5/V6 word counts (T-015, T-016). |
| L-20261102T232000Z-american-conventions-and-us-sources… | A-018; S-007 README; UI text. |
| L-20261004T102001Z-recalled-literature-facts-wrong | S-006 step 1–2 (facts retrieved and recorded with URLs on the day). |
| L-20261004T102010Z-plan-controls-not-traced-to-delivery | S-RETRO input; plan/TRACEABILITY.md. |
| L-20261004T162211Z-frozen-tests-drifted-from-harness | Tests frozen as executable files with the manifest; satisfiability spike. |
| L-20261004T162218Z-unmeasured-claims-stated-as-fact | S-007 README claims must point to tests; About page browser notes cite C-001…C-004 as "may vary". |
| L-20261007T150100Z-no-credentials-in-command-lines | Only `gh`/git authenticated clients used; no tokens in commands. |
| L-20261007T150200Z-restart-means-fresh-state | Not applicable: no restart requested. |
| L-20261009T120019Z, L-20261009T123015Z, L-20261009T140015Z, L-20261009T160500Z, L-20261009T192000Z, L-20261009T193619Z, L-20261009T232008Z, L-20261009T234124Z (stores read before research) | Stores cloned and read in Phase 0 before any research (state.json `lesson_store`, `knowledge_store`). |
| L-20261009T123005Z-corroborated-label-without-independent-sources | claims.json: C-001, C-004, C-005 kept single-source (same publisher/author); D-009 counts publishers. |
| L-20261009T140014Z-gate-id-collided | Gate ids G-PAGES, G-LEARN namespaced. |
| L-20261009T152201Z-checkpoint-state-never-updated | Every step updates state.json and EXECUTION_LOG.md (PLAN preamble). |
| L-20261015T090000Z-public-repo-artifacts-are-publication | Repository is public (0.1); publication only under A-011 (G-002 pre-approval). |
| L-20261022T120000Z-store-not-found-ask-human, L-20261027T121000Z-wrong-knowledge-store, L-20261101T042300Z-probe-knowledge-store | Stores probed and named as their own intake item (15); readable. |
| L-20261023T223300Z-r0-table-quoted-proposals-not-adopted-text | This table names where each rule is applied in the plan files, not proposals. |
| L-20261102T085622Z-git-transport-blocked-use-git-database-api | git push and api.github.com both probed in 0.1 (push works; Actions API readable; Pages API refused). |
| L-20261102T085700Z-rollout-addendum-commits-cause-predictable-tip-drift | Not applicable: no rollout controller. |
| L-20261105T221000Z-source-facts-lost-in-context-reset | Round logs carry Sources checked tables written during the round. |
| L-20261004T102007Z-sandbox-reset-lost-working-tree | S-000 verifies the tree; push after every step. |
| L-20261028T210000Z-crlf-breaks-hash-manifests-on-windows | S-001 `.gitattributes`. |
| L-20261007T150900Z-windows-sha256sum-backslash | Not applicable: no Windows CI job (D-012); manifest uses plain relative paths. |
| L-20261007T151000Z-large-evidence-off-impl-branch | Not applicable (no audio evidence); screenshots are small PNGs. |
| L-20261009T150701Z-actions-logs-unreachable | Actions API probed readable (0.1); R-D7 reads jobs and annotations through the API. |
| L-20261009T150801Z-workflow-template-failed-to-parse | S-002 step 3 parses the YAML. |
| L-20261009T150901Z-deploy-workflow-empty-ref | Not applicable: no dispatch inputs. |
| L-20261009T151001Z-workflow-dispatch-needs-default-branch | live-check has `workflow_dispatch` on `main`; not on the critical path (deployment_status trigger). |
| L-20261028T200000Z-pinned-tool-version-does-not-exist | plan/ENVIRONMENT.md existence checks. |
| L-20261029T000000Z-green-ci-gate-never-ran | Validator tests T-011…T-023 show each rule fails on bad input; red verification of all tests. |
| L-20261031T100000Z-actions-run-steps-have-no-pipefail | ci.yml `defaults.run.shell: bash` + `set -euo pipefail`; lint step. |
| L-20261031T100100Z-verify-conformance-claims-against-the-tree | S-REVIEW lessons applied. |
| L-20261106T123000Z-cold-read-explicit-references | 3.6 mechanical reference check. |
| L-20261101T042000Z-commit-gate-records-with-the-response | plan/GATES.md preamble. |
| L-20261004T162226Z-stale-reference-to-missing-file | S-007 step 4. |
| L-20261009T191100Z-supplied-plan-stated-package-and-browser-facts… | C-001…C-004 recorded with locators; voice data file committed in spikes. |
| L-20261102T230300Z-dom-append-given-arrays-dropped-content | D-006 helper rule. |
| L-20261102T230700Z-navigation-test-raced-hashchange | T-033/T-045 wait on `data-route`. |
| L-20261009T191300Z / L-20261009T150601Z (browser suite run late) | S-005 step 4 pushes and runs CI after the UI step. |
| L-20261009T191400Z-resources-not-released-on-error-paths | S-ADVERSARIAL covers recognition error paths; recognition instance stopped on error/end. |
| L-20261009T150401Z-audiocontext-resume-without-timeout | D-007: `voiceschanged` wait capped at 2 s. |
| L-20261009T092004Z-claims-attributed-to-sources-not-read | Claims cite only pages opened in this run; snippets noted as such. |
| L-20261101T041800Z-perf-harness-must-exercise-what-it-reports, L-20261009T150301Z, L-20261009T150501Z, L-20261009T151801Z, L-20261101T041700Z | Not applicable: no performance metrics or audio clocks are reported. |

## Knowledge items used

| Item | Use |
|---|---|
| K-20261102T224000Z-speech-recognition-browser-support | C-003 |
| K-20261102T224100Z-speech-synthesis-browser-support | C-002 |
| K-20261102T231600Z-pages-first-build-startup-failure | C-010, R-D8 |
| K-20261004T162304Z-github-pages-index-entry-file | D-001 (index.html at root of main) |
| K-20261102T230400Z-dom-append-does-not-flatten-arrays | D-006 |
| K-20261101T043000Z-playwright-mobile-devices | D-015 (`Pixel 7`) |
| K-20261009T160117Z-playwright-sandbox-browsers | contradicted by C-012 → superseded by a new item |
| K-20261009T160118Z-pages-headers | not needed (no SharedArrayBuffer) |

# HANDOFF — implementing agent

**Purpose.** Build and publish the Finnish current-affairs exercise site described in `plan/PLAN.md`. Active profile: `software` with `courseware` and `software.deploys` (see `plan/PROFILE.md`).

**Reading order.** `plan/PROFILE.md` → `plan/ASSUMPTIONS.md` → `plan/DECISIONS.md` → `plan/PLAN.md` → `plan/GATES.md` → `plan/ENVIRONMENT.md` → `research/PRIOR_KNOWLEDGE.md` (checklist at the top) → `tests/`.

**Protocol and taxonomies.** The protocol is `qualitycoding/skills` `protocols/planning-protocol.md` at `0feb631` (local clone `/home/claude/qualitycoding/skills`); lesson/knowledge tag vocabularies are `TAXONOMY.md` in `qualitycoding/Lessons` and `qualitycoding/knowledge` (local clones `/home/claude/lessons`, `/home/claude/knowledge`). Read 'Conventions for every step' at the top of `plan/PLAN.md` before S-000.

**Environment.** See `plan/ENVIRONMENT.md`. In the sandbox the browsers are preinstalled (`/opt/pw-browsers`); do not download them.

**Frozen suite.** `node --test tests/*.test.mjs` (unit T-001…T-009, validator T-010…T-024, browser T-030…T-047). Verify the freeze with `sha256sum -c tests/FROZEN_MANIFEST.sha256`. Frozen files carry `FROZEN — DO NOT MODIFY`. You may not modify, skip, mark expected-failure or weaken them; if one is wrong, halt that step and write `TEST_CHALLENGE.md` (R-D2). `tests/server.mjs` is a helper and is frozen too.

**Steps at a glance.** S-000 → S-001 → S-002 → S-003 → S-004 → S-005 → S-006 → S-007 → S-REVIEW → S-ADVERSARIAL → S-PUBLISH (G-PAGES if Pages is off; G-002 pre-approved for this site, A-011) → S-LEARN (G-LEARN) → S-REFRESH → S-RETRO → S-KNOW (G-003). S-REVIEW, S-ADVERSARIAL and S-RETRO are run by fresh-context agents dispatched by the orchestrating session; S-REFRESH's schedule is created by the orchestrating session. While halted at a gate you may continue any step that does not depend on it, never an external or irreversible action.

**Halt / deviation protocol.** Unanticipated situation: choose the most reversible option that does not expand scope, log it in `DEVIATIONS.md` with rationale, and continue — unless it touches frozen tests, security, data integrity, a public interface or research integrity: then halt and write `BLOCKED.md`. Every substitution (version, package, flag, timeout, config file) goes into `DEVIATIONS.md` the moment it is made.

**Execution log.** `EXECUTION_LOG.md`: one line per step attempt (UTC time, step, attempt, outcome `pass|fail|blocked`, commit, note). Update `.checkpoints/state.json` after every step.

**Rule 9 (verbatim).** Integrity `[All]`: No step may fabricate, cherry-pick without disclosure, or manually alter data, test results, benchmarks, or figures.

**Rule 6 (verbatim).** Everything Is Committed `[All]`: No finding, decision, proof, figure spec, or artifact exists unless it is committed to the generation branch. Push cadence `[All]`, on every platform (stable and ephemeral): after every successful chunk — a plan step turning green, a frozen-test amendment round closed, a review or gate record committed — immediately push the working branch to the remote, then verify with `ls-remote` that the remote matches local HEAD. Retry transient failures with backoff (on flaky networks prefer HTTP/1.1 with a raised `http.postBuffer`); report any remote/local mismatch instead of assuming the push landed. (For implementation, "the generation branch" means the implementation branch `impl-20261106T235415Z-finnish-current-affairs-exercises`.)

**Rule 11 (verbatim, abridged to its operative text).** Lessons `[All]`: Whenever the executing agent corrects its own execution, it records a lesson before continuing. A correction is any of: redoing or reverting something the agent did; a command, assumption, or edit that failed and was fixed by taking a different approach; a check (test, cold read, proof review, pre-mortem, CI) that caught the agent's own mistake; a correction from the human. Retrying the same action after a transient failure is not a correction, and neither is a failure the protocol plans for (such as tests failing red against stubs). Each lesson is one file, `lessons/L-<YYYYMMDDTHHMMSSZ>-<slug>.md`, using the template in Appendix A of the protocol (copy the format of the files already in `lessons/`), with tags from the store taxonomy, committed before work continues.

**Rule 12 (verbatim, abridged).** Knowledge Base `[All]`: Whenever either agent discovers a new fact about the task's Subject, it adds a knowledge item `knowledge/K-<YYYYMMDDTHHMMSSZ>-<slug>.md` (format of the files in `knowledge/`) before continuing, with source, version, confidence and at least one `subject:` tag. A wrong or outdated fact is superseded by a new item, never edited away. Every external source you check (news pages included) is added to the source register `knowledge/K-20261107T003000Z-source-register-finnish-exercises.md` before your step is complete.

**Rule 13 (verbatim, abridged).** Lessons and knowledge items accumulate on the working branch during the run and are pushed only at the end, after gate G-003: lessons to `qualitycoding/Lessons`, knowledge items to `qualitycoding/knowledge`. They never contain credentials, tokens, secrets or personal data.

**Closing.** The plan begins with S-000 and ends with S-RETRO and S-KNOW.

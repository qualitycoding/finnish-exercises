# Human gates

While halted at a gate, the implementer may continue any step that does not depend on the gate's outcome, never an external or irreversible action. Each gate response is committed as `GATE-<id>.md` together with the change it causes (L-20261101T042000Z).

## G-002 External or irreversible actions

- **Pre-approved scope (A-011):** pushing this site to `main` of `qualitycoding/finnish-exercises` so GitHub Pages publishes it, including later fixes during `iterate` rounds.
- **Not pre-approved:** anything else external (other repositories, releases, packages, schedules). Creating the refresh schedule is decided at `G-LEARN`.

## G-PAGES Enable GitHub Pages (human action)

- **Trigger:** `S-PUBLISH` step 2a (default branch refused) or step 4, when `gh api repos/qualitycoding/finnish-exercises --jq .has_pages` prints `false` after the first push to `main`.
- **Evidence bundle (`GATE-G-PAGES.md`):** the pushed commit, the CI run id and conclusion for it.
- **Question:** "Please open https://github.com/qualitycoding/finnish-exercises/settings/pages and set *Build and deployment → Source: Deploy from a branch → Branch: main → / (root) → Save*. If I reported that I could not change the default branch, also set *Settings → General → Default branch → main*. Then reply `done`."
- **Responses:** `done` → continue `S-PUBLISH` step 5; `stop` → halt and run `S-RETRO`, `S-KNOW`.

## G-LEARN Learner trial (3.11)

- **Trigger:** end of `S-LEARN`.
- **Evidence bundle (`GATE-G-LEARN.md`):** site URL `https://qualitycoding.github.io/finnish-exercises/`; CI run id for the deployed commit; `pages build and deployment` run id; `Live site check` run id; list of themes with `dateLabel` and source links; browser support notes (D-007, D-012); the proposed refresh schedule — name `Finnish exercises weekly theme`, cadence `CRON_TZ=Europe/London 23 10 * * 6` (Saturdays 10:23 UK time), cloud task without local device, push notification on, prompt = the text in `plan/PLAN.md` S-REFRESH step 3.
- **Questions:**
  1. Did each exercise take roughly ten minutes?
  2. Was any answer marked wrong that you think is right (or the reverse)? Which item?
  3. Did listening and speaking work on your phone and browser? Which ones?
  4. Were slang and colloquial words clearly labelled and correctly explained?
  5. Is any content out of date, unclear or one-sided?
  6. Shall I create the weekly refresh as proposed (or with another day/time)?
- **Responses:** `proceed` (optionally with a schedule change) → `S-REFRESH`; `iterate: <notes>` → fix the items (each wrongly scored item first becomes a validator rule or test through Phase 2), re-run the validator and tests, redeploy, ask again; at most 3 rounds, then escalate with the open items; `proceed-with-rescope: <text>` → apply the rescope as a `D-###` and continue; `stop` → skip `S-REFRESH`, run `S-RETRO`, `S-KNOW`.

## G-003 Lessons and knowledge push (3.7.2)

- **Trigger:** `S-KNOW` step 1.
- **Evidence bundle (`GATE-G-003.md`):** the TAXONOMY.md additions of D-017, lesson IDs/titles/tags, knowledge IDs/statements/tags, the source register on its own line with its source count and the number of rows with an `unknown` or `none stated` licence.
- **Proposed targets:** lessons → `qualitycoding/Lessons`, knowledge → `qualitycoding/knowledge`.
- **Responses:** `push-to-proposed`, `push-to: <lesson-target> [knowledge-target]`, `do-not-push`.

No G-001 (no `math`/`computational` profile).

# Assumptions (A-###)

Intake batch sent 2026-11-06 23:58 UTC; the owner replied on 2026-11-07 00:02 UTC: "Plan and. Build. Note that I have updated the planning protocol with s refresh do include that in the plan. Proceed and switch to sonnet when you start implementation of the plan". Items the reply did not address adopt the proposed default (0.3.6).

| ID | Item | Value | Origin |
|---|---|---|---|
| A-001 | Plan or build | Plan **and** build in this session: the planning agent writes and pushes the plan, then a Sonnet-tier implementing agent runs it. | Owner answer (item 1). |
| A-002 | Profiles | `software` + `courseware`, `software.deploys = true`. | Default (item 2). |
| A-003 | Level | CEFR B1–B2. | Default (item 3). |
| A-004 | Colloquial Finnish | Articles in standard written Finnish (*yleiskieli*). Each reading ends with a dialogue in spoken Finnish (*puhekieli*) beginning `(keksitty esimerkki)` (invented example). Each listening has a standard-Finnish script plus a spoken-Finnish dialogue, also marked invented. | Default (item 4). |
| A-005 | Register labels | `slangi` (slang), `puhekieli` (colloquial spoken), `idiomi` (idiom), none = `SANA` (ordinary word). Each reading contains ≥1 `slangi` and ≥1 `puhekieli` term (validator V5). | Default (item 5). |
| A-006 | Explanation language | Glosses in simple Finnish followed by ` · ` and English (`[[sana|selitys · gloss|label]]`). Interface (buttons, instructions, feedback) in British English. | Default (item 6). |
| A-007 | Scope | 6 themes × 4 skills = 24 exercises, 10 items each, scored 0–10 in half points; free writing unscored. | Default (item 7). |
| A-008 | Content sources | Finnish news from the 7 days before the content is written: Yle Uutiset, Yle Selkouutiset and at least one other outlet (HS, IS, Iltalehti, MTV Uutiset, Kauppalehti) or an official source (valtioneuvosto.fi, ministries, agencies). Each theme shows its news date and source links. Original wording; nothing invented about real people; political topics neutral. | Default (item 8). |
| A-009 | Speech | Browser `speechSynthesis` (`fi-FI`) and `SpeechRecognition` (`fi-FI`) with self-assessment fallback; no recorded audio. Learner's phone and browser: **not stated**; the plan supports iOS Safari and Android Chrome and reports per-device behaviour at G-LEARN. | Default (item 9; phone not answered). |
| A-010 | Pages setting | The owner sets *Settings → Pages → Deploy from a branch → main → / (root)* when the implementer halts at `G-PAGES` (the session proxy refuses the Pages API, 0.1). | Default (item 10). |
| A-011 | Publication approval | The request itself approves publishing the site to GitHub Pages: G-002 is pre-approved for the Pages publication of this site only. Any other external action still halts at G-002. | Default (item 11). |
| A-012 | Persistence | Best, last, attempts and a history of up to 20 results per exercise in `localStorage` key `suomi-harjoitukset:v1`; JSON export and import on the About page (`#/tietoja`). | Default (item 12). |
| A-013 | Licence | Apache-2.0 (owner's standard; same text as `qualitycoding/swedish-exercises/LICENSE`). | Default (item 13). |
| A-014 | Learner trial | The owner tries one exercise of each skill on their phone after deployment; at most 3 iterate rounds. | Default (item 14). |
| A-015 | Project nature | `hobby`. Reference route: redistributable preferred; private references allowed under Rule 15 (none are expected). | Default (item 15). |
| A-016 | Stores | Lessons → `github.com/qualitycoding/Lessons` (read at `8d6c44c`), knowledge → `github.com/qualitycoding/knowledge` (read at `bf95f15`); both probed and readable on 2026-11-06. | Default (item 15, probed per L-20261027T121000Z). |
| A-017 | Refresh cadence (v3.15) | Weekly; each run adds **one complete theme** (four exercises), append-only, at Saturday 10:23 Europe/London. Not asked at intake because the protocol update arrived with the answers; the owner confirms or changes it at `G-LEARN`, before the schedule is created. | Planner default from skill `learning-exercise-site` §10, recorded as an assumption. |
| A-018 | Prose variety | All English prose (UI, README, plan) in British English: -ise, -our, single quotation marks in prose, day–month–year dates. Finnish language rules cite Finnish authorities (Kotus / Kielitoimisto). | Owner preference + lesson L-20261102T232000Z-american-conventions. |
| A-019 | Implementation tier | The implementing agent runs on Sonnet; fresh-context reviews (S-REVIEW, S-ADVERSARIAL, cold read, pre-mortem, retrospective) are run by separate agents dispatched by the orchestrating session. | Owner answer ("switch to sonnet"). |
| A-020 | Subject tags | `domain:language-learning`, `domain:finnish-current-affairs`, `tech:javascript`, `tech:playwright`, `tech:github-pages`, `tech:github-actions`, `tech:web-speech-api`. | Planner (0.3.1). |

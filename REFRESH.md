# Weekly content refresh

A scheduled task runs this procedure once a week. Each run adds **one new theme** (four exercises: reading,
listening, writing, speaking) and its content note, based on that week's Finnish news. It does not edit or delete
existing themes: their ids are the keys of learners' saved scores.

The rules come from the `learning-exercise-site` skill in `qualitycoding/skills` and from decisions D-016, D-017 and
D-018 of the plan. This file is the checklist for one run.

## 1. Prepare

1. Clone this repository and run `npm ci`. Run `npx playwright install chromium` only if
   `$PLAYWRIGHT_BROWSERS_PATH/chromium-1243` is missing. Then run `npm test`. If the suite fails **before** any change,
   stop and report: do not build on a broken baseline.
2. Read `data/manifest.json` and the newest three themes so the new theme differs in topic and area.
3. Create the branch: `git switch -c refresh/<id>` (the id is chosen in step 3).

## 2. Choose the topic

1. Search the web for Finnish news from the past seven days. Direct fetches of news sites may be blocked: use the URLs
   a search returns, never work around a block or a paywall, and never use a source you could not open.
2. Pick one story that matters to people living in Finland. **Every fact the exercises use needs at least two
   independent sources, meaning two different publisher groups**: Yle (Yle Uutiset, Selkouutiset, Svenska Yle);
   Sanoma (Helsingin Sanomat, Ilta-Sanomat); Alma Media (Iltalehti, Kauppalehti, Talouselämä); MTV Uutiset;
   STT (wire copy counts once wherever it appears); and one group per public authority, company or organisation that
   publishes its own text. If a fact cannot be sourced twice, drop it or keep it only as an attributed sentence
   ("Ylen mukaan ...") that no item asks about.
3. Rotate between areas: 1 environment and politics, 2 economy and work, 3 science and health, 4 culture and sport,
   5 everyday life and rules, 6 weather and seasons. Do not pick the same area as the newest theme.
4. Political stories: describe procedures, results and each side's stated positions neutrally; no verdicts.

## 3. Write the theme

1. Copy the structure of an existing file in `data/themes/`. New id: a short ASCII slug plus the date, for example
   `asuminen-20261114`. The file is `data/themes/<id>.json`. `dateLabel` is the date the run researched the news,
   written in Finnish (`14. marraskuuta 2026`). `sources` lists every source used (title and https URL).
2. Use absolute dates in the texts ("7. marraskuuta"), never *eilen* or *tällä viikolla* about the news.
3. Reading (`luku`): 200–450 words, original wording, ending with a short invented dialogue whose first line starts
   with `(keksitty esimerkki)` and which uses at least one `slangi` term and some `puhekieli` terms; 10 questions.
4. Listening (`kuuntelu`): script 120–320 words written for the exercise, plus the same kind of dialogue with at least
   one `puhekieli` term; only sourced facts about real people, never invented words, feelings or plans; 8 questions
   and 2 dictation sentences. Dictation and read-aloud targets contain no digits and no number words: write the
   number out of the sentence.
5. Writing (`kirjoitus`): 4 gaps (each with a `near` list of typical wrong forms), 3 word-order sentences in neutral
   word order (subject, verb, object or adverbial; 3–6 chips; no commas; the reversed order must not be accepted),
   3 translations with keyword groups and a model answer; an unscored free-writing task with checklist and model text.
6. Speaking (`puhe`): 6 read-aloud sentences and 4 questions with keyword groups and a model answer. Ask for a full
   sentence ("Vastaa kokonaisella lauseella") unless a short answer hits every keyword group.
7. Label every glossed word `[[shown|Finnish gloss · English|label]]` with `slangi`, `puhekieli`, `idiomi` or no label.
   Glosses are in simple Finnish plus a short English equivalent; English prose is British English.
8. **Slang check.** Look the word up in Kielitoimiston sanakirja. If that is unreachable, use a `slangi` label only
   for words that two independent sources found by search show as slang, and record both URLs in the content note.
   Never label a word `slangi` from memory.
9. Add the file name as the **first** entry of `data/manifest.json` (newest first). The old list stays, in order,
   at the end.
10. Write `content-notes/<id>.md`:
    - first line `Area: <1–6>`;
    - `## Facts`, a table `| Fact | Source 1 | Source 2 | Items |` with an https URL from a different publisher group
      in each source column;
    - `## Real people`, a table `| Sentence | Source |` with an https URL per row, or the single line `None.`;
    - `## Word order`, one line on why the reversed order of each order task is not neutral;
    - the slang-check evidence.

## 4. Verify, then publish

1. `node tools/validate.mjs`, `node tools/check-notes.mjs` and `node --test tests/*.test.mjs` must all pass. Fix the
   theme, never the tests or the validator rules. If they still fail after three attempts, do not push: report what
   fails.
2. Re-read every sentence that names a real person and check it against a source.
3. Commit as `Weekly theme: <title> (<dateLabel>)`, then `git fetch origin main && git rebase origin/main` and push
   the branch: `git push origin refresh/<id>`.
4. Wait for two runs on that exact commit. **CI** must succeed (on `refresh/**` it also fails if the diff against
   `origin/main` does anything but add a theme file and a note and change the manifest). The **Refresh guard** run is
   found only like this, polling every 30 seconds for up to 20 minutes:
   `gh api 'repos/qualitycoding/finnish-exercises/actions/workflows/refresh-guard.yml/runs?event=workflow_run&per_page=50' --jq '.workflow_runs[]|select(.display_title=="Refresh guard <sha>")|[.status,.conclusion,.id]|@tsv'`
   must print `completed	success	<id>`. If either fails or the guard run does not appear, stop without pushing to `main`.
5. Fast-forward only: `git push origin refresh/<id>:main`, never `--force`. If it is refused, rebase again and wait for
   CI again (at most three times).
6. Confirm three runs for the new `main` commit: **CI**, **pages build and deployment**, and **Live site check**. The
   live check counts only if its job `live` concluded `success`:
   `for id in $(gh api 'repos/qualitycoding/finnish-exercises/actions/runs?head_sha=<sha>&per_page=50' --jq '.workflow_runs[]|select(.name=="Live site check")|.id'); do gh api repos/qualitycoding/finnish-exercises/actions/runs/$id/jobs --jq '.jobs[]|select(.name=="live")|.conclusion'; done`
   must print `success` at least once. If no run appears within 10 minutes of a successful Pages build, start one with
   `gh workflow run live-check.yml --ref main` and use that run (github.io itself is not reachable from the agent sandbox).
7. Report: the theme title and area, the sources, the commit, the three run results, and
   `git diff --stat origin/main~1 origin/main`. If anything failed or was skipped, say so first.

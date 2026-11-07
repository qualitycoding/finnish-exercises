# Adversarial review (S-ADVERSARIAL)

Reviewer: fresh-context Opus agent, 2026-11-07. Branch `impl-20261106T235415Z-finnish-current-affairs-exercises`, HEAD `7c01b28`.
Method: a copy of the project in `/tmp/adv`, served with `tests/server.mjs`, driven by Playwright 1.63.0 (Chromium, 412 px and 360 px viewports) with scripted mocks for `SpeechRecognition` and `speechSynthesis`; scoring probed directly with `assets/scoring.js`; facts checked against the URLs in `content-notes/`. No project file other than this one was touched. Probe scripts are in `/tmp/advt/` (`p1`…`p8.mjs`, `alt.mjs`); they are not part of the project.

Counts: 0 Critical, 1 High, 8 Medium, 11 Low (see the table at the end). `node tools/validate.mjs` and `node tools/check-notes.mjs` pass on the branch, so none of the content problems below is caught by the current validators.

## 1. Robustness breaks

### B-01 Double tap on "Check my answers" or "Try again" lands on the other button — High

Cause: the result bar is sticky at the bottom and `#check`, `#retry` and the Check button of the freshly rendered exercise occupy the same coordinates (`#check` box x 34, y 742, 177 × 43 px; `#retry` x 34, y 742, 103 × 43 px at 412 px). The `checked` guard only protects the first button, which is replaced after the first click.

Reproduce (a) Check then Try again:
1. Open `#/harjoitus/kruunusillat-ratikka-20261107/luku` at 412 × 800.
2. Answer some items, then `page.dblclick('#check')`.
3. Result: the first click scores and saves (`attempts: 1`), the second click hits "Try again", the page re-renders blank. The learner never sees the feedback or the score; the saved result is the score of the answers, but the explanations are gone.

Reproduce (b) Try again then Check:
1. Score an exercise once (`attempts: 2`), then `page.mouse.dblclick` on the centre of `#retry`.
2. Result: the first click re-renders, the second hits the new "Check my answers" in the same place. `attempts` becomes 3, `last` becomes 0, a `0/10` score bar shows on an empty exercise, and a 0 is appended to `history`. `best` survives.

Fix (any one): ignore `#check` clicks for 500 ms after render; do not give Check and Try again the same screen position (put Try again on the left only after a 600 ms delay, or use `disabled` for the first 500 ms); refuse to score when no item has an answer (or ask "Nothing answered, check anyway?"). Add an e2e test that double-clicks both buttons and asserts `attempts` rises by one.

### B-02 One malformed score entry blanks the index and the exercise page — Medium

Reproduce: before load set `localStorage['suomi-harjoitukset:v1']` to `{"version":1,"scores":{"kruunusillat-ratikka-20261107-luku":{}}}` (also `…:5`, or `{"best":"x","last":null,"attempts":"y","history":"z"}`).
Result: `badgeFor`/`fmtScore(undefined)` throws `Cannot read properties of undefined (reading 'toFixed')` in `renderIndex`; the index stays on "Loading the exercises…" and the exercise page for that id also fails (`fmtScore(prevScore.best)`). About still works, but nothing tells the user to use "Reset all results". Entries with `best: -5` or `history: [null, 1, "a"]` survive.
Fix: pass every stored entry through `cleanEntry` (or a tolerant variant) in `loadStore`, and make `fmtScore` return `–` for non-finite input. Wrap `route()` in try/catch that renders "Something went wrong with your saved data. Reset it on the About page."

### B-03 One missing or invalid theme file takes the whole site down — Medium

Reproduce: delete `data/themes/polaaripyorre-talvi-20261107.json` (or serve an HTML sign-in page for it) and load `/`.
Result: `Promise.all` rejects, `#load-error` shows, all 24 exercises are unavailable (`data-ready="error"`). The error text itself is good.
Fix: `Promise.allSettled`; render the themes that loaded and list the failed file names in a notice. Relevant to the weekly refresh, where the manifest and a new theme file are published together and a cache or Pages-propagation gap can briefly 404 the newest file.

### B-04 Speech recognition is not released when the learner leaves or retries — Medium

Reproduce: mock `SpeechRecognition` whose `start()` never fires events; on a speaking page tap 🎤, then change the hash to `#/` (or press Try again). One second later `stop()` and `abort()` have been called 0 times; the recogniser lives until the 15 s timer. In Chrome that is an open microphone indicator (and audio sent to the online service) on a page the learner has left. This is the "resource release on error paths" lesson cited by this step.
Fix: keep the active recogniser in a module variable; call `abort()` from `route()`, from `renderExercise` and from the Check handler; ignore late results via a generation counter. Related Low: pressing Check while listening scores the item, but the late result then writes "I heard … best 1 pt" on a page whose score was already fixed (the button is disabled but the text changes).

### B-05 Route and data errors have no boundary; prototype names in the URL — Low

- `#/harjoitus/<valid id>/__proto__` throws `builders[kind] is not a function` and leaves the previous page; `…/constructor` and `…/toString` render a blank exercise with a Check button whose click throws (`checked` stays true, so it is dead). Cause: `theme.exercises[kind]` and `builders[kind]` are looked up on plain objects. Fix: `KINDS.includes(kind)` and `Object.hasOwn`.
- A theme missing `questions` or with an unknown item type throws inside `route()`; no message. CI validation makes this unlikely for shipped data.

### B-06 `speechSynthesis.speak` throwing is uncaught — Low

Mock `speak: () => { throw new Error('boom') }`; tap Play: uncaught `boom`, no message. Wrap `speakParagraphs` in try/catch and show the "no Finnish voice" notice style message.

### B-07 Voice notice never recovers if voices arrive after 2 s — Low

Mock `getVoices` returning `[]`, wait 2.3 s, then return `[{name:'Satu', lang:'fi_FI'}]` and fire `voiceschanged`: `#voice-status` stays `data-voice="none"` with "No Finnish voice found", although Play (which re-selects on every tap) would use Satu. Fix: keep the `voiceschanged` listener and re-run `apply()`.

### B-08 Import accepts junk keys and reports success for nothing — Low

- 8 000 well-formed but non-existent keys (`x123-20261107-luku`) are all imported (store 855 KB). Restrict keys to exercises in the loaded manifest.
- `best 2, last 9` and a non-ISO `at: "zzzz"` (which sorts as "newest" and wins `last`) are accepted. Normalise `best = max(best, last)`; require ISO `at`.
- A file with 0 valid entries shows `data-ok="1"` ("Imported 0 exercises; 2 invalid entries skipped"). Use `data-ok="0"` when `imported === 0`.
- "Saved results: N exercises" on About is not refreshed after an import.

### B-09 Recognition error handling is blunt — Low

`no-speech` (the learner simply stayed quiet) shows "Speech recognition did not work (no-speech). Please rate yourself instead." and unhides self-assessment for that item permanently; `not-allowed` does the same, which is right. Self-assessment also overrides a recognised score of 0 (`best === 0` in `check`), so a learner can say nothing sensible, press "Rate myself" and give themselves 1 point. Errors do not count towards the three attempts (a fourth tap after three results is correctly ignored and the button is disabled). Suggest: treat `no-speech` as an attempt with the message "I heard nothing" and keep self-assessment behind the explicit toggle.

### B-10 Other low-severity observations — Low

- A `3 €`-style answer works but `3€` does not (token `3€` is not the word `3`); `11/12` does not match `11` and `12`; `26.11.` does not match `marraskuu`.
- `closeTerms`/label: a glossed term inside an `mc` label would select the option when tapped; no shipped option contains markup, so this is latent.
- `javascript:` in `sources[].url` is not blocked by app code; the CSP stops execution (verified: click raised no dialog) and V2 requires https.

## 2. Hostile input results that held (no break)

| Probe | Result |
|---|---|
| Import `__proto__`/`constructor` keys, `__proto__` at top level | skipped; `({}).polluted` undefined; store unchanged |
| Import > 1 MB, 2 MB text, 50 000-item history file | rejected by size with the message |
| Import nested `[` × 500 000 (1 MB) and 400 000 inside `scores`, 100 000-deep objects | handled (parse error or "invalid entry"), no crash |
| Import `1e999`, negative, 3.3, 1e9 attempts, wrong `version`, `scores` as array, empty, binary, BOM | rejected or skipped with the right message |
| Corrupted store: `{{{`, `null`, `[]`, `5`, `"x"`, `scores:"abc"`, `__proto__` keys, bad `lastExport` | app loads, scores normally |
| Markup in titles, summaries, source titles, options, question text, gloss and label (`<img onerror>`, `<script>`, `"onclick=`) | rendered as text; no element created; CSP intact |
| Rapid programmatic triple click on `#check` | one attempt recorded |
| Recognition `onerror` `not-allowed`, `no-speech`, `onend` without result, `start()` throwing, no events at all | no crash; fallback or 15 s timeout works; fourth tap ignored, button disabled, `#retry` re-enables |
| No `speechSynthesis`, no voices | notices shown, page works |
| Missing manifest, wrong-type manifest, HTML instead of JSON | exact error text (B-03 aside) |
| 360 px sweep of index, About and all 24 exercises | no console errors or warnings, no horizontal overflow |

## 3. Content: correct answers the scoring marks wrong or partial

Method: for each theme I wrote the answers a B1–B2 learner might give (different word order, synonyms, inflected forms, plain-keyboard typing) and ran them through the app's own scoring (`/tmp/advt/alt.mjs`). Every row below is a correct or acceptable answer. Points are what the app awards; the item wants 1.

### C-01 Keyword stems miss consonant gradation, other tenses and common synonyms — Medium

The translations and the `respond` items use `scoreKeywords`. Stems are matched literally, so gradation and tense break them. Items are numbered as in the data file (kirjoitus = writing task number, puhe = speaking task number).

| Theme | Item | Correct answer given | Points | Missing group |
|---|---|---|---|---|
| Polaaripyörre | kirjoitus 8 (has weakened) | Polaaripyörre heikkeni aikaisin. | 0.5 | `heikent` (the exercise's own order task and the title use *heikkenee*) |
| Polaaripyörre | kirjoitus 8 | Polaaripyörre on heikentynyt varhain. | 0.5 | `aikai` |
| Polaaripyörre | kirjoitus 9 (will be seen) | Vaikutukset nähdään muutaman viikon kuluttua. | 0.5 | `näky` |
| Polaaripyörre | kirjoitus 10 | Talvi on vasta alussa. / Talvi on juuri alkamassa. | 0.5 / 0.5 | `alka` / `vasta` |
| Polaaripyörre | puhe 7 | Polaaripyörre on stratosfäärissä pohjoisnavan yllä. | 0.5 | `napa` (gradation: *navan*) |
| Polaaripyörre | puhe 8 | Viikkojen päästä. (Yle's own wording is *viikkojen päästä*) | 0.5 | `kulutt`/`vasta` |
| Polaaripyörre | puhe 10 | Tienpinnalle voi tulla liukkautta. | 0 | `kuura`/`jää` |
| Ympäristö | kirjoitus 8 (decided on) | Hallitus on päättänyt suunnitelmasta. / päättää / teki päätöksen | 0.5 each | `päätti` (`päätä` does not match *päättää*, *päättänyt*) |
| Ympäristö | kirjoitus 10 | Luonnos lähti komissiolle. | 0.5 | `lähetettiin` |
| Finlandia | kirjoitus 9 (category) | Jokaisessa luokassa on kuusi ehdokasta. | 0.5 | `luokka` listed, but *luokassa* does not contain it (gradation) |
| Finlandia | kirjoitus 8 / 10 | Säätiö ilmoittaa ehdokkaat. / Voittajat ilmoitetaan 26. marraskuuta. | 0.5 / 0.5 | `julkist`; *ilmoittaa*, *paljastaa*, *selviää* (the verb used in gap 4) are not listed |
| Tullimaksu | kirjoitus 8 (per goods item) | …kolme euroa jokaista tavaraa kohti. / per tuote | 0.5 | `tavaraer` |
| Tullimaksu | kirjoitus 9 | Tilausten määrä on pudonnut jyrkästi. | 0.5 | `lask` (*pudota* missing) |
| Tullimaksu | kirjoitus 9 | Tilaukset ovat vähentyneet voimakkaasti. | 0.5 | `määr` |
| Tullimaksu | kirjoitus 10 | EU:n ulkopuolelta tilaaminen on nykyään kalliimpaa. | 0.5 | `nyt`/`enemmän` (*nykyään*) |
| Tullimaksu | puhe 7 | Maksu peritään EU:n ulkopuolelta tulevista paketeista. | 0.5 | `tilau` |
| Tullimaksu | puhe 8 | Tilaukset vähenivät voimakkaasti. / Pakettien määrä laski. | 0.5 / 0.5 | `lask`/`pien`; `tavaraer` |
| Tullimaksu | puhe 10 | Tulli tarvitsee tiedot koko EU:sta. / tilastot | 0.5 / 0 | `luku` only |
| Kruunusillat | kirjoitus 8 | Uusi ratikkalinja avautui lauantaina. / …otettiin käyttöön… | 0.5 each | `avat` (*avautua*) |
| Kruunusillat | kirjoitus 10 | Sillalla voi kävellä ja pyöräillä. | 0 | `kävelij`, `käyttä`; *ylittää* gives 0.5 |
| Aivotutkimus | kirjoitus 8 | Tutkimus ilmestyi tieteellisessä lehdessä. / Artikkeli julkaistiin … | 0.5 each | `julkais` / `tutkim` |
| Aivotutkimus | kirjoitus 9, puhe 8 | …yhdistää lääkkeen ja värinän. / Lääkettä ja värinää. | 0.5 each | `värähte`/`tärin`: *värinä* and the STT release's own word *vibraatio* are missing |
| Aivotutkimus | kirjoitus 10, puhe 10 | Tutkijat toivovat voivansa…; He haluavat testata hoitoa potilailla. | 0.5 each | `halua`; `selvit`/`tutki` |
| Aivotutkimus | puhe 9 | Terveitä ihmisiä. (Yle says *terveitä henkilöitä*) | 0.5 | `aikui`/`vapaaehto` |

Fix: add the missing stems per item, prefer the stem before the gradation point (`nap`, `luok`, `heikk` and `heiken`, `pääte`/`päätt`/`päätö`, `puto`/`pudon`), add `ilmoit`, `vibra`, `värin`, `päästä`, `testa`/`kokeil`, `nyky`. Add the Yle and STT sentences themselves as test answers: a rule "every wording used by a cited source for a keyword's fact must score 1" would have caught *päästä*, *vibraatio*, *henkilöitä* and *hajonnut*.

### C-02 Compound words split by the recogniser, and a hint that invites a 0 — Medium

- Finlandia puhe 7 (*Kuka jakaa Finlandia-palkinnot?*, hint "säätiö", keyword `kirjasää`): "Säätiö jakaa palkinnot." and "Suomen kirja säätiö jakaa palkinnot." (the recogniser's likely output when it splits the compound) both score 0. Accept `säätiö` alone, or match on the space-removed transcript.
- Kruunusillat puhe 9 (`kruunuvuorensil`, `kruunusil`): "Kruunuvuoren silta." scores 0. Same fix.
- Keyword matching is per word, but `scoreSpoken` removes spaces; apply the same to long stems (≥ 6 letters) in `respond` scoring.

### C-03 Diacritics are strict in keyword scoring but lenient in gaps — Medium

"Menetelma yhdistaa laakkeen ja varahtelyn." scores 0.5 (2 of 4 groups), because every keyword stem containing ä/ö (`lääk`, `värähte`, `päätti`, `kävelij`, `pyöräilij`) fails when the learner types a/o. Learners without a Finnish keyboard (the likely users) get ½ in gap items for ä/ö slips and nothing in translations, which the About page does not say. Fix: fold ä/ö/å in keyword matching and award the group at full or minus ½ overall, matching T-035.

### C-04 Neutral-order items reject neutral variants — Medium (Aivotutkimus 7), Low (the rest)

- Aivotutkimus kirjoitus 7: "Tutkijat eivät tiedä vielä tehoa." (0). *vielä* before or after the main verb are both neutral; only the first is accepted. Add as an `accept` alternative.
- Finlandia kirjoitus 7 (*Marraskuun alussa kerrottiin ehdokkaat.*), Kruunusillat kirjoitus 7 (*Huhtikuussa kävelijät käyttävät siltaa.*), Polaaripyörre kirjoitus 7 (*Viikkojen kuluttua sää muuttuu.*): fronted time adverbials are everyday Finnish and score 0. R-012 chose neutral subject–verb order, and the instruction says so, so these are design limits; but the instruction's "subject – verb – object/adverbial" and the three accepted-looking sentences differ only in a time phrase. Either accept the fronted adverbial (not the reverse) or word the instruction "Start with the subject."

### C-05 Wrong answers that score full marks — Low

`scoreKeywords` has no negation or number check, and 4+ letter stems match anywhere:
- Tullimaksu puhe 9 (3 euros): "Kolmekymmentä euroa." and "Kolmetoista euroa." score 1 (`kolme` is inside both).
- Finlandia puhe 8 (six nominees): "Kuusikymmentä." scores 1.
- Finlandia puhe 9 (30 000 euros): "30 euroa." scores 1.
- Finlandia puhe 10 (winners announced 26 November): "Marraskuun alussa." scores 1 (that is when the nominees were announced).
- Aivotutkimus puhe 7: "Ei Oulun yliopistossa." and Kruunusillat puhe 10 "Linjat 11 ja 12 eivät kulje." score 1.
Fix: whole-word or end-anchored stems for numerals (`kolme(?!k|t)`, `kuusi(?!k|t)`), a small negation check (`ei`, `eivät`, `ole`) on `respond` items, or accept the risk and say so on the About page.

### C-06 Slang and puhekieli labels — Low (plausible, thinly sourced)

Labels in the data: *slangi*: duuni, duuniin, duunissa, faija, mutsi, fillari/fillarin/fillarilla; *puhekieli*: mä-type forms (kuulitsä, näitsä, mun, onks, oo/oon/oot, sit, toi, tosi). From my knowledge of Finnish all of these are plausible; *duuni*, *faija*, *mutsi* are textbook slang, the clitic and shortened forms are standard puhekieli, and *tosi* as an intensifier is colloquial. Doubts:
- *fillari* is widely understood nationally and in several dictionaries is marked colloquial (puhek.) rather than slang; I could not check Kielitoimiston sanakirja (`kielitoimistonsanakirja.fi` is not on my fetch allow-list), so I cannot confirm. The gloss "(Helsinki slang)" is defensible.
- The only sources for the slang labels are Wikipedia "Helsinki slang", preply.com and sublearn.com. Wikipedia gives no register for *duuni* (it appears as an example of voiced consonants), and marks *faija* and *mutsi* with "old/new" era tags. The D-017 fallback (two independent sources) is met formally, not in quality. Recommend re-checking the six slang words against Kielitoimiston sanakirja on the owner's machine before G-LEARN.
- In the dialogues many colloquial forms stay unglossed and unlabelled (*mä, sä, mulle, sulle, mua, sori, saa mennä, tykkään, ne on, tutkijat sanoo*) while *mun* and *oot* are glossed, so the legend implies a completeness the text does not have. SC-4 only requires that glossed terms are labelled, so Low.

### C-07 Real people — pass

I scanned all six data files for capitalised tokens: only organisations, places and book-prize names appear (Yle, Tulli, WWF Suomi, Luonnonsuojeluliitto, Sahateollisuus ry, Kirjasäätiö, Oulun yliopisto). The Yle articles name people (Daniel Sazonov, Teuvo Syrjälä, Tapani Veistola, Mai Suominen, Antti Hästbacka, Vesa Kiviniemi, Petteri Orpo and Finlandia authors); none appears in a theme, which matches each note's "Real people: None." "Gazan tilanteesta" in the Finlandia text is supported by Yle 74-20254555 ("huolissaan … Gazan tilanteesta").

## 4. Fact spot-checks

URLs I could open: all eight `yle.fi/a/…` pages (curl, HTTP 200: 74-20249368, 74-20254272, 74-20254764, 74-20254792, 74-20255222, 74-20255501, 74-20255601, 74-20255611); by WebFetch: `sttinfo.fi` 72458361, 72277641, 72173063, 72245639; `tulli.fi` customs-duty page; `karjalainen.fi/uutissuomalainen/9930567`; `maaseuduntulevaisuus.fi/metsa/d07723a3-…`; `kirjasaatio.fi/finlandia/tietoa-finlandia-palkinnoista`; `ilmatieteenlaitos.fi/tiedote/79fGR4xZDaqeapwXxSZZJ7` and `…/4x8Bzsupb4BsDqlALXcJUw`; `en.wikipedia.org/wiki/Helsinki_slang`. Not opened: `preply.com/en/blog/finnish-slang`, `sublearn.com/learn/fi/phrases/duuni` (not tried), Kielitoimiston sanakirja (not on allow-list). Plain `curl` returned no response for the non-Yle hosts (proxy), so WebFetch was used for them.

| Theme | Fact | Result |
|---|---|---|
| Aivotutkimus | Published Tuesday 3 Nov 2026 in Nature Communications | Confirmed (Yle "tänään tiistaina", STT release: 3 Nov) |
| Aivotutkimus | Drug plus vibration; about 30 healthy adults | Confirmed (Yle "noin 30 tervettä henkilöä"; Oulu "29", "terveillä aikuisilla"; Oulu says *vibraatiostimulaatio*) |
| Ympäristö | Government decided Thursday 5 Nov; binding duty only in Natura 2000 areas, voluntary elsewhere | Confirmed (Yle, Karjalainen) |
| Ympäristö | Draft was *sent* to the Commission | Overstated, see C-09 |
| Finlandia | Six nominees per series, three series, 30 000 euros | Confirmed (Yle, Kirjasäätiö) |
| Finlandia | Winners announced 26 Nov; Kirjasäätiö awards the prizes | Confirmed (Yle, Kirjasäätiö: "Palkinnot jakaa Suomen Kirjasäätiö") |
| Tullimaksu | EUR 3 per goods item from 1 July 2026, orders up to EUR 150; before that no duty | Confirmed (Tulli, Keskuskauppakamari, Yle) |
| Tullimaksu | Goods items fell 77 % in July–September | Confirmed (Yle 6 Nov) |
| Tullimaksu | Handling fee "planned for November" | Stale, see C-08 |
| Kruunusillat | Tram traffic from Saturday 7 Nov on lines 11 and 12; line 11 Pasila–Kruunuvuorenranta, line 12 Rautatientori–Yliskylä | Confirmed (Yle, HSL release) |
| Kruunusillat | Bridge about 1.2 km, Finland's longest; open to pedestrians and cyclists since April; only emergency vehicles on the road | Confirmed (Yle) |
| Polaaripyörre | Vortex broke up/weakened unusually early; effects only after weeks | Confirmed (Yle "hajonnut harvinaisen aikaisin … viikkojen päästä"; IL "1–3 weeks") |
| Polaaripyörre | Cold air can reach further south, but a hard cold spell is not certain | Partly, see C-10 |

### C-08 Stale fact: the handling fee has started — Medium

`halpatuonti-tullimaksu-20261107.json`, luku text: "Tulli kertoi toukokuussa, että … suunnitellaan … käsittelymaksua marraskuulle." The Yle article the theme cites (74-20255501) links to Yle 74-20254428, published 1 Nov 2026 ("Kaikista EU:n ulkopuolelta tilatuista verkkokauppaostoksista pitää maksaa tästä päivästä eteenpäin kahden euron käsittelymaksu"), so on 7 November the fee is in force at EUR 2 per goods item, not "planned". The note records the item as "planned, not confirmed as started" and does not mention the 1 Nov article. The text is attributed to May, but a reader will take it as current. Fix: state that the fee started on 1 November (EUR 2 per goods item, per Yle and Tulli) or drop the sentence; add 74-20254428 to the note. The luku items do not ask about it.

### C-09 "Sent" versus "to be sent" — Low

Ympäristö says the draft was sent (luku 1 option, gap 2 *lähetettiin*, order 1, dictation, puhe 1 and 7). Yle's text uses *lähettää*, *EU:lle lähetettävän suunnitelman* and *lähetetään*; Karjalainen says the government decided to submit it; only a WWF quote speaks of a draft already "toimitettu". Safer wording: "päätti lähettää luonnoksen" / "luonnos on lähdössä komissiolle". Gap 2 and dictation 9 would need a new verb form.

### C-10 Second source does not carry the fact — Low

- Tullimaksu: "reliable assessment needs EU-wide figures" (luku 6, kuuntelu 5/10, puhe 10, dictation 10). Source 2 (Tulli via STT, 19 Aug) says only that the period since early July is too short and a better assessment will be possible in the autumn; EU-wide statistics come later. The EU-wide sentence is in Yle (6 Nov, quoting a Tulli release the note says was not found), so the fact has one source for SC-7's "two independent sources".
- Polaaripyörre: "weak vortex can let cold air reach further south" is in Yle; the Ilmatieteen laitos 3 Nov release, as I read it, talks of a Greenland blocking high that raises the chance of cold weather in Finland and says the cold may go to Asia or North America instead. It supports "not certain" but not the stated southward flow.

### C-11 Number words and "30 000" — Low

Aivotutkimus texts say "noin kolmekymmentä" while the university release says 29; consistent with "noin" and with the validator's rule, so not a break, but puhe 9's accepted keywords do not include *vapaaehtoisia* synonyms such as *koehenkilöitä* (see C-01).

## 5. Break table

| Id | Severity | Title | Proposed disposition |
|---|---|---|---|
| B-01 | High | Double tap on Check/Try again hits the other button | Fix now; add e2e test |
| B-02 | Medium | Malformed score entry blanks index and exercise | Fix now; add test |
| B-03 | Medium | One missing theme file kills the site | Fix (allSettled) |
| B-04 | Medium | Recognition not aborted on navigation/retry | Fix; add test |
| C-01 | Medium | Keyword stems miss gradation, tenses, synonyms (table) | Fix items listed; add source-wording test |
| C-02 | Medium | Compound splitting; "säätiö" hint scores 0 | Fix |
| C-03 | Medium | Diacritics strict in keyword scoring | Fix or document |
| C-04 | Medium | *eivät tiedä vielä* rejected (and fronted adverbials, Low) | Add `accept` variants |
| C-08 | Medium | Handling fee text stale (started 1 Nov) | Fix text and note |
| B-05 | Low | No route error boundary; `__proto__` kind | Fix (cheap) |
| B-06 | Low | `speak()` exception uncaught | Fix (cheap) |
| B-07 | Low | Voice notice stays "none" after late voices | Fix (cheap) |
| B-08 | Low | Import junk keys, success flag, stale count | Fix or accept |
| B-09 | Low | `no-speech` forces self-assessment; self-rating overrides 0 | Accept or adjust |
| B-10 | Low | `3€`, `11/12`, `26.11.`; latent term-in-label; `javascript:` href | Accept |
| C-05 | Low | Wrong answers with full marks (kolme, kuusi, negation) | Accept with note, or anchor numerals |
| C-06 | Low | Slang labels thinly sourced; *fillari* may be puhekieli | Check against Kielitoimiston sanakirja before G-LEARN |
| C-06b | Low | Unglossed colloquialisms in dialogues | Accept |
| C-09 | Low | "sent" vs "to be sent" | Reword |
| C-10 | Low | Two facts lack a true second source | Add a source or mark as single-sourced |

Critical/High must be fixed before S-PUBLISH: B-01 only. The Medium items are recommended before G-LEARN, since C-01 to C-04 directly affect the "correct answers score 10" promise for real learners.

## Disposition (R-D10 fixes, recorded 2026-11-07)

Commits: **A** `eeb30fa` (code and unit/browser tests), **B** `c3bdaed` (content, notes, register, content tests, D-019), **C** `9b5818e` (T-089, About negation note, README). Test IDs and red outputs as in the disposition of `CODE_REVIEW.md`.

| ID | Severity | Disposition |
|---|---|---|
| B-01 | High | **Fixed** (A): Check is inert for 600 ms after every render and Try again / Next for 600 ms after Check (disabled or `aria-disabled`), so the second tap of a double tap never reaches the other button; the controls keep their places. T-068 double-clicks both buttons at 412 × 800 and asserts attempts, last score, history and the feedback on screen. |
| B-02 | Medium | **Fixed** (A): see CR-01; T-069 seeds seven damaged shapes and checks index, exercise and About. |
| B-03 | Medium | **Fixed** (A): `Promise.allSettled`; a skipped file is listed in `#theme-warning`, all failing gives the old `#load-error`; T-070. |
| B-04 | Medium | **Fixed** (A): the recogniser is aborted on route change, Check, retry and `pagehide`, and a late result is ignored; T-071. |
| B-05 | Low | **Fixed** (A): kinds are validated; an error boundary shows `#route-error` for broken theme data; T-073, T-089. |
| B-06 | Low | **Fixed** (A): see CR-02; T-072. |
| B-07 | Low | **Fixed** (A): `voiceschanged` keeps updating the voice line; T-077. |
| B-08 | Low | **Fixed** (A): keys limited to the manifest's exercises, ISO `at`, `best = max(best, last)`, `data-ok="0"` when nothing was imported, `#saved-count` refreshed; T-075. |
| B-09 | Low | **Fixed in part** (A): `no-speech` counts as an attempt with "I heard nothing" and does not open self-assessment (T-074). **Accepted:** self-assessment after the learner chose "Rate myself instead" still replaces a recognised 0; it is the documented fallback and an explicit choice. |
| B-10 | Low | **Accepted:** `3€`, `11/12`, `26.11.` tokenisation edge cases and the latent term-in-label case (no shipped option has markup). The `javascript:` link point is closed by CR-09; the CSP stays as the second line. |
| C-01 | Medium | **Fixed** (B): keyword groups cover gradation (*napa/nava*, *luokka/luok*), tenses, synonyms and the sources' wording (*viikkojen päästä*, *terveitä henkilöitä*, *vibraatio*, *ilmoitetaan*, *päätöksen*), and items gained `variants`; T-082 checks every answer in the review's table plus all variants. |
| C-02 | Medium | **Fixed** (A, B): *säätiö* and *kruunuvuor* are accepted beside the compound stems; hints that invited a 0 were changed (Finlandia puhe 7 and 10, Ympäristö puhe 10); stems of six or more letters match across a recogniser's space (T-063). Read-aloud was already tolerant (`scoreSpoken` removes spaces, T-029). |
| C-03 | Medium | **Fixed** (A): decision in D-019: ä/ö-folded keyword matches are accepted but cap the item at ½, consistent with gap scoring (T-035); frozen tests T-062, T-084. |
| C-04 | Medium | **Fixed** (B): neutral variants added for Aivotutkimus 7 (*vielä* after the verb) and the three fronted time adverbials; the reversed order is still rejected; T-085. |
| C-05 | Low | **Fixed in part** (A, B): numerals use whole-word stems (`=kolme`, `=kuusi`), *30 000* is matched as a unit, Finlandia puhe 10 needs the day; T-081, T-083. **Accepted:** answers that deny the fact (*Ei Oulun yliopistossa*, *linjat 11 ja 12 eivät kulje*) can still score; the About page now says keyword scoring ignores negation. |
| C-06 | Low | **Accepted:** the dictionary cannot be reached from the sandbox. The About page and README now say so, REFRESH.md records the re-check, and the owner can check the six slang words before G-LEARN. |
| C-06b | Low | **Accepted:** SC-4 requires labels on glossed terms only; unglossed colloquialisms in the invented dialogues are not claimed to be complete. |
| C-07 | – | Pass, no action. |
| C-08 | Medium | **Fixed** (B): the text and script say the EUR 2 handling fee per goods item has been charged since the start of November; new items use it; sources: Yle 74-20254428 (1 Nov, "tästä päivästä eteenpäin") and Tulli's release on STT Info 72350615 (24 Sep), with Suomen Yrittäjät and Taloustaito as extra confirmation; note and register updated; T-087. |
| C-09 | Low | **Fixed** (B): the draft is "to be sent" (*päätti lähettää*, *lähetetään*) in text, script, items, gap (now present passive), order task, translation, dictation and read-aloud; T-088. |
| C-10 | Low | **Fixed** (B): the EU-wide-figures claim (Tullimaksu: luku 6, kuuntelu 5 and 10, puhe 10) and the "no sure cold spell" claim (Polaaripyörre: luku 4, kuuntelu 4) left the items and stay in the text attributed to their source; the southward cold-air mechanism got a second publisher group (NOAA NESDIS) and went into the notes. Tulli's own Q3 release could not be opened (register row 66). T-088. |
| C-11 | Low | **Fixed** (B): "noin kolmekymmentä" stays (consistent with 29 and "noin 30"); *koehenkilöitä*, *henkilöitä*, *ihmisiä* accepted in puhe 9; note records the check. |

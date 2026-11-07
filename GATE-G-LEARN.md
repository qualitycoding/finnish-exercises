# GATE G-LEARN — learner trial

## Evidence
- Site: https://qualitycoding.github.io/finnish-exercises/
- Deployed commit `1470999328510024c2bb49374ade1ec0425990b1` on `main` (default branch `main`, Pages from main / root).
- CI runs 42370345901 and 42370344204: success. Pages build and deployment 42374267602: success. Live site check 42374301430, job `live`: success (four other deployment_status runs skipped by design).
- Tests: 110 pass (fail 0, skipped 0). Validator: 6 themes, 24 exercises valid. Content notes valid.
- Browser support (D-007, D-012): listening needs a Finnish voice (iPhone/iPad/Mac: Satu; Android: Google; Windows: Heidi; Edge online voices; desktop Chrome may have none and the page says so). Speaking uses Chrome, Edge or Safari speech recognition, with self-assessment elsewhere. CI tests Chromium only; Safari/WebKit is checked by this trial.

| id | title | date | sources |
|---|---|---|---|
| ennallistamissuunnitelma-20261107 | Ennallistamissuunnitelma EU:lle | 7. marraskuuta 2026 | https://yle.fi/a/74-20255222, https://www.karjalainen.fi/uutissuomalainen/9930567, https://www.maaseuduntulevaisuus.fi/metsa/d07723a3-b4b9-4b07-8247-bdf02c7191c7 |
| halpatuonti-tullimaksu-20261107 | Halpojen tilausten määrä laski tullimaksun jälkeen | 7. marraskuuta 2026 | https://yle.fi/a/74-20255501, https://tulli.fi/en/-/a-3-customs-duty-to-be-introduced-to-curb-low-value-import-consignments, https://www.sttinfo.fi/tiedote/72245639/eun-ulkopuolelta-tilattujen-suomessa-tullattujen-halpatuontilahetysten-kokonaisarvo-laski-kolmanneksen-heinakuussa?lang=fi, https://www.sttinfo.fi/tiedote/72173063/keskuskauppakamari-pienpakettien-tullimaksu-oikea-ja-tervetullut-ratkaisu?lang=fi, https://yle.fi/a/74-20254428, https://www.sttinfo.fi/tiedote/72350615/eun-tulliliitto-astui-uuteen-aikakauteen-luvassa-lisaa-muutoksia-verkkokauppaan?lang=fi |
| aivojen-puhdistuminen-20261107 | Aivojen puhdistumista tehostettiin Oulussa | 7. marraskuuta 2026 | https://yle.fi/a/74-20249368, https://www.sttinfo.fi/tiedote/72458361/oulun-yliopiston-tutkijoiden-kehittama-hoito-tehostaa-aivojen-puhdistumista-ja-avaa-uusia-mahdollisuuksia-aivorappeumasairauksien-ehkaisyyn?lang=fi |
| finlandia-ehdokkaat-20261107 | Finlandia-ehdokkaat julkistettiin | 7. marraskuuta 2026 | https://yle.fi/a/74-20254792, https://yle.fi/a/74-20254759, https://yle.fi/a/74-20254555, https://kirjasaatio.fi/finlandia/tietoa-finlandia-palkinnoista |
| kruunusillat-ratikka-20261107 | Ratikka ylittää Kruunuvuorensillan | 7. marraskuuta 2026 | https://yle.fi/a/74-20254764, https://www.sttinfo.fi/tiedote/72277641/raitiovaunuliikenne-kruunusilloilla-alkaa-711?lang=fi |
| polaaripyorre-talvi-20261107 | Polaaripyörre heikkenee ja talvi lähestyy | 7. marraskuuta 2026 | https://yle.fi/a/74-20255601, https://www.ilmatieteenlaitos.fi/tiedote/79fGR4xZDaqeapwXxSZZJ7, https://www.ilmatieteenlaitos.fi/tiedote/4x8Bzsupb4BsDqlALXcJUw, https://yle.fi/a/74-20255611, https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-the-polar-vortex |

### Proposed weekly refresh (created only after `proceed`)
- Name: Finnish exercises weekly theme. Cloud task, no local device, push notification on.
- Cadence: `CRON_TZ=Europe/London 23 10 * * 6` (Saturdays 10:23 UK time).
- Each run adds one complete theme on a `refresh/<id>` branch; it reaches `main` only after CI and the Refresh guard succeed for that commit (plan S-REFRESH, REFRESH.md).

## Questions
1. Did each exercise take roughly ten minutes?
2. Was any answer marked wrong that you think is right (or the reverse)? Which item?
3. Did listening and speaking work on your phone and browser? Which ones?
4. Were slang and colloquial words clearly labelled and correctly explained?
5. Is any content out of date, unclear or one-sided?
6. Shall I create the weekly refresh as proposed (or with another day/time)?

Reply `proceed` (optionally with a schedule change), `iterate: <notes>`, `proceed-with-rescope: <text>` or `stop`.

Response:

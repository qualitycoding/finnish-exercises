// FROZEN — DO NOT MODIFY (plan T-082…T-088; amendment D-019 after S-REVIEW and S-ADVERSARIAL)
// Content checks added by the review fixes: correct learner answers the scoring used to mark down, wrong answers
// that used to score full marks, neutral word-order variants, stale or single-sourced facts, 'sent' wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as scoring from "../assets/scoring.js";

const { scoreKeywords, scoreOrder, plain } = scoring;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "data/manifest.json"), "utf8"));
const themes = manifest.themes.map((f) => JSON.parse(readFileSync(join(root, "data", f), "utf8")));
const byPrefix = (p) => themes.find((t) => t.id.startsWith(p));
const item = (prefix, kind, n) => {
  const t = byPrefix(prefix);
  assert.ok(t, `theme ${prefix}`);
  const q = (t.exercises[kind].tasks || t.exercises[kind].questions)[n - 1];
  assert.ok(q, `${prefix} ${kind} ${n}`);
  return q;
};
const note = (prefix) => readFileSync(join(root, "content-notes", `${byPrefix(prefix).id}.md`), "utf8");
const strings = (x, out = []) => {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((y) => strings(y, out));
  else if (x && typeof x === "object") Object.values(x).forEach((y) => strings(y, out));
  return out;
};

// [theme prefix, exercise, item number, [answers a B1–B2 learner or a cited source might give]]
const CORRECT = [
  ["polaari", "kirjoitus", 8, ["Polaaripyörre heikkeni aikaisin.", "Polaaripyörre on heikentynyt varhain."]],
  ["polaari", "kirjoitus", 9, ["Vaikutukset nähdään muutaman viikon kuluttua.", "Vaikutukset näkyvät viikkojen päästä."]],
  ["polaari", "kirjoitus", 10, ["Talvi on vasta alussa.", "Talvi on juuri alkamassa."]],
  ["polaari", "puhe", 7, ["Polaaripyörre on stratosfäärissä pohjoisnavan yllä.", "Napa-alueen yllä."]],
  ["polaari", "puhe", 8, ["Viikkojen päästä.", "Vasta viikkojen kuluttua."]],
  ["polaari", "puhe", 10, ["Tienpinnalle voi tulla liukkautta.", "Tienpinnalle voi tulla kuuraa."]],
  ["ennallistamis", "kirjoitus", 8, ["Hallitus on päättänyt suunnitelmasta.", "Hallitus päättää suunnitelmasta.", "Hallitus teki päätöksen suunnitelmasta."]],
  ["ennallistamis", "kirjoitus", 10, ["Luonnos lähti komissiolle.", "Luonnos lähetetään komissiolle."]],
  ["finlandia", "kirjoitus", 8, ["Säätiö ilmoittaa ehdokkaat.", "Säätiö kertoo ehdokkaat."]],
  ["finlandia", "kirjoitus", 9, ["Jokaisessa luokassa on kuusi ehdokasta.", "Joka sarjassa on 6 ehdokasta."]],
  ["finlandia", "kirjoitus", 10, ["Voittajat ilmoitetaan 26. marraskuuta.", "Voittajat julkistetaan marraskuussa."]],
  ["finlandia", "puhe", 7, ["Säätiö jakaa palkinnot.", "Suomen kirja säätiö jakaa palkinnot.", "Suomen Kirjasäätiö."]],
  ["finlandia", "puhe", 8, ["Kuusi.", "Jokaisessa sarjassa on kuusi ehdokasta."]],
  ["finlandia", "puhe", 9, ["30 000 euroa.", "Voittaja saa kolmekymmentä tuhatta euroa."]],
  ["finlandia", "puhe", 10, ["26. marraskuuta.", "Marraskuun lopussa."]],
  ["halpatuonti", "kirjoitus", 8, ["Tullimaksu on kolme euroa jokaista tavaraa kohti.", "Tullimaksu on kolme euroa per tuote."]],
  ["halpatuonti", "kirjoitus", 9, ["Tilausten määrä on pudonnut jyrkästi.", "Tilaukset ovat vähentyneet voimakkaasti."]],
  ["halpatuonti", "kirjoitus", 10, ["EU:n ulkopuolelta tilaaminen on nykyään kalliimpaa.", "Tilaaminen EU:n ulkopuolelta maksaa enemmän."]],
  ["halpatuonti", "puhe", 7, ["Maksu peritään EU:n ulkopuolelta tulevista paketeista."]],
  ["halpatuonti", "puhe", 8, ["Tilaukset vähenivät voimakkaasti.", "Pakettien määrä laski."]],
  ["halpatuonti", "puhe", 9, ["Kolme euroa.", "Maksu on 3 euroa."]],
  ["halpatuonti", "puhe", 10, ["Marraskuun alusta.", "Käsittelymaksu peritään marraskuusta alkaen."]],
  ["kruunusillat", "kirjoitus", 8, ["Uusi ratikkalinja avautui lauantaina.", "Uusi ratikkalinja otettiin käyttöön lauantaina."]],
  ["kruunusillat", "kirjoitus", 10, ["Sillalla voi kävellä ja pyöräillä.", "Kävelijät ja pyöräilijät voivat käyttää siltaa."]],
  ["kruunusillat", "puhe", 9, ["Kruunuvuoren silta.", "Kruunuvuorensilta."]],
  ["aivojen", "kirjoitus", 8, ["Tutkimus ilmestyi tieteellisessä lehdessä.", "Artikkeli julkaistiin tieteellisessä lehdessä."]],
  ["aivojen", "kirjoitus", 9, ["Menetelmä yhdistää lääkkeen ja värinän.", "Hoito yhdistää lääkkeen ja vibraation."]],
  ["aivojen", "kirjoitus", 10, ["Tutkijat toivovat voivansa tutkia hoitoa potilailla.", "Tutkijat haluavat testata hoitoa potilailla."]],
  ["aivojen", "puhe", 8, ["Lääkettä ja värinää.", "Lääke ja vibraatio."]],
  ["aivojen", "puhe", 9, ["Terveitä ihmisiä.", "Terveitä henkilöitä.", "Terveitä koehenkilöitä."]],
  ["aivojen", "puhe", 10, ["He haluavat testata hoitoa potilailla.", "Tutkijat haluavat selvittää, auttaako hoito potilaita."]],
];

test("T-082 correct answers, in the wording of the cited sources and of a learner, score full marks", () => {
  for (const [p, kind, n, answers] of CORRECT) {
    const q = item(p, kind, n);
    for (const a of answers) assert.equal(scoreKeywords(a, q.keywords).points, 1, `${p} ${kind} ${n}: "${a}"`);
    for (const v of q.variants || []) assert.equal(scoreKeywords(v, q.keywords).points, 1, `${p} ${kind} ${n} variant "${v}"`);
  }
});

test("T-083 wrong answers no longer score full marks: numerals are whole words, dates need the day", () => {
  const wrong = [
    ["halpatuonti", "puhe", 9, ["Kolmekymmentä euroa.", "Kolmetoista euroa.", "30 euroa."]],
    ["halpatuonti", "kirjoitus", 8, ["Tullimaksu on kolmekymmentä euroa per tuote."]],
    ["finlandia", "puhe", 8, ["Kuusikymmentä.", "Kuusitoista ehdokasta."]],
    ["finlandia", "kirjoitus", 9, ["Jokaisessa sarjassa on kuusikymmentä ehdokasta."]],
    ["finlandia", "puhe", 9, ["30 euroa.", "Kolmekymmentä euroa."]],
    ["finlandia", "puhe", 10, ["Marraskuun alussa.", "Marraskuussa."]],
    ["halpatuonti", "puhe", 10, ["Marraskuun lopusta.", "Marraskuussa."]],
  ];
  for (const [p, kind, n, answers] of wrong) {
    const q = item(p, kind, n);
    for (const a of answers) assert.ok(scoreKeywords(a, q.keywords).points < 1, `${p} ${kind} ${n}: "${a}" must not score 1`);
  }
});

test("T-084 an answer typed without ä/ö earns half marks in keyword items, like a gap slip", () => {
  assert.equal(scoreKeywords("Menetelma yhdistaa laakkeen ja varahtelyn.", item("aivojen", "kirjoitus", 9).keywords).points, 0.5);
  assert.equal(scoreKeywords("Saatio julkistaa ehdokkaat.", item("finlandia", "kirjoitus", 8).keywords).points, 0.5);
  assert.equal(scoreKeywords("Hallitus paatti suunnitelmasta.", item("ennallistamis", "kirjoitus", 8).keywords).points, 0.5);
  assert.equal(scoreKeywords("Kavelijat ja pyorailijat voivat kayttaa siltaa.", item("kruunusillat", "kirjoitus", 10).keywords).points, 0.5, "every group found only without ä/ö");
  assert.equal(scoreKeywords("Kävelijät ja pyöräilijät voivat käyttää siltaa.", item("kruunusillat", "kirjoitus", 10).keywords).points, 1);
});

test("T-085 neutral variants named in the review are accepted; the reversed order still is not", () => {
  const cases = [
    ["aivojen", ["Tutkijat", "eivät", "tiedä", "vielä", "tehoa"]],
    ["finlandia", ["Marraskuun", "alussa", "kerrottiin", "ehdokkaat"]],
    ["kruunusillat", ["Huhtikuussa", "kävelijät", "käyttävät", "siltaa"]],
    ["polaari", ["Viikkojen", "kuluttua", "sää", "muuttuu"]],
  ];
  for (const [p, words] of cases) {
    const q = item(p, "kirjoitus", 7);
    assert.equal(scoreOrder(words, q.accept).points, 1, `${p}: ${words.join(" ")}`);
    const canonical = q.accept[0].replace(/[.!?]$/, "").split(" ");
    assert.equal(scoreOrder(canonical, q.accept).points, 1);
    assert.equal(scoreOrder(canonical.slice().reverse(), q.accept).points, 0, `${p}: reversed order`);
    assert.equal(scoreOrder(words.slice().reverse(), q.accept).points, 0, `${p}: reversed variant`);
  }
});

test("T-086 no spoken sentence swallows its neighbour after a number, and the Kruunusillat script reads the line numbers out", () => {
  for (const t of themes) {
    const spoken = [...t.exercises.kuuntelu.script, ...t.exercises.kuuntelu.dialogue, ...t.exercises.luku.text];
    for (const para of spoken) {
      for (const s of scoring.splitSentences(plain(para))) assert.ok(!/\d\.\s+\p{Lu}/u.test(s), `${t.id}: "${s}"`);
    }
  }
  const script = byPrefix("kruunusillat").exercises.kuuntelu.script.join(" ");
  assert.ok(script.includes("linjat yksitoista ja kaksitoista."));
  assert.ok(!/linjat 11 ja 12\./.test(script));
});

test("T-087 the customs handling fee is described as started, with a second publisher group in the note and the sources", () => {
  const t = byPrefix("halpatuonti");
  const all = strings(t.exercises).join("\n");
  assert.ok(!/suunnitellaan/.test(all) && !/marraskuulle/.test(all), "the fee is no longer 'planned for November'");
  assert.match(t.exercises.luku.text.join(" "), /Marraskuun alusta lähtien[^.]*peritään lisäksi/);
  assert.ok(t.sources.some((s) => s.url === "https://yle.fi/a/74-20254428"));
  assert.ok(t.sources.some((s) => s.url.includes("sttinfo.fi/tiedote/72350615")));
  const n = note("halpatuonti");
  assert.ok(n.includes("74-20254428") && n.includes("72350615"));
  assert.ok(!/planned, not confirmed as started/.test(n));
});

test("T-088 facts with only one publisher group are not asked, and the draft is 'to be sent', not 'sent'", () => {
  const items = (prefix) => ["luku", "kuuntelu", "kirjoitus", "puhe"].flatMap((k) => byPrefix(prefix).exercises[k].tasks || byPrefix(prefix).exercises[k].questions);
  const text = (q) => strings({ ...q, near: undefined }).join(" ");
  assert.ok(!items("halpatuonti").some((q) => /koko EU/i.test(text(q))), "EU-wide figures (one source) left the items");
  assert.ok(!items("polaari").some((q) => /pakkasjakso|varmasti kova/i.test(text(q))), "the 'no sure cold spell' claim (one source) left the items");
  assert.ok(!items("ennallistamis").some((q) => /lähetettiin|lähetti\b|lähetetty/.test(text(q))), "no item says the draft was already sent");
  const gap = item("ennallistamis", "kirjoitus", 2);
  assert.deepEqual(gap.accept, ["lähetetään"]);
  assert.ok(gap.near.includes("lähetettiin"));
  const ex = byPrefix("ennallistamis").exercises;
  const texts = [...ex.luku.text, ...ex.kuuntelu.script].join(" ");
  assert.ok(!/lähetti\b|lähetettiin/.test(texts), "texts say 'päätti lähettää', not 'lähetti'");
  assert.ok(/nesdis\.noaa\.gov/.test(JSON.stringify(byPrefix("polaari").sources)), "a second publisher group for the cold-air mechanism");
});

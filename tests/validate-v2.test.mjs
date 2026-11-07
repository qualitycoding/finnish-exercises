// FROZEN — DO NOT MODIFY (plan T-051…T-058; amendment D-017 after pre-mortem round 1)
// Validator rules added or left without a failing test in round 1: V1 (validateAll), V8 ä/ö gap, V9 reversed order,
// V13 near-miss lists (contentRules), V14 variants, V15 number words, V16 angle brackets, V17 content notes (validateAll).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateTheme, contentRules, validateAll } from "../tools/validate.mjs";

const words = (n, w = "sana") => Array.from({ length: n }, (_, i) => `${w}${i % 7}`).join(" ");
const gloss = (shown, label = "") => `[[${shown}|selitys · gloss${label ? `|${label}` : ""}]]`;

function validTheme() {
  const mc = (i) => ({ type: "mc", q: `Kysymys ${i}?`, options: ["yksi", "kaksi", "kolme"], answer: 1, explain: "Koska." });
  const tf = (i) => ({ type: "tf", q: `Väite ${i}.`, answer: true, explain: "Koska." });
  return {
    id: "budjetti-20261107",
    title: "Hallituksen budjetti",
    short: "Budjetti",
    dateLabel: "7. marraskuuta 2026",
    level: "B1–B2",
    summary: "Hallitus esitti budjetin.",
    sources: [
      { title: "Lähde A", url: "https://yle.fi/a/1" },
      { title: "Lähde B", url: "https://www.hs.fi/a/2" },
    ],
    exercises: {
      luku: {
        title: "Luku",
        intro: "Lue teksti.",
        text: [`${words(180)} ${gloss("hallitus")}.`],
        dialogue: [`(keksitty esimerkki) – Onks toi ${gloss("tosi", "puhekieli")} ${gloss("siisti", "slangi")}? – Joo. ${words(20, "joo")}`],
        questions: [mc(1), tf(2), mc(3), tf(4), mc(5), tf(6), mc(7), tf(8), mc(9), tf(10)],
      },
      kuuntelu: {
        title: "Kuuntelu",
        intro: "Kuuntele.",
        vocab: [gloss("eduskunta")],
        script: [`${words(100, "uutinen")}.`],
        dialogue: [`(keksitty esimerkki) – Mä ${gloss("meen", "puhekieli")} kauppaan. ${words(40, "puhe")}`],
        questions: [mc(1), tf(2), mc(3), tf(4), mc(5), tf(6), mc(7), tf(8),
          { type: "dictation", text: "Hallitus esitti budjetin." },
          { type: "dictation", text: "Eduskunta keskustelee siitä pitkään." }],
      },
      kirjoitus: {
        title: "Kirjoitus",
        tasks: [
          { type: "gap", q: "Hallitus ___ (esittää) budjetin.", hint: "imperfekti", accept: ["esitti"], near: ["esittää"], explain: "esittää – esitti" },
          { type: "gap", q: "Päätös ___ (tehdä) eilen.", hint: "passiivi", accept: ["tehtiin"], near: ["tehdään"], explain: "tehdä – tehtiin" },
          { type: "gap", q: "Me puhumme ___ (päätös).", hint: "elatiivi", accept: ["päätöksestä"], near: ["päätöksessä"], explain: "päätös – päätöksestä" },
          { type: "gap", q: "He menivät ___ (eduskunta).", hint: "illatiivi", accept: ["eduskuntaan"], near: ["eduskunnassa"], explain: "eduskunta – eduskuntaan" },
          { type: "order", en: "The government presented the budget.", accept: ["Hallitus esitti budjetin."] },
          { type: "order", en: "Is the budget big?", accept: ["Onko budjetti suuri?"] },
          { type: "order", en: "The tax does not rise.", accept: ["Vero ei nouse."] },
          { type: "translate", en: "The government decided to raise taxes.", keywords: [["hallitu"], ["päät"], ["vero"]], model: "Hallitus päätti nostaa veroja." },
          { type: "translate", en: "Parliament debates the budget.", keywords: [["eduskun"], ["keskustel"], ["budjet"]], model: "Eduskunta keskustelee budjetista." },
          { type: "translate", en: "Prices are rising.", keywords: [["hinna", "hinta"], ["nouse"]], model: "Hinnat nousevat." },
        ],
        free: { prompt: "Kirjoita viesti.", words: "50–80", checklist: ["Käytä yleiskieltä."], model: "Hyvä malli." },
      },
      puhe: {
        title: "Puhe",
        tasks: [
          { type: "read", text: "Hallitus esitti budjetin." },
          { type: "read", text: "Eduskunta keskustelee siitä." },
          { type: "read", text: "Hinnat nousevat taas." },
          { type: "read", text: "Verot eivät nouse." },
          { type: "read", text: "Päätös tehtiin eilen." },
          { type: "read", text: "Budjetti on suuri." },
          { type: "respond", q: "Mitä hallitus esitti?", hint: "budjetti", keywords: [["hallitu"], ["esit"], ["budjet"]], model: "Hallitus esitti budjetin." },
          { type: "respond", q: "Mitä hinnoille tapahtuu?", hint: "nousta", keywords: [["hinna", "hinta"], ["nouse"]], model: "Hinnat nousevat." },
          { type: "respond", q: "Missä budjetista keskustellaan?", hint: "eduskunta", keywords: [["eduskun"], ["keskustel"]], model: "Eduskunnassa keskustellaan budjetista." },
          { type: "respond", q: "Nousevatko verot?", hint: "ei", keywords: [["vero"], ["eivät", "ei"], ["nouse"]], model: "Verot eivät nouse." },
        ],
      },
    },
  };
}


const all = (t) => [...validateTheme(t, "fixture.json"), ...contentRules(t, "fixture.json")];
const expectRule = (rule, mutate, fn = all) => {
  const t = validTheme();
  mutate(t);
  const p = fn(t);
  assert.ok(p.some((m) => m.includes(`[${rule}]`)), `expected a [${rule}] problem, got: ${JSON.stringify(p)}`);
};

test("T-051 the amended valid fixture passes validateTheme and contentRules", () => {
  assert.deepEqual(all(validTheme()), []);
});

test("T-052 [V8] a writing exercise without a gap answer containing ä or ö", () => {
  expectRule("V8", (t) => (t.exercises.kirjoitus.tasks[2] = { type: "gap", q: "Me puhumme ___ (asia).", hint: "elatiivi", accept: ["asiasta"], near: ["asiassa"], explain: "asia – asiasta" }));
});

test("T-053 [V9] the reversed sentence is accepted, or more than six chips", () => {
  expectRule("V9", (t) => t.exercises.kirjoitus.tasks[4].accept.push("budjetin esitti Hallitus."));
  expectRule("V9", (t) => (t.exercises.kirjoitus.tasks[4].accept = ["Hallitus esitti taas budjetin nopeasti tänään eduskunnalle."]));
});

test("T-054 [V13] contentRules: every gap lists at least one near-miss that is not an accepted answer", () => {
  expectRule("V13", (t) => delete t.exercises.kirjoitus.tasks[0].near);
  expectRule("V13", (t) => (t.exercises.kirjoitus.tasks[0].near = ["esitti"]));
});

test("T-055 [V14] every listed variant answer scores full marks", () => {
  expectRule("V14", (t) => (t.exercises.puhe.tasks[6].variants = ["Budjetin."]));
  const t = validTheme();
  t.exercises.puhe.tasks[6].variants = ["Hallitus esitteli budjetin."];
  assert.deepEqual(all(t), [], "a variant that hits every group is fine");
});

test("T-056 [V15] number words in read-aloud or dictation targets", () => {
  expectRule("V15", (t) => (t.exercises.puhe.tasks[0].text = "Kaksi ministeriä esitti budjetin."));
  expectRule("V15", (t) => (t.exercises.kuuntelu.questions[8].text = "Hallitus säästää kolmekymmentä miljoonaa."));
});

test("T-057 [V16] angle brackets anywhere in a theme (no HTML in data)", () => {
  expectRule("V16", (t) => (t.summary = "Hallitus <b>esitti</b> budjetin."));
  expectRule("V16", (t) => (t.exercises.luku.questions[0].options[0] = "<img src=x onerror=alert(1)>"));
});

test("T-058 [V1]/[V17] validateAll: duplicate id, file name not matching id, missing content note", () => {
  const root = mkdtempSync(join(tmpdir(), "fi-val-"));
  mkdirSync(join(root, "data/themes"), { recursive: true });
  mkdirSync(join(root, "content-notes"));
  const a = validTheme();
  writeFileSync(join(root, "data/themes/budjetti-20261107.json"), JSON.stringify(a));
  writeFileSync(join(root, "data/themes/kopio-20261107.json"), JSON.stringify(a));
  writeFileSync(join(root, "content-notes/budjetti-20261107.md"), "# notes");
  writeFileSync(join(root, "data/manifest.json"), JSON.stringify({ themes: ["themes/budjetti-20261107.json", "themes/kopio-20261107.json"] }));
  const { problems } = validateAll(root);
  assert.ok(problems.some((m) => m.includes("[V1]") && m.includes("duplicate")), JSON.stringify(problems));
  assert.ok(problems.some((m) => m.includes("[V1]") && m.includes("file name")), JSON.stringify(problems));
  const b = validTheme();
  b.id = "toinen-20261108";
  writeFileSync(join(root, "data/themes/toinen-20261108.json"), JSON.stringify(b));
  writeFileSync(join(root, "data/manifest.json"), JSON.stringify({ themes: ["themes/toinen-20261108.json"] }));
  assert.ok(validateAll(root).problems.some((m) => m.includes("[V17]")), "missing content-notes/<id>.md");
  writeFileSync(join(root, "content-notes/toinen-20261108.md"), "# notes");
  assert.deepEqual(validateAll(root).problems, []);
});

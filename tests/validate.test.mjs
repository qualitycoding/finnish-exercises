// FROZEN — DO NOT MODIFY (plan T-010..T-024; change only through TEST_CHALLENGE.md, see HANDOFF.md)
// The data validator (tools/validate.mjs, D-003) must accept a valid theme and reject each broken variant
// with the rule id named in the message. Every rejection here is a check that can fail (Rule 14).
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTheme, GENERIC_SENTENCES } from "../tools/validate.mjs";

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
          { type: "gap", q: "Hallitus ___ (esittää) budjetin.", hint: "imperfekti", accept: ["esitti"], explain: "esittää – esitti" },
          { type: "gap", q: "Päätös ___ (tehdä) eilen.", hint: "passiivi", accept: ["tehtiin"], explain: "tehdä – tehtiin" },
          { type: "gap", q: "Me puhumme ___ (päätös).", hint: "elatiivi", accept: ["päätöksestä"], explain: "päätös – päätöksestä" },
          { type: "gap", q: "He menivät ___ (eduskunta).", hint: "illatiivi", accept: ["eduskuntaan"], explain: "eduskunta – eduskuntaan" },
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

const problemsOf = (mutate) => {
  const t = validTheme();
  mutate(t);
  return validateTheme(t, "fixture.json");
};
const expectRule = (rule, mutate) => {
  const p = problemsOf(mutate);
  assert.ok(p.some((m) => m.includes(`[${rule}]`)), `expected a [${rule}] problem, got: ${JSON.stringify(p)}`);
};

test("T-010 a valid theme has no problems", () => {
  assert.deepEqual(validateTheme(validTheme(), "fixture.json"), []);
});

test("T-011 [V1] missing field or badly formed dated id", () => {
  expectRule("V1", (t) => delete t.dateLabel);
  expectRule("V1", (t) => (t.id = "budjetti"));
});

test("T-012 [V2] fewer than two sources from distinct hosts, or a non-https source", () => {
  expectRule("V2", (t) => (t.sources = [t.sources[0]]));
  expectRule("V2", (t) => (t.sources[1].url = "https://yle.fi/a/2"));
  expectRule("V2", (t) => (t.sources[1].url = "http://www.hs.fi/a/2"));
});

test("T-013 [V3] wrong item count or item-type mix", () => {
  expectRule("V3", (t) => t.exercises.luku.questions.pop());
  expectRule("V3", (t) => (t.exercises.kuuntelu.questions[9] = { type: "tf", q: "x", answer: true }));
  expectRule("V3", (t) => (t.exercises.kirjoitus.tasks[0] = t.exercises.kirjoitus.tasks[7]));
  expectRule("V3", (t) => (t.exercises.puhe.tasks[0] = t.exercises.puhe.tasks[6]));
});

test("T-014 [V4] malformed markup, unknown label, gloss without ' · ' English part", () => {
  expectRule("V4", (t) => (t.exercises.luku.text[0] += " [[rikki|selitys · x"));
  expectRule("V4", (t) => (t.exercises.luku.text[0] += " [[sana|selitys · x|vardagligt]]"));
  expectRule("V4", (t) => (t.exercises.luku.text[0] += " [[sana|vain suomeksi]]"));
});

test("T-015 [V5] reading length outside 200–450 words, no slangi or puhekieli term, dialogue not marked invented", () => {
  expectRule("V5", (t) => (t.exercises.luku.text = [words(30)]));
  expectRule("V5", (t) => (t.exercises.luku.text = [words(500)]));
  expectRule("V5", (t) => (t.exercises.luku.dialogue[0] = t.exercises.luku.dialogue[0].replace("|slangi", "|puhekieli")));
  expectRule("V5", (t) => (t.exercises.luku.dialogue[0] = t.exercises.luku.dialogue[0].replace("|puhekieli", "|slangi")));
  expectRule("V5", (t) => (t.exercises.luku.dialogue[0] = t.exercises.luku.dialogue[0].replace("(keksitty esimerkki) ", "")));
});

test("T-016 [V6] listening length outside 120–320 words, dialogue without puhekieli or not marked invented", () => {
  expectRule("V6", (t) => (t.exercises.kuuntelu.script = [words(10)]) && (t.exercises.kuuntelu.dialogue = ["(keksitty esimerkki) [[mä|minä · I|puhekieli]]"]));
  expectRule("V6", (t) => (t.exercises.kuuntelu.script = [words(400)]));
  expectRule("V6", (t) => (t.exercises.kuuntelu.dialogue[0] = t.exercises.kuuntelu.dialogue[0].replace("|puhekieli", "")));
  expectRule("V6", (t) => (t.exercises.kuuntelu.dialogue[0] = t.exercises.kuuntelu.dialogue[0].replace("(keksitty esimerkki) ", "")));
});

test("T-017 [V7] multiple-choice and true/false consistency", () => {
  expectRule("V7", (t) => (t.exercises.luku.questions[0].options = ["a", "b"]));
  expectRule("V7", (t) => (t.exercises.luku.questions[0].answer = 3));
  expectRule("V7", (t) => (t.exercises.luku.questions[0].options = ["a", "a", "b"]));
  expectRule("V7", (t) => (t.exercises.luku.questions[1].answer = "kyllä"));
});

test("T-018 [V8] gap without ___ or whose first accepted answer does not score 1", () => {
  expectRule("V8", (t) => (t.exercises.kirjoitus.tasks[0].q = "Hallitus (esittää) budjetin."));
  expectRule("V8", (t) => (t.exercises.kirjoitus.tasks[0].accept = []));
});

test("T-019 [V9] word order: comma, too many chips, alternative with other words", () => {
  expectRule("V9", (t) => (t.exercises.kirjoitus.tasks[4].accept = ["Hallitus, esitti budjetin."]));
  expectRule("V9", (t) => (t.exercises.kirjoitus.tasks[4].accept = ["Hallitus esitti budjetin tänään eilen huomenna aina joskus usein."]));
  expectRule("V9", (t) => t.exercises.kirjoitus.tasks[4].accept.push("Budjetin hallitus esitti nopeasti."));
});

test("T-020 [V10] model misses a keyword group, or a generic sentence scores above 0", () => {
  expectRule("V10", (t) => (t.exercises.kirjoitus.tasks[7].model = "Hallitus päätti jotain."));
  expectRule("V10", (t) => (t.exercises.puhe.tasks[6].keywords = [["on"], ["se"]]) && (t.exercises.puhe.tasks[6].model = "Se on hyvä."));
  expectRule("V10", (t) => (t.exercises.kirjoitus.tasks[7].keywords = [[""]]));
});

test("T-021 the generic-sentence list is fixed and non-empty", () => {
  assert.ok(Array.isArray(GENERIC_SENTENCES) && GENERIC_SENTENCES.length >= 5);
  assert.ok(GENERIC_SENTENCES.includes("Se on totta."));
});

test("T-022 [V11] digits in a spoken target", () => {
  expectRule("V11", (t) => (t.exercises.kuuntelu.questions[8].text = "Hallitus esitti 3 budjettia."));
  expectRule("V11", (t) => (t.exercises.puhe.tasks[0].text = "Vuonna 2026 hallitus esitti budjetin."));
});

test("T-023 [V12] free writing missing a field", () => {
  expectRule("V12", (t) => delete t.exercises.kirjoitus.free.model);
});

test("T-024 every problem message names its rule id", () => {
  const p = problemsOf((t) => {
    t.sources = [];
    t.exercises.luku.questions.pop();
  });
  assert.ok(p.length >= 2);
  for (const m of p) assert.match(m, /\[V\d+\]/);
});

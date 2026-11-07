// FROZEN — DO NOT MODIFY (plan T-060, T-061; amendment D-018 after pre-mortem round 2)
import { test } from "node:test";
import assert from "node:assert/strict";
import { contentRules } from "../tools/validate.mjs";
import { checkNote, publisherGroup } from "../tools/check-notes.mjs";

const theme = (readText, dictation) => ({
  id: "x-20261107",
  exercises: {
    kirjoitus: { tasks: [] },
    puhe: { tasks: [{ type: "read", text: readText }] },
    kuuntelu: { questions: [{ type: "dictation", text: dictation }] },
  },
});
const v15 = (t) => contentRules(t, "f.json").filter((m) => m.includes("[V15]"));

test("T-060 [V15] contentRules rejects inflected numerals, percentages and ordinals in spoken targets", () => {
  assert.ok(v15(theme("Kahden ministerin mukaan budjetti kasvaa.", "Hallitus esitti budjetin.")).length >= 1);
  assert.ok(v15(theme("Hallitus esitti budjetin.", "Hinnat nousivat prosentilla.")).length >= 1);
  assert.ok(v15(theme("Kuuden kaupungin asukkaat äänestivät.", "Hallitus esitti budjetin.")).length >= 1);
  assert.ok(v15(theme("Ensimmäinen päätös tehtiin eilen.", "Hallitus esitti budjetin.")).length >= 1);
  assert.deepEqual(v15(theme("Ulkona sataa lunta.", "Hallitus esitti budjetin.")), [], "sataa (it rains) is not a numeral");
  assert.deepEqual(v15(theme("Eduskunta keskustelee budjetista.", "Hinnat nousevat taas.")), []);
});

const good = `# Notes
## Facts
| Fact | Source 1 | Source 2 | Items |
|---|---|---|---|
| The budget was presented on 7 November. | https://yle.fi/a/1 | https://www.hs.fi/politiikka/2 | luku 1 |
| Prices rose. | https://www.iltalehti.fi/a/3 | https://valtioneuvosto.fi/-/4 | kuuntelu 2 |
## Real people
| Sentence | Source |
|---|---|
| Valtiovarainministeri esitti budjetin. | https://yle.fi/a/1 |
`;

test("T-061 content notes: two publisher groups per fact and a source for every real-person sentence", () => {
  assert.deepEqual(checkNote(good, "n.md"), []);
  assert.equal(publisherGroup("https://www.hs.fi/a"), publisherGroup("https://www.is.fi/b"), "HS and IS are both Sanoma");
  assert.equal(publisherGroup("https://yle.fi/a"), publisherGroup("https://svenska.yle.fi/b"));
  assert.notEqual(publisherGroup("https://yle.fi/a"), publisherGroup("https://www.mtvuutiset.fi/b"));
  const sameGroup = good.replace("https://www.hs.fi/politiikka/2", "https://www.is.fi/politiikka/2").replace("https://yle.fi/a/1 | https://www.is", "https://www.hs.fi/a/1 | https://www.is");
  assert.ok(checkNote(sameGroup, "n.md").some((m) => m.includes("[N2]")), "HS + IS is one group");
  assert.ok(checkNote(good.replace(/## Facts[\s\S]*?## Real people/, "## Real people"), "n.md").some((m) => m.includes("[N1]")));
  assert.ok(checkNote(good.replace(/## Real people[\s\S]*$/, ""), "n.md").some((m) => m.includes("[N3]")));
  assert.ok(checkNote(good.replace("| Valtiovarainministeri esitti budjetin. | https://yle.fi/a/1 |", "| Valtiovarainministeri esitti budjetin. | Yle |"), "n.md").some((m) => m.includes("[N4]")));
  assert.deepEqual(checkNote(good.replace(/\| Valtiovarainministeri[^\n]*\n/, "None.\n"), "n.md"), [], "'None.' is allowed when no real person is named");
});

// FROZEN — DO NOT MODIFY (plan T-062…T-067 and T-081; amendment D-019 after S-REVIEW and S-ADVERSARIAL)
// Unit and static checks added by the review fixes: keyword folding, compound tolerance, sentence splitting,
// CSP and no-inline guards, note-checker publisher groups and malformed links.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as scoring from "../assets/scoring.js";
import { checkNote, publisherGroup } from "../tools/check-notes.mjs";
import { validateTheme } from "../tools/validate.mjs";

const { scoreKeywords } = scoring;
const splitSentences = (t) => scoring.splitSentences(t);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("T-062 a keyword typed without ä/ö counts, but only for half marks overall (as a gap slip does)", () => {
  const groups = [["menetelm"], ["yhdist"], ["lääk"], ["värähte"]];
  const exact = scoreKeywords("Menetelmä yhdistää lääkkeen ja värähtelyn.", groups);
  assert.equal(exact.points, 1);
  assert.deepEqual(exact.slips, []);
  const slip = scoreKeywords("Menetelma yhdistaa laakkeen ja varahtelyn.", groups);
  assert.equal(slip.points, 0.5, "all four groups found only after folding → ½");
  assert.deepEqual(slip.slips, ["lääk", "värähte"], "slips names the groups found only after folding");
  assert.deepEqual(slip.missing, []);
  const mixed = scoreKeywords("Menetelmä yhdistää laakkeen ja värähtelyn.", groups);
  assert.equal(mixed.points, 0.5, "one slip among exact groups caps the item at ½");
  assert.equal(scoreKeywords("En tiedä.", groups).points, 0);
  assert.equal(scoreKeywords("Menetelma toimii.", groups).points, 0, "folding does not rescue a mostly missing answer");
  assert.deepEqual(scoreKeywords("Menetelmä yhdistää jotain.", groups).missing, ["lääk", "värähte"], "missing keeps the names of groups found neither exactly nor folded");
});

test("T-063 long stems (6+ letters) match across a space a recogniser put inside a compound; short stems do not", () => {
  assert.equal(scoreKeywords("Suomen kirja säätiö jakaa palkinnot.", [["kirjasää"]]).points, 1);
  assert.equal(scoreKeywords("Tulli maksu on kolme euroa.", [["tullimaks"], ["kolme"]]).points, 1);
  assert.equal(scoreKeywords("ve ro nousee", [["vero"]]).points, 0, "a 4-letter stem still has to sit inside one word");
  assert.equal(scoreKeywords("Hakemus hylättiin.", [["kem"]]).points, 0);
});

test("T-064 sentences: an ordinal before a lower-case word stays together, a number ending a sentence does not", () => {
  assert.deepEqual(splitSentences("Reitillä kulkevat linjat 11 ja 12. Ylen mukaan ensimmäinen ratikka lähti."), [
    "Reitillä kulkevat linjat 11 ja 12.",
    "Ylen mukaan ensimmäinen ratikka lähti.",
  ]);
  assert.deepEqual(splitSentences("Hallitus päätti torstaina 5. marraskuuta uudesta suunnitelmasta. Se lähtee EU:lle."), [
    "Hallitus päätti torstaina 5. marraskuuta uudesta suunnitelmasta.",
    "Se lähtee EU:lle.",
  ]);
  assert.deepEqual(splitSentences("Maksu koskee esim. paketteja, mm. kenkiä ja ns. pikatilauksia. Toinen lause."), [
    "Maksu koskee esim. paketteja, mm. kenkiä ja ns. pikatilauksia.",
    "Toinen lause.",
  ]);
  assert.deepEqual(splitSentences("Kysyin: onko tämä totta? Kyllä! Hyvä."), ["Kysyin: onko tämä totta?", "Kyllä!", "Hyvä."]);
  assert.deepEqual(splitSentences(""), []);
});

test("T-065 index.html keeps the D-017 CSP and nothing inline; app code has no HTML sinks or style attributes", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'";
  assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${csp}">`), "exact D-017 CSP meta element");
  assert.ok(!/<script(?![^>]*\bsrc=)/i.test(html), "no inline script");
  assert.ok(!/<style/i.test(html), "no style element");
  assert.ok(!/\sstyle\s*=/i.test(html), "no style attribute");
  assert.ok(!/\son[a-z]+\s*=/i.test(html), "no inline event handler");
  const dir = join(root, "assets");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".js"))) {
    const js = readFileSync(join(dir, f), "utf8");
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(|srcdoc/.test(js), `${f}: HTML sink`);
    assert.ok(!/setAttribute\(\s*['"]style|\bstyle\s*:/.test(js), `${f}: style attribute`);
  }
  const css = readFileSync(join(dir, "style.css"), "utf8");
  assert.ok(!/@import|url\(\s*['"]?https?:/i.test(css), "no remote stylesheet resources");
});

test("T-066 note checker: sibling hosts of one publisher are one group, and a malformed link cannot count as a source", () => {
  assert.equal(publisherGroup("https://www.mtv.fi/uutiset/x"), publisherGroup("https://www.mtvuutiset.fi/artikkeli/y"));
  assert.equal(publisherGroup("https://www.uusisuomi.fi/a"), publisherGroup("https://www.iltalehti.fi/b"));
  assert.equal(publisherGroup("https://www.taloussanomat.fi/a"), publisherGroup("https://www.hs.fi/b"));
  assert.notEqual(publisherGroup("https://yle.fi/a"), publisherGroup("https://www.hs.fi/b"));
  assert.doesNotThrow(() => publisherGroup("https://"));
  const note = (a, b) => `Area: 1\n\n## Facts\n\n| Fact | Source 1 | Source 2 | Items |\n|---|---|---|---|\n| x | ${a} | ${b} | luku 1 |\n\n## Real people\n\nNone.\n`;
  assert.ok(checkNote(note("https://www.mtv.fi/a", "https://www.mtvuutiset.fi/b")).some((p) => p.includes("[N2]")), "one publisher twice fails");
  assert.deepEqual(checkNote(note("https://yle.fi/a", "https://www.mtv.fi/b")), []);
  assert.doesNotThrow(() => checkNote(note("https://", "https://yle.fi/a")));
});

test("T-067 the validator reports a malformed source link instead of throwing", () => {
  const theme = JSON.parse(readFileSync(join(root, "data/themes/kruunusillat-ratikka-20261107.json"), "utf8"));
  theme.sources = [{ title: "bad", url: "https://" }, { title: "ok", url: "https://yle.fi/a/1" }];
  let problems;
  assert.doesNotThrow(() => (problems = validateTheme(theme, "x.json")));
  assert.ok(problems.some((p) => p.includes("[V2]")));
});

test("T-081 a stem written '=word' matches that whole word only (numerals do not match inside other numerals)", () => {
  const groups = [["=kolme", "=kolmen", "=kolmea", "3"]];
  assert.equal(scoreKeywords("Maksu on kolme euroa.", groups).points, 1);
  assert.equal(scoreKeywords("Kolmen euron maksu.", groups).points, 1);
  assert.equal(scoreKeywords("Maksu on 3 euroa.", groups).points, 1);
  assert.equal(scoreKeywords("Kolmekymmentä euroa.", groups).points, 0);
  assert.equal(scoreKeywords("Kolmetoista euroa.", groups).points, 0);
  assert.equal(scoreKeywords("Maksu on 30 euroa.", groups).points, 0);
  assert.equal(scoreKeywords("Kolme", [["=kolme"]]).points, 1);
  assert.equal(scoreKeywords("Kuusikymmentä", [["=kuusi", "6"]]).points, 0);
  assert.equal(scoreKeywords("Kuusi.", [["=kuusi", "6"]]).points, 1);
  assert.equal(scoreKeywords("Kolme euroa kappaleelta", [["=kolme"], ["euro"]]).points, 1, "a whole-word stem can sit next to ordinary groups");
  assert.equal(scoreKeywords("Kolme euroa", [["=KOLME"]]).points, 1, "case is ignored");
});

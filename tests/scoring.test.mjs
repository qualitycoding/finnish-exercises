// FROZEN — DO NOT MODIFY (plan T-001..T-009; change only through TEST_CHALLENGE.md, see HANDOFF.md)
// Unit tests for assets/scoring.js: the Finnish scoring rules frozen in plan/DECISIONS.md D-004.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalize,
  fold,
  scoreTyped,
  scoreOrder,
  scoreKeywords,
  scoreSimilarity,
  wordSimilarity,
  total,
  shuffle,
  parseMarkup,
  plain,
} from "../assets/scoring.js";

test("T-001 normalize strips punctuation and case but keeps ä, ö and å", () => {
  assert.equal(normalize("  Hei, Äiti!  Öljyä Åkerlundille? "), "hei äiti öljyä åkerlundille");
});

test("T-002 fold maps ä→a, ö→o, å→a only for the half-point check", () => {
  assert.equal(fold("Päätös Åland"), "paatos aland");
});

test("T-003 typed answers: exact, ä/ö slip, one typo in a word of 6+ letters, wrong, empty", () => {
  assert.equal(scoreTyped("Hallituksen", ["hallituksen"]).points, 1);
  assert.equal(scoreTyped("paatos", ["päätös"]).points, 0.5, "only ä/ö wrong");
  assert.equal(scoreTyped("hallituken", ["hallituksen"]).points, 0.5, "one letter missing in a long word");
  assert.equal(scoreTyped("tuli", ["tuuli"]).points, 0, "no typo allowance below 6 letters: vowel length changes meaning");
  assert.equal(scoreTyped("hallitus", ["hallituksen"]).points, 0, "wrong case ending");
  assert.equal(scoreTyped("", ["hallituksen"]).points, 0);
  assert.match(scoreTyped("paatos", ["päätös"]).note, /ä|ö/, "the note names ä/ö");
});

test("T-004 word order ignores case and final punctuation; any listed order counts", () => {
  const accept = ["Hallitus esitti budjetin tiistaina.", "Tiistaina hallitus esitti budjetin."];
  assert.equal(scoreOrder(["Hallitus", "esitti", "budjetin", "tiistaina"], accept).points, 1);
  assert.equal(scoreOrder(["Tiistaina", "hallitus", "esitti", "budjetin"], accept).points, 1);
  assert.equal(scoreOrder(["budjetin", "esitti", "Hallitus", "tiistaina"], accept).points, 0);
});

test("T-005 keyword scoring: inflected forms match by stem; all → 1, at least half → ½, fewer → 0", () => {
  const groups = [["hallitu"], ["päät"], ["vero"]];
  assert.equal(scoreKeywords("Hallitus päätti nostaa veroja.", groups).points, 1);
  assert.equal(scoreKeywords("Hallituksen päätöksen mukaan verot nousevat.", groups).points, 1);
  assert.equal(scoreKeywords("Hallitus päätti jotain.", groups).points, 0.5);
  assert.equal(scoreKeywords("En tiedä.", groups).points, 0);
  assert.deepEqual(scoreKeywords("Hallitus päätti jotain.", groups).missing, ["vero"]);
});

test("T-006 stems of one or two letters match whole words only (ei must not match eilen)", () => {
  assert.equal(scoreKeywords("Eilen satoi.", [["ei"]]).points, 0);
  assert.equal(scoreKeywords("Se ei ole totta.", [["ei"]]).points, 1);
  assert.equal(scoreKeywords("Me ei mennä.", [["me"], ["ei"], ["men"]]).points, 1);
  assert.equal(scoreKeywords("Hän tulee huomenna.", [["hän tulee"]]).points, 1, "multi-word stem");
});

test("T-007 similarity thresholds for dictation and read-aloud", () => {
  assert.equal(wordSimilarity("hallitus esitti budjetin tiistaina", "Hallitus esitti budjetin tiistaina."), 1);
  assert.equal(scoreSimilarity("HALLITUS esitti, budjetin tiistaina eduskunnalle", "Hallitus esitti budjetin tiistaina eduskunnalle.").points, 1);
  assert.equal(scoreSimilarity("hallitus esitti budjetin eduskunnalle", "Hallitus esitti budjetin tiistaina eduskunnalle.").points, 0.5);
  assert.equal(scoreSimilarity("jotain aivan muuta", "Hallitus esitti budjetin tiistaina.").points, 0);
});

test("T-008 total clamps to 0–10 and rounds to half points; shuffle is a deterministic permutation", () => {
  assert.equal(total([1, 1, 0.5, 0.5]), 3);
  assert.equal(total(Array(12).fill(1)), 10);
  assert.equal(total([0.25]), 0.5);
  const a = shuffle([1, 2, 3, 4, 5], 42);
  assert.deepEqual(a, shuffle([1, 2, 3, 4, 5], 42));
  assert.deepEqual(a.slice().sort(), [1, 2, 3, 4, 5]);
});

test("T-009 markup [[shown|gloss|label]] parses labels slangi, puhekieli, idiomi and none; plain() drops markup", () => {
  const parts = parseMarkup("Se on [[tosi|todella · really|puhekieli]] [[siisti|hieno · cool|slangi]] ja [[sana|selitys · gloss]].");
  const terms = parts.filter((p) => p.type === "term");
  assert.equal(terms.length, 3);
  assert.deepEqual(terms.map((t) => t.label), ["puhekieli", "slangi", ""]);
  assert.equal(plain("Se on [[tosi|todella · really|puhekieli]] kallista."), "Se on tosi kallista.");
});

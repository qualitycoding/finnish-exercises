// FROZEN — DO NOT MODIFY (plan T-025, T-027, T-029; amendment D-017 after pre-mortem round 1)
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTyped, scoreKeywords, scoreSpoken } from "../assets/scoring.js";

test("T-025 a listed near-miss (the grammar error a gap tests) scores 0 even when it is one letter away", () => {
  assert.equal(scoreTyped("hallitukset", ["hallituksen"], ["hallitukset"]).points, 0);
  assert.equal(scoreTyped("kaupasta", ["kauppaan"], ["kaupasta", "kaupassa"]).points, 0);
  assert.equal(scoreTyped("hallituken", ["hallituksen"], ["hallitukset"]).points, 0.5, "an unlisted typo keeps the ½ rule (T-003)");
  assert.equal(scoreTyped("hallituksen", ["hallituksen"], ["hallitukset"]).points, 1);
  assert.equal(scoreTyped("hallitukset", ["hallituksen"]).points, 0.5, "the near list defaults to empty");
});

test("T-027 stems of four or more letters also match inside compounds; shorter stems keep their rules", () => {
  assert.equal(scoreKeywords("Tuloverotus kiristyy.", [["vero"], ["kirist"]]).points, 1);
  assert.equal(scoreKeywords("Ruokakaupat aukeavat.", [["kaup"], ["auk"]]).points, 1);
  assert.equal(scoreKeywords("Hakemus hylättiin.", [["kem"]]).points, 0, "three-letter stems match only at word start");
  assert.equal(scoreKeywords("Eilen satoi.", [["ei"]]).points, 0, "two-letter stems match whole words only (T-006)");
});

test("T-029 spoken answers are compared by characters with spaces removed, best alternative wins", () => {
  const target = "Tuloverotus kiristyy ensi vuonna.";
  assert.equal(scoreSpoken(["tulo verotus kiristyy ensi vuonna"], target).points, 1, "split compound");
  assert.equal(scoreSpoken(["jotain aivan muuta tässä"], target).points, 0);
  assert.equal(scoreSpoken(["väärin kuultu lause", "Tuloverotus kiristyy ensi vuonna"], target).points, 1, "best of the alternatives");
  assert.equal(scoreSpoken(["tuloverotus kiristyy"], target).points, 0.5, "about two thirds of the sentence");
  assert.equal(scoreSpoken([], target).points, 0);
  assert.equal(typeof scoreSpoken(["x"], target).sim, "number");
});

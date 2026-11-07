---
id: K-20261107T001100Z-finnish-keyword-stem-matching
statement: Prefix-stem keyword scoring works for Finnish inflection and consonant gradation (hallitu→hallituksen, kaup→kauppa/kaupan), but stems of one or two letters must match whole words, since 'ei' otherwise matches 'eilen'.
status: current
supersedes: []
tags: [subject:answer-scoring, domain:language-learning, tech:javascript, phase:specification]
applies_to_version: version-independent
source: { url: "research/spikes/scoring-finnish/output.txt", doi: "", title: "Planning spike, finnish-exercises", locator: "output rows", accessed: "2026-11-07", tier: 1 }
confidence: verified
derived_from: [C-011]
discovered_by: planner
run: gen-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T00:11:00Z
---
Also: no typo allowance for words under six letters in Finnish, because vowel and consonant length are phonemic (tuli/tuuli, kuka/kukka).

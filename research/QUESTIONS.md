# Question tree (R1) — Engineering branch only (`software`)

- Q1 Speech synthesis: which Finnish voices exist per platform/browser, and what happens with none? → D-007, T-041 (C-001, C-002, C-005, C-006)
- Q2 Speech recognition: is `fi-FI` supported where `SpeechRecognition` exists? → D-006, T-034, T-046 (C-003, C-004)
- Q3 Scoring Finnish: does stem-prefix keyword matching survive case endings and consonant gradation; which stems over-match? → D-004, T-005, T-006 (C-011)
- Q4 Half-point rules: which slips are 'almost right' in Finnish (ä/ö; vowel/consonant length)? → D-004, T-003
- Q5 Register: what distinguishes puhekieli from yleiskieli, so labels and dialogues are right? → A-004, A-005, S-006 (C-007)
- Q6 Sources: may Yle texts be reused? → D-009 (C-008)
- Q7 Tooling: pins exist; can browsers run in the sandbox; node --test invocation → plan/ENVIRONMENT.md (C-009, C-012, C-013)
- Q8 Hosting: Pages enablement path and first-build behaviour → G-PAGES, R-D8 (C-010)
- Q9 Refresh (v3.15): reference REFRESH.md and live-check workflow → D-016
- Pruned: Finnish news topics themselves (content is researched on the day it is written, S-006, so researching it now would be stale).

// STUB (plan 2B.1): every export throws until S-003 implements it. Interface: plan/DECISIONS.md D-004.
const ni = (name) => () => { throw new Error(`not implemented: ${name}`); };
export const normalize = ni("normalize");
export const fold = ni("fold");
export const tokens = ni("tokens");
export const levenshtein = ni("levenshtein");
export const wordSimilarity = ni("wordSimilarity");
export const scoreTyped = ni("scoreTyped");
export const scoreOrder = ni("scoreOrder");
export const scoreKeywords = ni("scoreKeywords");
export const scoreSimilarity = ni("scoreSimilarity");
export const total = ni("total");
export const shuffle = ni("shuffle");
export const parseMarkup = ni("parseMarkup");
export const plain = ni("plain");
export const scoreSpoken = ni("scoreSpoken");

# Deviations

- 2026-11-07 S-000: `git checkout -B impl-... origin/gen-...` failed because the clone has no `origin/gen-...` remote-tracking ref (single-branch fetch). Used `git checkout -B impl-... HEAD` (HEAD = 0979d99, the generation commit). Same content, more reversible.
- 2026-11-07 S-000 step 3b: S-000 reachability. Direct HTTPS to yle.fi, hs.fi, kielitoimistonsanakirja.fi, is.fi, iltalehti.fi, mtvuutiset.fi, valtioneuvosto.fi through the session proxy returns 403 (policy denial; not routed around). WebFetch refused the three root URLs as 'not on the session allowlist'; it may accept URLs returned by WebSearch. Recorded in state.json `hosts`.

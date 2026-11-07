# GATE G-PAGES — enable GitHub Pages and set the default branch

## Evidence
- `main` pushed at `9ce3da9f9e002b3b1fe1ac4aa2e27843b8095ac1` (2026-11-07), identical to the implementation branch head.
- CI run 42370184766 on that commit: `success`.
- `gh api repos/qualitycoding/finnish-exercises` → `default_branch: gen-20261106T235415Z-finnish-current-affairs-exercises`, `has_pages: false`.
- Setting the default branch from the session: HTTP 403 "Repository settings writes are not permitted through this proxy" (D-018 → owner action).

## Questions
1. Open https://github.com/qualitycoding/finnish-exercises/settings and set *General → Default branch → main*.
2. Open https://github.com/qualitycoding/finnish-exercises/settings/pages and set *Build and deployment → Source: Deploy from a branch → Branch: main → / (root) → Save*.
3. Reply `done`.

Response: Done (owner, 2026-11-07 12:52 UK). Verified: default_branch = main, has_pages = true.

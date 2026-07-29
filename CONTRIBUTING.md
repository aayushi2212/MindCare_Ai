# Contributing to MindCare AI

## Commit Message Format (Conventional Commits)
```
feat(auth): add refresh token rotation
fix(chat): handle empty message body
docs(api): update JWT contract
```

## Branching Strategy
- `main` — production only
- `develop` — integration branch
- `feature/<module>/<short-description>` — all feature work

## Pull Request Rules
- Every PR must reference an issue
- Must pass lint and tests in CI
- Requires one reviewer approval before merge

## Code Style
Run `npm run lint` and `npm run format` before pushing.
See `docs/development/CodingStandards.md` for full rules.

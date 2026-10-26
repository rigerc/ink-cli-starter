# Changesets

Each user-facing change gets a small markdown file in this folder describing
the version bump (`patch`, `minor` or `major`) and a one-line summary.

```bash
npm run changeset
```

Commit the generated file with your pull request. After merging to `main`, the
release workflow opens a "version packages" PR that applies all pending
changesets, bumps `package.json` and updates `CHANGELOG.md`. Merging that PR
tags the release and, when enabled, publishes to npm.

See [docs/template/releasing.md](../docs/template/releasing.md) for setup and the opt-in switches.

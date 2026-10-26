# Changesets

Each user-facing change gets a small markdown file in this folder describing
the version bump (`patch`, `minor` or `major`) and a one-line summary.

```bash
npm run changeset
```

Commit the generated file with your pull request. Release automation is
**disabled by default**. In a downstream repository with `RELEASE_ENABLED=true`,
merging to `main` lets the release workflow open a "version packages" PR that
applies pending changesets, bumps `package.json`, and updates `CHANGELOG.md`.
Merging that PR tags the release and, if `NPM_PUBLISH=true`, publishes to npm.

See [docs/template/releasing.md](../docs/template/releasing.md) for setup and the opt-in switches.

# Vendored anti-slop provenance

- Upstream: https://github.com/dmmulroy/anti-slop
- Revision: `13909c9e07590f5a85d93c62712259fe14a883f7` (2026-10-14).
- Exact snapshot source: `skills/install-anti-slop/assets/anti-slop/` at that revision.
- Destination: `tools/oxlint/anti-slop/`.
- Policy: all generic anti-slop rules are enabled through Vite+; the Effect-specific plugin is vendored but not enabled because this project does not directly depend on Effect.
- Dependency version: `oxlint` and `@oxlint/plugins` are pinned to `1.88.0`, matching Vite+ 1.3.0's existing resolved dependencies.
- Local deviations: none to the copied source. The repository retains its existing Vite+ lint rule, formatting choices, and ignore paths.

This is a source copy, not an npm package. Review upstream changes before updating it; preserve local changes and the bundled `vendor/eslint-stylistic/LICENSE` and `UPSTREAM.md`.

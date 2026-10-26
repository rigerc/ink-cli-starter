# Instructions for this Ink CLI application

This repository is a **GitHub template that directly contains the application**. There is no scaffold generator. Read `README.md`, [architecture](docs/architecture.md), [adding a feature](docs/adding-a-feature.md), and [the UI framework guide](docs/ui-framework.md) before making architectural changes.

- `src/cli.tsx` owns CLI flags and decides between headless commands, `--plain` output and an interactive Ink session. `src/app.tsx` owns the providers, the app shell and global navigation.
- Register screens in `src/screens/index.ts`. `ScreenLayout` and the shared `AppShell` are convenient defaults, not mandatory. Choose `layout: 'bare'` on a screen when it needs its own chrome, or `globalKeys: false` for custom keyboard behavior.
- Keep business operations independent of Ink and React. Register headless commands in `src/commands/index.ts`.
- Reuse `src/components/` and `src/hooks/` when helpful, but native Ink components and custom layout are supported. `Panel`, `Card`, `Stack` and `Row` accept standard Ink Box props. `ScreenLayout` can omit a title and customize spacing.
- `useKeymap` supports scoped shortcuts (control > screen > global) when you want coordinated handling. Native Ink `useInput` is also available; avoid conflicting active listeners and use input capture when editing free-form text.
- Use semantic theme tokens; preserve `NO_COLOR`, ASCII rendering, narrow widths, and deterministic `--plain` output. Do not write to stdout while Ink is rendering.
- Preserve the reusable UI components, hooks, themes and standalone demos for apps built from this template; keep example screens optional.
- This project uses **Vite+**, not plain Vite. Prefer the declared npm scripts: `npm run typecheck`, `npm test`, `npm run build`. Run `npm ci` after pulling dependency changes.
- Update documentation and interaction/width regression tests when changing shared framework conventions.
- `npm run lint` runs the Vite+ and vendored anti-slop rules; `npm run check` additionally checks formatting and types. The vendored plugin is under `tools/oxlint/anti-slop/`, excluded from application lint/format checks, and should be updated with its `UPSTREAM.md` provenance in mind.

## Template sync ownership and exclusions

Use an exclusion-based workflow: `.templatesyncignore` defines files owned by the downstream application, while reusable framework files remain eligible for upstream updates. These rules apply to template sync, not to direct edits requested by the user. See [the sync guide](docs/template/syncing.md).

The following paths must never be replaced, removed, or reset to template defaults by an automatic sync. This table is the ownership policy; `.templatesyncignore` must be updated to enforce it before running a sync.

| Ownership                                  | Paths to exclude                                                                                                                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package identity, dependencies and scripts | `package.json`, package-manager lockfiles                                                                                                                                                                         |
| Project documentation and licensing        | `README.md`, `LICENSE*`, `COPYING*`, `CHANGELOG*`                                                                                                                                                                 |
| Agent instructions and sync policy         | `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.templatesyncignore`                                                                                                                                |
| Application composition and behavior       | `src/app.tsx`, `src/cli.tsx`, `src/keys.ts`, `src/screens/`, `src/features/`, `src/commands/`                                                                                                                     |
| Application settings and branding          | `src/config/schema.ts`, `src/lib/config.ts`, `src/theme/defaults.json`, `src/theme/palettes.json`                                                                                                                 |
| Repository automation and release state    | `.github/workflows/`, `.changeset/`                                                                                                                                                                               |
| Application integration tests              | `tests/capture.test.ts`, `tests/cli.test.ts`, `tests/commands.test.ts`, `tests/config-ui.test.tsx`, `tests/consistent-ui.test.tsx`, `tests/screens.test.tsx`, `tests/theme.test.ts`, and downstream feature tests |

Shared components, hooks, config utilities, theme utilities, tooling, and `docs/template/` are eligible for sync unless customized downstream. Eligibility is not permission to overwrite a customization. When a downstream project changes another shared file, add its path to `.templatesyncignore` before the next sync. Keep exclusions for intentionally deleted files so upstream cannot recreate them. Maintain exclusions for whole application directories rather than enumerating their current contents.

When implementing or reviewing template sync:

1. Inspect the candidate changes against the downstream target branch. Identify application-owned paths and downstream customizations before accepting updates.
2. Preserve the downstream `.templatesyncignore`; extend it for newly identified customizations. Do not regenerate it from the upstream copy or remove exclusions to make a sync pass.
3. Apply exclusions before creating the sync commit. Check additions, deletions, and renames as well as modifications; a rename must not change a protected source or destination.
4. Do not rely on automatic conflict resolution to protect customizations. Omit `-X theirs` and keep the guard's `precommit` hook before the action stages files: the action continues after pull failures, so removing the option alone does not stop conflicts. Restore excluded paths first, then stop on remaining unmerged paths. Keep the `prepush` verification that the final commit preserves exclusions.
5. Verify the resulting PR contains no changes to protected paths. Keep upstream dependency, script, workflow, release, and application changes for separate manual review. Never rewrite downstream tests merely to match the starter application.
6. Validate exclusions using Git pathspec semantics, including nested paths and files that do not yet exist. Keep checks that representative shared files remain eligible, and run the relevant checks for accepted framework updates.
7. Document any manual adoption steps. Existing repositories must update their ignore file themselves, and an existing sync branch must be reviewed or regenerated after changing exclusions.

A static ignore file cannot discover arbitrary user edits. Describe this limitation plainly; preserving additional customizations depends on maintaining exclusions and reviewing each sync PR.

The workflow snapshots the downstream base, exclusions, and `scripts/template-sync-guard.mjs` into `RUNNER_TEMP` before pulling. Hooks must execute that saved copy, so incoming template changes cannot replace the guard or its policy during the run. Test changes to the guard with real Git merges, including protected modifications, additions, deletions, and renames across ownership boundaries.

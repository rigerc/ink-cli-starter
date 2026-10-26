---
description: Preserve downstream ownership when implementing or reviewing template sync
paths:
  - .templatesyncignore
  - .github/workflows/template-sync.yml
  - scripts/template-sync-*.mjs
  - tests/template-sync*.test.ts
  - docs/template/syncing.md
---

## Template sync ownership and exclusions

Use an exclusion-based workflow: `.templatesyncignore` defines files owned by the downstream application, while reusable framework files remain eligible for upstream updates. These rules apply to template sync, not to direct edits requested by the user. See the sync guide at `docs/template/syncing.md` (relative to the repository root).

The following paths must never be replaced, removed, or reset to template defaults by an automatic sync. This table is the ownership policy; `.templatesyncignore` must be updated to enforce it before running a sync.

Downstream projects also own `.gitignore`; preserve their ignore rules, including when upstream changes conflict.

Protect nested `AGENTS.md` files with the Git pathspec `:(glob)**/AGENTS.md`, and exclude the generated `opencode.json` instruction loader alongside the agent directories.

| Ownership                                  | Paths to exclude                                                                                                                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package identity, dependencies and scripts | `package.json`, package-manager lockfiles                                                                                                                                                                         |
| Project documentation and licensing        | `README.md`, `LICENSE*`, `COPYING*`, `CHANGELOG*`                                                                                                                                                                 |
| Agent instructions and sync policy         | `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `agentsmesh.yaml`, `agentsmesh.local.yaml`, `.agentsmesh/`, `.claude/`, `.codex/`, `.pi/`, `.opencode/`, `.templatesyncignore`                       |
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
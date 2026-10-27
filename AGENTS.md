<!-- agentsmesh:root-generation-contract:start -->
## AgentsMesh Generation Contract

**NEVER edit generated files** (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.cursor/`, `.github/copilot-instructions.md`, and other tool outputs) — `agentsmesh generate` overwrites them. Edit the canonical source in `.agentsmesh` instead, or `agentsmesh.yaml` to change targets and features, then run `agentsmesh generate`.
<!-- agentsmesh:root-generation-contract:end -->

# Instructions for this Ink CLI application

This repository is a **GitHub template that directly contains the application**. There is no scaffold generator. Read `README.md`, [architecture](docs/architecture.md), [adding a feature](docs/adding-a-feature.md), and [the UI framework guide](docs/ui-framework.md) before making architectural changes.

## Agent configuration

- `agentsmesh.yaml` enables only rules and hooks for Claude Code, Codex CLI, Pi, and OpenCode. Edit canonical files under `.agentsmesh/` or `agentsmesh.yaml`; regenerate tool instructions with `agentsmesh generate` instead of editing generated files.
- For configuration changes, run `agentsmesh lint`, inspect `agentsmesh diff`, then run `agentsmesh generate` and `agentsmesh check`. Review canonical files, generated outputs, and `.agentsmesh/.lock` together.
- Consult the focused rules for the task: [CLI architecture](.agentsmesh/rules/cli-architecture.md), [terminal UI](.agentsmesh/rules/terminal-ui.md), [configuration](.agentsmesh/rules/configuration.md), and [template sync](.agentsmesh/rules/template-sync.md). File globs guide activation; targets that embed rules in shared instructions may expose them more broadly. Apply each rule only to the work it describes.

## Development and validation

- This project uses **Vite+**, not plain Vite. Use the declared npm scripts. Run `npm ci` after pulling dependency changes.
- For code changes, run `npm run check`, `npm run typecheck`, `npm test`, and `npm run build`. For instruction-only changes, validate AgentsMesh and formatting; application tests are needed only if application behavior changes.
- `npm run lint` runs Vite+ and high-confidence anti-slop rules; set `INK_STRICT_LINT=1` to enable the other opinionated anti-slop rules. `npm run check` also checks formatting and types. The vendored plugin is under `tools/oxlint/anti-slop/`, excluded from application lint/format checks, and should be updated with its `UPSTREAM.md` provenance in mind.
- Update documentation and interaction/width regression tests when changing shared framework conventions.

## Downstream ownership

Reuse framework components and demos when helpful. Downstream applications may remove unused screens, components, hooks, themes, and providers. Before any upstream sync, read [the full sync ownership policy](.agentsmesh/rules/template-sync.md), preserve application-owned files, and add customized or intentionally deleted shared paths to `.templatesyncignore`.

<!-- agentsmesh:embedded-rules:start -->
<!-- agentsmesh:embedded-rule:start {"source":"rules/cli-architecture.md","description":"Application boundaries, screen registration, and headless CLI behavior","globs":["src/cli.tsx","src/lib/program.ts","src/lib/render-app.tsx","src/app.tsx","src/screens/**","src/commands/**","src/features/**","tests/cli.test.ts","tests/commands.test.ts","tests/screens.test.tsx","docs/architecture.md","docs/adding-a-feature.md"],"targets":[]} -->
## Application boundaries, screen registration, and headless CLI behavior
# CLI architecture

When adding features or changing application composition, follow `docs/architecture.md` and `docs/adding-a-feature.md` (paths are relative to the repository root).

- `src/cli.tsx` owns process cancellation and error handling. `src/lib/program.ts` owns CLI flags and registry wiring; `src/lib/render-app.tsx` handles `--plain` output and interactive Ink sessions through a lazy import. `src/app.tsx` owns the providers, app shell, and global navigation.
- Keep business models and operations independent of Ink and React, under `src/features/<feature>/` when needed. Screens and headless commands should call the same operation rather than duplicate business logic.
- Register screens in `src/screens/index.ts`; use this registry for screen IDs, tabs, launch targets, and capture IDs. Keep global shortcut definitions in `src/keys.ts`.
- Define headless commands with `defineCommand` and register them in `src/commands/index.ts`; the Commander adapter wires the registry automatically. Keep arguments, options, schemas, and handlers in the definitions so help and completions share one source. Headless commands must work without a TTY and must not import Ink or depend on React rendering.
- Keep `--plain` output deterministic and meaningful as one static frame without keyboard input. Do not rely on effects or delayed async updates for essential plain output; use a headless command when an operation needs to complete before producing output.
- Do not write directly to stdout while Ink is rendering. Use the existing logger for diagnostics and keep headless command output separate from the interactive session.
- When changing flags, command dispatch, or screen registration, update the relevant CLI, command, and screen regression tests and documentation. Preserve both interactive and noninteractive entry paths.
<!-- agentsmesh:embedded-rule:end -->
<!-- agentsmesh:embedded-rule:start {"source":"rules/configuration.md","description":"Configuration validation, precedence, persistence, editor drafts, and migrations","globs":["src/config/**","src/lib/config.ts","src/components/config/**","src/hooks/useConfigDraft.ts","src/screens/Settings.tsx","src/demos/ConfigSetup.tsx","src/cli.tsx","src/commands/doctor.ts","src/theme/resolve.ts","scripts/init-project.mjs","tests/config*.test.*","tests/init-project.test.ts","docs/configuration.md"],"targets":[]} -->
## Configuration validation, precedence, persistence, editor drafts, and migrations
# Configuration

When changing settings, their persistence, or the editor, follow `docs/configuration.md` (relative to the repository root).

- Keep Zod validation in `src/config/schema.ts` aligned with `appConfig.fields`, including field paths, types, defaults, and editor choices. The resolver handles registered fields; registering an environment variable does not create a Commander flag. Wire new CLI options explicitly in `src/cli.tsx` and pass their values into resolution.
- Preserve precedence: project defaults < saved file < environment < CLI flags. Any nonempty `NO_COLOR` forces the mono theme even when a theme flag is present; it does not enable ASCII by itself.
- Keep runtime overrides separate from stored values. Saving a draft must not silently persist environment or CLI overrides. Preserve explicit save/discard in Settings and leave canceled wizard changes unwritten.
- Preserve atomic, validated persistence through the existing store. A missing file uses defaults until a save; malformed JSON, schema-invalid values, and unsupported future versions must remain intact rather than being reset or overwritten automatically.
- Retain valid application-specific JSON keys during edits. Preserve `--config` file overrides and XDG path handling. Renaming project identity must not silently move an existing settings file.
- For breaking stored changes, increment `appConfig.version` and supply migrations indexed by the old numeric version. Reading validates migrations in memory; saving writes the current version. Keep reads free of persistence side effects.
- When changing resolution or storage, cover precedence, invalid-file preservation, extension-key retention, and migration compatibility in `tests/config.test.ts` as relevant. For editor behavior, update `tests/config-ui.test.tsx`; use temporary config paths so verification cannot modify personal settings.
<!-- agentsmesh:embedded-rule:end -->
<!-- agentsmesh:embedded-rule:start {"source":"rules/template-sync.md","description":"Preserve downstream ownership when implementing or reviewing template sync","globs":[".templatesyncignore",".github/workflows/template-sync.yml","scripts/template-sync-*.mjs","tests/template-sync*.test.ts","docs/template/syncing.md"],"targets":[]} -->
## Preserve downstream ownership when implementing or reviewing template sync
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
<!-- agentsmesh:embedded-rule:end -->
<!-- agentsmesh:embedded-rule:start {"source":"rules/terminal-ui.md","description":"Ink layout, keyboard ownership, async states, themes, and terminal regressions","globs":["src/app.tsx","src/cli.tsx","src/keys.ts","src/components/**","src/hooks/**","src/screens/**","src/demos/**","src/theme/**","src/lib/terminal.ts","tests/collections.test.tsx","tests/consistent-ui.test.tsx","tests/keymap-routing.test.tsx","tests/keys.test.ts","tests/screens.test.tsx","tests/stepper.test.tsx","tests/theme.test.ts","docs/ui-framework.md"],"targets":[]} -->
## Ink layout, keyboard ownership, async states, themes, and terminal regressions
# Terminal UI

When changing terminal presentation or interaction, consult `docs/ui-framework.md` (relative to the repository root).

- Reuse `src/components/` and `src/hooks/` when helpful. Native Ink `Box`, `Text`, and `useInput` and custom layouts are supported; shared primitives and the app shell are optional defaults.
- `ScreenLayout` can omit a title and customize spacing. `Panel`, `Card`, `Stack`, and `Row` accept standard Ink Box props. Preserve this flexibility when changing shared components.
- Choose `layout: 'bare'` for a screen with its own chrome, or `globalKeys: false` for custom keyboard behavior. These options are independent; a bare screen still receives providers. When disabling navigation or quit shortcuts, provide a way to leave the screen or document Ctrl+C.
- `useKeymap` routes one matching shortcut with priority control > screen > global. Set `isActive` on controls according to focus. Native `useInput` listeners are separate from keymap routing; avoid competing active listeners.
- Capture input with `useInputCapture(isEditing)` while a custom free-form editor is active, then release it on completion or cancellation. `SearchSelect` already captures input while active; deactivate or unmount it when closed. Keep one free-form text editor active at a time.
- If a child field owns Enter/Escape inside a `Stepper`, disable the stepper's keyboard navigation while that field owns input. Footer `hints` describe shortcuts; register their handlers separately.
- Start async operations from events or effects, never during render. When async work is present, show intentional loading, empty, error, and success states and ignore results superseded by newer requests or unmounts. `useAsync` and `ScreenState` provide reusable defaults.
- Use semantic theme tokens and theme-provided symbols. Preserve `NO_COLOR`, mono themes, and ASCII glyph and border fallbacks. Communicate status through text or symbols as well as color.
- Use flexible Ink layouts and `useTerminalSize()` for narrow terminals. Wrap or truncate unbounded text, including long paths and wide Unicode. For layout changes, check relevant views around 40, 80, and 120 columns and under mono/ASCII settings.
- For keyboard changes, use interaction tests to verify input capture pauses global shortcuts, closing an editor restores them, inactive controls ignore input, and one keypress triggers one action. For layout changes, use deterministic width-specific rendering tests. Preserve meaningful `--plain` output alongside interactive behavior.
<!-- agentsmesh:embedded-rule:end -->
<!-- agentsmesh:embedded-rules:end -->
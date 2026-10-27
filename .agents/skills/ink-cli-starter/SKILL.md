---
name: ink-cli-starter
description: >-
  Customize, build, and maintain CLIs based on the ink-cli-starter GitHub
  template (Ink 8, React 19, TypeScript, Commander, and Vite+). Use when
  initializing a template copy, adding a screen or headless command,
  extending settings or terminal UI, testing CLI behavior, or syncing
  upstream changes.
---

# Work with Ink CLI Starter

This is a GitHub template that contains the application itself, not a
scaffolding generator. Adapt the copied source rather than looking for a
separate generated app. Follow the repository's `AGENTS.md` and relevant
focused rules; this skill is a task workflow, not an override.

## Orient before editing

- Read `README.md`, `docs/architecture.md`, and
  `docs/adding-a-feature.md`. For UI work, read `docs/ui-framework.md`.
- Check existing entry points and registries before introducing new abstractions:
  `src/cli.tsx`, `src/app.tsx`, `src/screens/index.ts`, and
  `src/commands/index.ts`.
- Reuse local `src/components/`, `src/hooks/`, and `src/theme/` where
  appropriate. They are optional defaults, not a required design system.

## Start a project from this template

1. In a **new copy** of the GitHub template, use Node.js 22.12+ and run
   `npm ci`.
2. Preview identity changes with
   `npm run init:project -- --name my-cli --description "My CLI" --dry-run`.
   Then run the command without `--dry-run` when the identity is correct.
   Do not reinitialize an already customized project without checking its
   package and config identity. See `docs/template/customization.md`.
3. Run `npm run dev` in a terminal. For deterministic noninteractive output,
   run `npm run dev -- --plain`; for headless diagnostics, run
   `npm run dev -- doctor --json`.

## Add or modify functionality

1. Put domain models and operations in `src/features/<feature>/` when
   needed. Keep them independent of Ink and React so screens and headless
   commands can share them.
2. Add interactive screens under `src/screens/` and register them in
   `src/screens/index.ts`. Registration controls screen IDs, navigation,
   `--screen`, and capture targets. For a custom UI, consider
   `layout: 'bare'`; `globalKeys: false` separately disables global keys.
3. For noninteractive operations, define a command with `defineCommand` and add
   it to `src/commands/index.ts`. Commander wiring and completions derive from
   the registry; no CLI entry-point edit is needed. Headless commands must not
   depend on a TTY, import Ink, or require React rendering.
4. Use scoped `useKeymap` or `useAction` for keyboard actions. Ensure a
   single input owner for text editing, and release input capture on exit.
   Use `useAsync` / `ScreenState` for loading, empty, error, and success
   states. Read `docs/ui-framework.md` before changing focus or layouts.
5. For settings changes, read `docs/configuration.md`. Keep
   `src/config/schema.ts`, registered fields, CLI options, validation, and
   persistence consistent; preserve precedence (defaults < saved file <
   environment < CLI) and leave invalid saved files intact.
6. Preserve `--plain` output, `NO_COLOR`, ASCII/mono fallbacks, and narrow
   terminal behavior. Keep Ink-rendered output separate from headless stdout.
   Add or update tests under `tests/` for changed behavior.

## Validate changes

Run the project's scripts rather than substituting plain Vite commands:

```bash
npm run check
npm run typecheck
npm test
npm run build
```

For CLI behavior changes, also smoke-test `--help`, `--plain`, and
`doctor --json`. For layout and keyboard changes, test interactive input,
mono/ASCII output, and terminal widths around 40, 80, and 120 columns.
For instruction-only edits, application tests are optional; validate the
instruction format and related tool configuration.

## Respect agent configuration and downstream ownership

- AgentsMesh canonical instructions live in `.agentsmesh/`. Do not edit
  generated `AGENTS.md`, `CLAUDE.md`, or tool-specific rule projections;
  use `agentsmesh lint`, `agentsmesh diff`, `agentsmesh generate`, and
  `agentsmesh check` when changing their sources. This skill is maintained
  directly under `.agents/skills/`, outside AgentsMesh generation.
- Read `docs/template/syncing.md` and `.templatesyncignore` before
  syncing upstream. Syncing is opt-in; preserve downstream-owned app code,
  package identity, `.gitignore`, and agent instructions and skills.
  Add customized or intentionally removed shared files to
  `.templatesyncignore` before a sync. Review every sync PR.

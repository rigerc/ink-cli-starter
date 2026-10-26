---
description: Application boundaries, screen registration, and headless CLI behavior
globs:
  - 'src/cli.tsx'
  - 'src/app.tsx'
  - 'src/screens/**'
  - 'src/commands/**'
  - 'src/features/**'
  - 'tests/cli.test.ts'
  - 'tests/commands.test.ts'
  - 'tests/screens.test.tsx'
  - 'docs/architecture.md'
  - 'docs/adding-a-feature.md'
---

# CLI architecture

When adding features or changing application composition, follow `docs/architecture.md` and `docs/adding-a-feature.md` (paths are relative to the repository root).

- `src/cli.tsx` owns CLI flags and decides between headless commands, `--plain` output, and an interactive Ink session. `src/app.tsx` owns the providers, app shell, and global navigation.
- Keep business models and operations independent of Ink and React, under `src/features/<feature>/` when needed. Screens and headless commands should call the same operation rather than duplicate business logic.
- Register screens in `src/screens/index.ts`; use this registry for screen IDs, tabs, launch targets, and capture IDs. Keep global shortcut definitions in `src/keys.ts`.
- Register headless commands in `src/commands/index.ts` and wire their Commander subcommands in `src/cli.tsx`. Headless commands must work without a TTY and must not import Ink or depend on React rendering.
- Keep `--plain` output deterministic and meaningful as one static frame without keyboard input. Do not rely on effects or delayed async updates for essential plain output; use a headless command when an operation needs to complete before producing output.
- Do not write directly to stdout while Ink is rendering. Use the existing logger for diagnostics and keep headless command output separate from the interactive session.
- When changing flags, command dispatch, or screen registration, update the relevant CLI, command, and screen regression tests and documentation. Preserve both interactive and noninteractive entry paths.

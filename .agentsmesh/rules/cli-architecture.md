---
description: Native Ink entry point, CLI commands, and headless execution
globs:
  - 'src/app.tsx'
  - 'src/cli.tsx'
  - 'src/lib/program.ts'
  - 'src/lib/render-app.tsx'
  - 'src/commands/**'
  - 'src/features/**'
  - 'tests/app.test.tsx'
  - 'tests/cli.behavior.test.ts'
  - 'tests/headless-commands.test.ts'
  - 'docs/architecture.md'
  - 'docs/adding-a-feature.md'
---

# CLI architecture

- `src/cli.tsx` handles signals, logging and process errors.
- `src/lib/program.ts` registers Commander options and headless commands.
- `src/lib/render-app.tsx` selects a native Ink session or one plain frame.
- `src/app.tsx` is a single native Ink component, without UI framework wrappers.
- Put reusable domain operations in `src/features/`, not under Ink.
- Declare headless commands with `defineCommand` and register them in
  `src/commands/index.ts`; their output must remain usable without a TTY.
- Keep `--plain` deterministic, with no keyboard or asynchronous dependency.
- Do not write directly to stdout while Ink owns the terminal.
- Cover flag changes, plain rendering and interactive exit behavior in tests.

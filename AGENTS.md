# Instructions for this Ink CLI application

This repository uses a **native Ink application**, not a custom UI framework.
Edit `src/app.tsx` directly. Preserve independent headless commands and
`--plain` output. For details, read `README.md`,
`docs/architecture.md`, and `docs/adding-a-feature.md`.

Use `npm run check`, `npm run typecheck`, `npm test`, and `npm run build`
to validate source changes. Canonical agent rules live in `.agentsmesh/rules/`;
regenerate projected instructions with `agentsmesh generate`.

## CLI architecture

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

## Native Ink

- Use Ink's `Box`, `Text`, `useInput`, `useApp` and other native APIs.
  The starter does not supply a shell, component kit, router or themes.
- Add application-specific components and input arbitration only when needed.
- Ensure pressing `q` or Escape exits the sample app and Ctrl-C still cleans
  up the terminal. Respect the alternate-screen and screen-reader options.
- Interactive behavior belongs in the Ink app; `--plain` must produce one
  meaningful static frame without effects or keyboard input.
- Keep wide or unbounded text readable in small terminals; use text as well
  as color for state. Test narrow widths and PTY cleanup when changing input.

## Configuration

- Keep the Zod schema and `appConfig.fields` in sync.
- The starter has one sample `label` field. There is no interactive settings
  screen or custom configuration UI.
- Preserve precedence: defaults < stored JSON < environment overrides.
  An application may explicitly add CLI flags if it needs them.
- Retain atomic writes, safe XDG config paths, extension keys, and validation.
  Do not reset malformed or unsupported future-version files automatically.
- `--config` selects the path. Package identity changes must not silently
  move existing user data.
- Add versioned migrations for breaking settings changes and cover invalid
  files, precedence, persistence and migrations with isolated tests.

## Template sync

Retain downstream ownership of `.templatesyncignore`, package metadata,
application entry points, commands, settings, tests and release state.
Review all incoming changes before merging a template-sync PR.

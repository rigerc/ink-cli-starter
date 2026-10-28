# Source instructions

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

# Native Ink terminal UI

- Use Ink's `Box`, `Text`, `useInput`, `useApp` and other native APIs.
  The starter does not supply a shell, component kit, router or themes.
- Add application-specific components and input arbitration only when needed.
- Ensure pressing `q` or Escape exits the sample app and Ctrl-C still cleans
  up the terminal. Respect the alternate-screen and screen-reader options.
- Interactive behavior belongs in the Ink app; `--plain` must produce one
  meaningful static frame without effects or keyboard input.
- Keep wide or unbounded text readable in small terminals; use text as well
  as color for state. Test narrow widths and PTY cleanup when changing input.


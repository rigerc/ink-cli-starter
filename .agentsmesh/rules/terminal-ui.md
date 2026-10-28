---
description: Direct Ink rendering, input handling and terminal tests
globs:
  - 'src/app.tsx'
  - 'src/lib/render-app.tsx'
  - 'src/lib/terminal.ts'
  - 'tests/app.test.tsx'
  - 'tests/terminal-pty.test.ts'
---

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

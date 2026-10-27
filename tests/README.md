# Testing strategy

This suite intentionally replaces the former tests instead of carrying forward their fixture and assertion patterns.

- **CLI behavior:** Spawn the real CLI in a noninteractive process to verify arguments, output, and exit codes.
- **Configuration:** Use a unique temporary file for each scenario. Verify precedence, migration, and preservation of malformed files.
- **Ink runtime and input:** Exercise screen composition and use ink-testing-library to send keys; always unmount test instances.
- **Template lifecycle:** Copy only the required inputs into disposable workspaces before exercising the initializer and checks.
- **Sync safety:** Use a local throwaway Git repository; test preserved downstream ownership and conflict rejection without network access.
- **Release and theme tooling:** Exercise safe read-only paths and error handling without editing the source palettes.

Run the full suite with `npm test`. Run `npm run check`, `npm run typecheck`, and `npm run build` before merging. No test should depend on the user's actual config files, network connectivity, published GitHub state, or an existing interactive TTY. PTY tests create and dispose their own terminal.

For new behavior, favor assertions on observable contracts over snapshots and implementation details. Restore environment and filesystem state after each test.

`npm run test:coverage` instruments source files and enforces the thresholds in
`vite.config.ts` (60% statements, 50% branches, 58% functions, 63% lines). These establish the measured whole-source baseline without excluding CLI files. Subprocess execution, including the CLI entry, is verified by
behavior and PTY tests; that child-process work does not count toward in-process
coverage. `npm run test:pty` checks startup, navigation, Ctrl-C, alternate-buffer
restoration, screen-reader output and (on Unix) SIGTERM. Windows uses ConPTY;
Unix signal delivery is intentionally covered only on Unix.

The CI matrix runs Node 22 and 24 on Linux/macOS/Windows. Completion scripts are
syntax-checked when their shell is installed; Linux CI installs all three shells.
Updater tests inject responses and never access the network. Log tests use
isolated paths and verify credential redaction and size limits.

# Testing strategy

This suite intentionally replaces the former tests instead of carrying forward their fixture and assertion patterns.

- **CLI behavior:** Spawn the real CLI in a noninteractive process to verify arguments, output, and exit codes.
- **Configuration:** Use a unique temporary file for each scenario. Verify precedence, migration, and preservation of malformed files.
- **Ink runtime and input:** Exercise screen composition and use ink-testing-library to send keys; always unmount test instances.
- **Template lifecycle:** Copy only the required inputs into disposable workspaces before exercising the initializer and checks.
- **Sync safety:** Use a local throwaway Git repository; test preserved downstream ownership and conflict rejection without network access.
- **Release and theme tooling:** Exercise safe read-only paths and error handling without editing the source palettes.

Run the full suite with `npm test`. Run `npm run check`, `npm run typecheck`, and `npm run build` before merging. No test should depend on the user's actual config files, network connectivity, published GitHub state, or interactive TTY.

For new behavior, favor assertions on observable contracts over snapshots and implementation details. Restore environment and filesystem state after each test.

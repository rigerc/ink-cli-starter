# Configuration instructions

# Configuration

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

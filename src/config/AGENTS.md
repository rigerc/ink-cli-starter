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
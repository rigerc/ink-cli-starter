# Configuration guide

The application stores a small, versioned JSON document and resolves settings from defaults, that file, environment variables and CLI flags. The default fields are `theme` and `ascii`; applications created from this template can extend both the schema and editor metadata. This guide describes the shipped implementation in `src/config/`, `src/lib/config.ts`, `src/screens/Settings.tsx` and `src/cli.tsx`.

## Set up or inspect settings

```bash
npm ci
npm run dev -- --setup                 # Interactive, standalone wizard (TTY required)
npm run dev -- --screen settings       # Embedded Settings editor (TTY required)
npm run dev -- doctor --json          # Validate runtime and config without a TTY
npm run dev -- --config ./local.json --setup
npm run dev -- doctor --config ./local.json --json
```

A missing file is normal: built-in defaults apply until the first save. `--setup` does **not** work with `--plain`, redirected output or `CI` mode. The `doctor` command works without a terminal and reports the resolved file path, whether it exists, and whether it is valid. For interactive settings, start the normal app, navigate to **Settings**, and choose the editor or press `w` for the guided wizard.

### Default file location

| Situation                                         | Path                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| Unmodified `ink-kit` project on Unix-like systems | `~/.config/ink-kit/config.json`                                           |
| `XDG_CONFIG_HOME=/some/base`                      | `/some/base/ink-kit/config.json`                                          |
| Initialized as `my-cli`                           | `~/.config/my-cli/config.json` (or `$XDG_CONFIG_HOME/my-cli/config.json`) |
| Explicit `--config ./local.json`                  | `local.json` in the current working directory                             |

`--config` accepts a file path, not a directory. Relative paths resolve against the process's working directory. The default `APP_NAME` is derived from the package executable name in `src/lib/identity.ts`; `init:project` updates package and lockfile metadata only. On changing identity, old config files are **not moved**: copy the JSON intentionally if you want to retain settings, or continue passing the old file to `--config`. The values shown above describe the default Unix/XDG path construction implemented by the application.

### JSON format

A valid example (create the parent directory first if editing manually):

```json
{
  "version": 1,
  "theme": "dark",
  "ascii": true
}
```

- `version` is an optional positive integer; the current schema version is `1`. Files without a version are treated as older documents when read. Do not set a version newer than the application supports.
- `theme` is optional: `"auto"`, `"dark"`, `"light"`, `"contrast"` or `"mono"`.
- `ascii` is an optional boolean (`true` or `false`, **not** the strings `"true"`/`"false"`).
- Additional application-specific JSON keys survive normal edits, provided their values are valid JSON data and the declared schema accepts them. The shipped Zod schema is a `z.looseObject`.

The application uses `conf` to atomically replace a **validated** document on save, with restricted file permissions where supported. It does not silently erase malformed JSON, arrays used as the root, schema-invalid values or unsupported future versions. Back up and fix the file yourself if validation fails; the Settings editor/wizard cannot repair an invalid document in place.

## Headless settings

```bash
npm run dev -- config path
npm run dev -- config list --json
npm run dev -- config get theme
npm run dev -- config get theme --stored --json
npm run dev -- config set theme light
npm run dev -- config set ascii true --quiet
printf 'true\n' | npm run dev -- config set ascii -
npm run dev -- config reset ascii
npm run dev -- config reset --config ./local.json
```

`get` and `list` show effective registered values and, in JSON/list output, their
sources. Theme resolution includes `auto` detection and `NO_COLOR`/`--no-color`.
`--stored` reads saved overrides only; absent values have source `unset` and JSON
value `null`. Reads do not create a file or persist migrations. `path` works even
when the selected file is invalid.

`set` accepts plain strings for text/select fields, JSON booleans for toggles,
JSON numbers for number fields, and JSON string arrays for multi-select fields.
`-` reads the value from stdin (up to 1 MiB). Unknown fields and invalid values
fail without writing. The complete resulting document is schema-validated.

`reset [key]` removes the selected registered override, or all registered
overrides if no key is given. It preserves extension keys and records the current
schema version. It refuses invalid files, including unsupported future versions;
it is not a file-repair operation. All mutations use atomic validated writes,
and neither `set` nor `reset` persists environment or launch overrides.

## Precedence and runtime behavior

For registered settings, the general order is **CLI flag > environment > saved file > project default**. A runtime override is not automatically written back to the saved file.

| Setting          | CLI                        | Environment                                          | Saved key          | Project fallback                             |
| ---------------- | -------------------------- | ---------------------------------------------------- | ------------------ | -------------------------------------------- |
| Theme            | `--theme light`            | `INK_KIT_THEME=light` (renamed after init)           | `"theme": "light"` | `src/theme/defaults.json` (`auto` initially) |
| ASCII symbols    | `--ascii` (enables)        | `INK_KIT_ASCII=1` (legacy `CLI_ASCII` alias)         | `"ascii": true`    | `false`                                      |
| Config file path | `--config ./settings.json` | `XDG_CONFIG_HOME` selects the default base directory | —                  | `~/.config/<app-name>/config.json`           |

**Special case:** any nonempty `NO_COLOR` forces the `mono` theme even if `--theme` is present; `NO_COLOR=0` still counts as set. `NO_COLOR` does not itself select ASCII glyphs. `--ascii` can enable ASCII, but the command has no corresponding `--no-ascii` flag. `auto` theme uses a best-effort terminal light/dark check (`COLORFGBG`, defaulting to dark). Unknown theme overrides are ignored by theme selection; use a documented theme value.

```bash
INK_KIT_THEME=contrast npm run dev -- --plain
NO_COLOR=1 npm run dev -- --plain
INK_KIT_ASCII=1 npm run dev -- --screen home
npm run dev -- --theme light --ascii --plain
```

After `npm run init:project -- --name my-cli`, use `MY_CLI_THEME`, not `INK_KIT_THEME`; `MY_CLI_ASCII` replaces `INK_KIT_ASCII`; `CLI_ASCII` remains a lower-priority compatibility alias and `NO_COLOR` remains unchanged. `npm run theme:default -- light` modifies the **project's source-level default**, not a user's JSON file. `npm run theme:token -- dark primary '#ff80aa'` edits theme palette source; neither script is a substitute for saving runtime settings.

## Using the Settings screen and wizard

In an interactive terminal, navigate with Tab / Shift+Tab or a numbered screen shortcut, or launch `--screen settings` directly. On the default Settings screen:

1. Use `↑`/`↓` to select a section, then Enter to edit it. The starter has one **Appearance** section.
2. In the editor, use `↑`/`↓` to select a field, then Enter to toggle or edit. Choose an option with arrows and Enter; Escape backs out.
3. Press Escape to return to the section list; press `s` to **save** the whole draft or `d` to **discard** unsaved changes. A toast confirms saving; relaunch to apply saved settings to the current view.
4. Press `w` from the section list to open the guided wizard. From a wizard section, `n` advances to review, where confirmation saves. Canceling the wizard leaves its changes unwritten.

The editor shows a field's value source (`file`, `environment`, `flag`) when it is not the default. Editing a value does not defeat a higher-priority environment variable or launch flag. If a runtime theme appears unchanged after saving, relaunch without conflicting overrides.

## Extend configuration in an application

The store, resolver and editor have distinct responsibilities:

| File                       | What to change                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/config/schema.ts`     | Define validation in `configSchema`, plus UI field metadata in `appConfig.fields`                    |
| `src/config/definition.ts` | Existing field types (`toggle`, `select`, `text`, `number`, `multi`), paths and visibility contracts |
| `src/config/resolver.ts`   | Resolve only **registered fields** across stored file, environment and supplied flags                |
| `src/config/store.ts`      | Persistence, JSON validation, version handling, deep merging and optional migrations                 |
| `src/lib/config.ts`        | App-specific store instance, `APP_NAME`, compatibility helpers                                       |
| `src/components/config/`   | Shared wizard and editor UI                                                                          |

For example, to offer a simple endpoint setting, add to the `z.looseObject` schema in `src/config/schema.ts`:

```ts
endpoint: z.string().optional(),
```

Then append a corresponding entry to `appConfig.fields`:

```ts
{
  path: 'endpoint',
  label: 'API endpoint',
  section: 'Connection',
  kind: 'text',
  description: 'Base URL used by the application.',
  defaultValue: 'https://example.invalid',
  env: 'MY_CLI_ENDPOINT',
},
```

These are **snippets** to insert inside the existing schema/fields, not complete replacement files. The new field appears in the editor automatically; application code still must read and use its resolved value. Do not assume registering an `env` field automatically adds a Commander CLI option: add any new flag in `src/cli.tsx`, validate it, and pass it into `resolveConfig()` yourself. Dot-separated paths (for example `network.timeout`) are supported for nested object fields, not array indices. For validation, prefer keeping field metadata defaults and schema types aligned.

For breaking stored changes, increment `appConfig.version` and provide `migrations` indexed by the **old numeric version**. The store checks versions and validates migrated documents in memory, but reads alone do not persist migrations; saving writes the current version. Include migration/compatibility cases in `tests/config.test.ts`.

## Troubleshooting

| Symptom                                            | Check / remedy                                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--setup` reports that a TTY is required           | Run in an interactive terminal, without `--plain` or `CI`; otherwise edit JSON directly                                                              |
| Config won't open or save                          | Run `npm run dev -- doctor --config ./local.json --json`; check reported path, JSON syntax, field types and version; preserve a copy before editing  |
| Settings seem ignored                              | Check `--config` path, `NO_COLOR`, `INK_KIT_THEME`/renamed theme variable, `INK_KIT_ASCII`/legacy `CLI_ASCII` and explicit flags; restart after save |
| Settings disappeared after project rename          | Config is under the new command directory; migrate the old JSON intentionally, or pass `--config`                                                    |
| Invalid schema after adding a field                | Ensure `configSchema` and `appConfig.fields` agree and update any data consumers; run typechecking and config tests                                  |
| Don't want personal settings affecting screenshots | Use the capture runner in [recording](recording.md); it isolates settings and forces selected theme/width                                            |

Run `npm run typecheck && npm test` after changes. For a focused addition, see [adding a feature](adding-a-feature.md); for layout and keyboard conventions, see the [UI guide](ui-framework.md).

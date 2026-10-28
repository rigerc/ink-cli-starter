# Configuration

The headless configuration feature is separate from the Ink UI. The starter
includes just one example field: `label`, a nonempty string rendered as the
application heading. There is no Settings screen or interactive configuration
wizard.

## Commands

```sh
npm run dev -- config list --json
npm run dev -- config get label
npm run dev -- config set label "Example CLI"
npm run dev -- config get label --stored --json
npm run dev -- config reset label
npm run dev -- config path
npm run dev -- --plain
```

The `--config <path>` global option selects a specific JSON file, and
`<PREFIX>_LABEL` (for an unmodified starter: `INK_KIT_LABEL`) overrides the
saved field. Resolution precedence is default < stored JSON < environment.
Set/remove writes only affect the chosen config file; environment variables
never get persisted. A new config file is not created until a write.

The default path is `~/.config/<cli-name>/config.json`, or
`$XDG_CONFIG_HOME/<cli-name>/config.json`. Renaming the package's executable
with `init:project` changes its default path without moving an old file.
For the default package, this is `~/.config/ink-kit/config.json`.

## Extending settings

Edit `src/config/schema.ts` to declare Zod fields and matching
`appConfig.fields` metadata. Read the resolved settings before rendering
if the Ink app needs them. `src/config/resolver.ts` supports typed defaults
and environment overrides, while `src/config/store.ts` handles validation,
safe atomic writes, extension keys and versioned migrations.

Corrupt JSON, invalid field values and unsupported future versions are
reported rather than silently cleared. Use `config reset` only with valid
files; reset preserves unrelated extension keys. Read operations do not write.

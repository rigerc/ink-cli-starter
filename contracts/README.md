# CLI contracts

These JSON Schemas describe three existing machine-readable boundaries of the starter application.

| File | Producer / consumer | Canonical source |
| --- | --- | --- |
| `config.schema.json` | Saved application configuration (`--config`, XDG config path) | `src/config/schema.ts` |
| `example-items.schema.json` | JSON array accepted by `example -` and emitted by `example --json` | `src/features/example/items.ts` |
| `doctor-report.schema.json` | Object emitted by `doctor --json` | `src/commands/doctor.ts` |

Generate from the Zod schemas (do not hand-maintain the JSON):

```bash
npm ci
npm run contracts:generate
npm run contracts:check
```

All files target JSON Schema Draft 2020-12. The generator's `--check` mode exits nonzero if any generated schema is missing or no longer matches its Zod definition.

The configuration schema intentionally permits extension properties, matching `z.looseObject()`. Runtime configuration also enforces application-specific version/migration policies that a JSON Schema alone cannot model. `example-items.schema.json` is a JSON array contract, not a single item. Unknown fields in example items and doctor reports are stripped by Zod's object parsing rather than rejected; the generated schemas describe the parsed output, so `additionalProperties: false` is expected.

This starter does not expose HTTP endpoints. These schemas cover selected data boundaries, not every command, text output, exit code or runtime process behavior. Add a Zod source schema and a corresponding generator entry when a downstream CLI introduces another JSON contract.

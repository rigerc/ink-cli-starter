# Generated Ink CLI starter reference

> Automatically derived from source by `npm run update:skill`. Do not edit manually.
> The workflow recommendations in `SKILL.md` remain human-maintained.

**Package:** `ink-kit` · **Version:** `0.1.0` · **Node:** `>=22.12.0`

**Runtime dependencies:** `ink ^8.0.0`, `react ^19.3.1`, `zod ^4.6.7`, `@commander-js/extra-typings ^15.0.0`

## Command extension exports

| Export | Defined in |
| --- | --- |
| `CommandContext` | [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |
| `CommandOption` | [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |
| `GlobalOptions` | [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |
| `RegisteredCommand` | [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |
| `defineCommand` | [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |
| `defineCommandGroup` | [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |
| `globalOptions` | [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |

## Command modules

| File |
| --- |
| [`src/commands/completion.ts`](../../../../src/commands/completion.ts) |
| [`src/commands/config.ts`](../../../../src/commands/config.ts) |
| [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |
| [`src/commands/doctor.ts`](../../../../src/commands/doctor.ts) |
| [`src/commands/example.ts`](../../../../src/commands/example.ts) |
| [`src/commands/index.ts`](../../../../src/commands/index.ts) |

## Application entry points

| File |
| --- |
| [`src/cli.tsx`](../../../../src/cli.tsx) |
| [`src/app.tsx`](../../../../src/app.tsx) |
| [`src/lib/program.ts`](../../../../src/lib/program.ts) |
| [`src/config/schema.ts`](../../../../src/config/schema.ts) |
| [`src/config/definition.ts`](../../../../src/config/definition.ts) |
| [`src/commands/definition.ts`](../../../../src/commands/definition.ts) |

## Available npm scripts

| Command | package.json definition |
| --- | --- |
| `npm run build` | `vp pack` |
| `npm run changeset` | `changeset` |
| `npm run check` | `npm run check:template && vp check` |
| `npm run check:agents` | `node scripts/update-agents-md.mjs --check` |
| `npm run check:skill` | `node scripts/sync-skill.mjs --check` |
| `npm run check:template` | `node scripts/check-template.mjs` |
| `npm run dev` | `tsx src/cli.tsx` |
| `npm run init:project` | `node scripts/init-project.mjs` |
| `npm run lint` | `vp lint` |
| `npm run prepare` | `vp config` |
| `npm run release` | `npm run build && changeset publish` |
| `npm run release:tag` | `changeset git-tag` |
| `npm run start` | `node dist/cli.js` |
| `npm run test` | `vp test run` |
| `npm run test:coverage` | `vp test run --coverage` |
| `npm run test:pty` | `vp test run tests/terminal-pty.test.ts` |
| `npm run typecheck` | `node node_modules/typescript/bin/tsc --noEmit` |
| `npm run update:agents` | `node scripts/update-agents-md.mjs --write` |
| `npm run update:skill` | `node scripts/sync-skill.mjs --write` |
| `npm run version-packages` | `changeset version && npm install --package-lock-only` |

This reference describes current source availability, not required architecture for downstream applications.

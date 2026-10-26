---
root: true
description: Project instructions for the Ink CLI template
---

# Instructions for this Ink CLI application

This repository is a **GitHub template that directly contains the application**. There is no scaffold generator. Read `README.md`, [architecture](../../docs/architecture.md), [adding a feature](../../docs/adding-a-feature.md), and [the UI framework guide](../../docs/ui-framework.md) before making architectural changes.

## Agent configuration

- `agentsmesh.yaml` enables only rules and hooks for Claude Code, Codex CLI, Pi, and OpenCode. Edit canonical files under `.agentsmesh/` or `agentsmesh.yaml`; regenerate tool instructions with `agentsmesh generate` instead of editing generated files.
- For configuration changes, run `agentsmesh lint`, inspect `agentsmesh diff`, then run `agentsmesh generate` and `agentsmesh check`. Review canonical files, generated outputs, and `.agentsmesh/.lock` together.
- Consult the focused rules for the task: [CLI architecture](./cli-architecture.md), [terminal UI](./terminal-ui.md), [configuration](./configuration.md), and [template sync](./template-sync.md). File globs guide activation; targets that embed rules in shared instructions may expose them more broadly. Apply each rule only to the work it describes.

## Development and validation

- This project uses **Vite+**, not plain Vite. Use the declared npm scripts. Run `npm ci` after pulling dependency changes.
- For code changes, run `npm run check`, `npm run typecheck`, `npm test`, and `npm run build`. For instruction-only changes, validate AgentsMesh and formatting; application tests are needed only if application behavior changes.
- `npm run lint` runs Vite+ and high-confidence anti-slop rules; set `INK_STRICT_LINT=1` to enable the other opinionated anti-slop rules. `npm run check` also checks formatting and types. The vendored plugin is under `tools/oxlint/anti-slop/`, excluded from application lint/format checks, and should be updated with its `UPSTREAM.md` provenance in mind.
- Update documentation and interaction/width regression tests when changing shared framework conventions.

## Downstream ownership

Reuse framework components and demos when helpful. Downstream applications may remove unused screens, components, hooks, themes, and providers. Before any upstream sync, read [the full sync ownership policy](./template-sync.md), preserve application-owned files, and add customized or intentionally deleted shared paths to `.templatesyncignore`.

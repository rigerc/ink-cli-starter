---
root: true
description: Project instructions for the native Ink CLI template
---

# Instructions for this Ink CLI application

This repository is a GitHub template containing a working application. There is
no UI framework or scaffold generator. Read `README.md`,
`docs/architecture.md` and `docs/adding-a-feature.md` before architectural work.

## Development

- Use `npm ci`, then `npm run check`, `npm run typecheck`, `npm test`
  and `npm run build` to validate changes.
- Edit `src/app.tsx` using native Ink/React. Do not introduce a shell, router,
  design system, themes or hooks just to follow a template convention.
- Keep headless commands independent of Ink and preserve `--plain` output.
- Preserve validated configuration writes and terminal cancellation behavior.
- This project uses Vite+, Changesets and a vendored lint extension.

## Agent rules and template sync

Canonical rules live in `.agentsmesh/rules/`. Run `agentsmesh generate`
and `agentsmesh check` after changing them. Downstream projects own their
application files and protected paths from `.templatesyncignore`.

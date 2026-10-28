---
name: ink-cli-starter
description: >-
  Work in GitHub repositories created from the rigerc/ink-cli-starter template,
  including renamed and customized downstream Ink CLI apps. Use to initialize
  a new copy, extend screens or headless commands, change terminal input/output
  or settings, validate behavior, or safely review upstream template sync.
---

# Work in a repository based on Ink CLI Starter

Use this skill in the **current project repository**, typically one created
with GitHub's **Use this template** action from `rigerc/ink-cli-starter`.
The template copies an application, not a generator or a live dependency.
After creation, the downstream project owns its Git history, package identity,
screens, commands, scripts, and agent instructions. Never assume the checkout
is the upstream `rigerc/ink-cli-starter` repository, or that its original
files still exist. Follow local `AGENTS.md` and focused rules when present;
this skill is a workflow, not an override.

## Identify the repository before making changes

1. Confirm the working repository, current branch, and uncommitted changes:
   `git remote -v`, `git branch --show-current`, `git status --short`.
   With GitHub CLI, `gh repo view --json nameWithOwner,defaultBranchRef`
   can identify the PR target. When working through a GitHub integration
   without a checkout, inspect the repository metadata and default branch.
   The downstream repository, **not the template**, is the default target
   for branches, pushes, issues, and PRs unless explicitly requested.
   Template-created repositories may have unrelated Git history.
2. Read the current project's `README.md`, `package.json`, and
   `AGENTS.md` (if present). Check its package manager, actual npm scripts,
   CLI identity, and existing architecture before choosing commands or paths.
   Treat the current project as the source of truth, even when it diverges
   from the template. Do not reintroduce removed demos, screens, or tooling.
3. Consult `docs/architecture.md` and `docs/adding-a-feature.md` when
   present; consult `docs/ui-framework.md` for terminal UI work and
   `docs/configuration.md` for settings work. Check their advice against
   the current source, as downstream documentation may have changed.
4. **If the starter layout still exists:** `src/cli.tsx` handles process
   lifetime; `src/lib/program.ts` owns Commander wiring;
   `src/lib/render-app.tsx` lazily loads Ink; `src/app.tsx` supplies the
   default app; `src/screens/index.ts` and `src/commands/index.ts` are
   registries. Inspect `src/ui/core/` and `src/ui/layout/` before replacing
   runtime or shell behavior. Reuse `src/components/`, `src/hooks/`, and
   `src/theme/` if useful. If any of these are absent, locate the local
   equivalent rather than recreating template structure.

## Initialize a newly created GitHub template repository

Only use this workflow when the user is setting up a **fresh** repository
created with **Use this template → Create a new repository**. A repo that
already has its own package name, features, settings, or releases is not a
fresh template copy.

1. Clone or check out the **new downstream repository**, not the original
   template. Check `package.json` for the required Node version and package
   manager. The unmodified starter requires Node.js 22.12+ and uses `npm ci`.
2. If the copy still offers `init:project`, preview identity changes:

   ~~~bash
   npm run init:project -- --name my-cli --description "My CLI" --dry-run
   ~~~

   Review the preview, then remove `--dry-run` to apply. Do not run this
   initializer in an already-customized project. It changes package/binary
   and configuration identity, but does not move existing user config files.
   See `docs/template/customization.md` if available.
3. If the starter scripts and commands are still present, run `npm run dev`
   in a terminal, `npm run dev -- --plain` for a static frame, or
   `npm run dev -- doctor --json` for headless diagnostics. The original
   `--plain` and `--setup` modes are incompatible with subcommands; setup
   needs an interactive TTY. In customized repos, use the documented local
   commands instead.

## Add or modify a feature in the current application

Use the paths and APIs below **only if the downstream repository still uses
the starter architecture**. If it has replaced registries, renamed commands,
or removed optional features, follow its actual implementation instead of
copying template examples or restoring removed code.

1. Put shared domain models and operations under `src/features/<feature>/`
   when useful. Keep them independent of React and Ink so screens and
   commands can call the same operation.
2. For a screen, add `src/screens/<Name>.tsx` and register it in
   `src/screens/index.ts`. Registry IDs drive `--screen`, navigation, and
   capture targets. Visible registry order controls tabs and the first nine
   numeric shortcuts. Use `showInNav: false` for a hidden detail screen.
   `layout: 'bare'` removes shell chrome; `globalKeys: false` independently
   disables built-in shortcuts. If global keys are disabled, supply an
   accessible exit or navigation path.
3. For a headless operation, define a typed `defineCommand` (or
   `defineCommandGroup`) with its arguments, options, Zod schema, and
   handler in `src/commands/`, then register it in `src/commands/index.ts`.
   Commander wiring, help, and completions follow the registry. Do not edit
   the CLI entry point just to add a subcommand. Headless code must work
   without a TTY and must not import Ink or require React rendering.
4. In a command handler, use `context.output()` for result data on stdout,
   `context.notice()` for suppressible stderr notices, `context.flags` for
   common options, and `context.signal` for cancellation. Keep JSON stdout
   parseable and do not send diagnostics to it. Read piped stdin only when the
   command explicitly accepts `-`. The original starter's `example`
   command illustrates this if the downstream app still includes it.
5. For UI interactions, use scoped `useKeymap` or `useAction` and activate
   only the control that owns input. Use `useInputCapture` for custom
   free-form text editing, then release capture on finish/cancel. Managed
   controls already coordinate input; avoid competing native `useInput`
   handlers. Start async work in events or effects, not during render, and
   handle loading, empty, error, and success with `useAsync`/`ScreenState`.
6. For a new global flag, update the option in `src/lib/program.ts` and
   the parsed `globalOptions` schema in `src/commands/definition.ts`.
   For settings, align `src/config/schema.ts` (`appConfig.fields` and
   validation), runtime overrides, editor behavior, and persistence.
   Registering a config environment variable does not automatically add a
   Commander option. Follow `docs/configuration.md` for versioned migrations,
   explicit save/discard, and invalid-file preservation.

## Preserve the application's contracts

These are the **unmodified starter's** behavior contracts. In a derived app,
verify its actual flags, configuration, and output guarantees before changing
them; preserve its documented public behavior.

- Starter configuration precedence is **defaults < saved file < environment < CLI**.
  Do not persist environment or CLI overrides as user settings. Preserve
  unknown application-specific config keys and leave invalid saved JSON
  untouched rather than silently resetting it.
- `--plain` must produce one meaningful deterministic frame without waiting
  for effects. It is also the default for piped or CI output. Use a headless
  command when results must complete asynchronously before printing.
- Keep result stdout separate from Ink rendering and diagnostics. Preserve
  `--quiet`, `--json`, `--help`, and shell completion behavior.
- Preserve `NO_COLOR` (forces mono, **not** ASCII), `--ascii`, theme
  fallbacks, accessible status text, and usable layouts at approximately 40,
  80, and 120 columns. Test keyboard focus and restoring shortcuts after an
  editor closes.

## Validate against the downstream repository

Inspect the current `package.json` and CI workflow. When the original
Vite+ scripts are still present, run:

~~~bash
npm run check
npm run typecheck
npm test
npm run build
~~~

Use the **downstream project's** corresponding checks if scripts or tooling
have changed. Add or update the tests that actually exist for the affected
behavior; do not recreate deleted starter tests to satisfy this skill.

For CLI, screen, or command changes in a repo retaining the original
commands, smoke-test:

~~~bash
npm run dev -- --help
npm run dev -- --plain
npm run dev -- doctor --json
npm run dev -- completion bash
~~~

Otherwise test its current executable, flags, JSON output, and help/completion
behavior. For input/layout changes, verify an interactive TTY, mono/ASCII
modes, and approximately 40/80/120 columns where supported. Run
`npm run test:pty` only when that script and native PTY support are present.
The original starter has `tests/cli.behavior.test.ts`,
`tests/headless-commands.test.ts`, `tests/keyboard-and-controls.test.tsx`,
and `tests/app-runtime.test.tsx`; downstream projects may have renamed or
removed them. For instruction-only edits, application tests are optional:
validate frontmatter, local paths, any sample commands, and mirrored copies.

## Maintain agent instructions and upstream updates safely

- If the downstream project still uses AgentsMesh, edit its canonical
  `.agentsmesh/` sources instead of generated `AGENTS.md`, `CLAUDE.md`,
  or tool projections. Run `agentsmesh lint`, inspect `agentsmesh diff`,
  then `agentsmesh generate` and `agentsmesh check` **when available**.
  If it no longer uses AgentsMesh, follow its own instruction workflow;
  do not restore AgentsMesh just to use this skill.
- In the original template, this skill is maintained directly at
  `.agents/skills/ink-cli-starter/SKILL.md`, outside AgentsMesh. Its
  `.claude/skills/ink-cli-starter/SKILL.md` mirror is identical for Claude
  discovery. In a downstream repo, respect any intentional changes to agent
  discovery and keep both files synchronized **if both are still used**.
- The original `.templatesyncignore` protects `.agents/`, `.claude/`, and
  other downstream-owned instructions. **Updating the skill in the upstream
  template does not update existing GitHub template-created repositories.**
  New repositories copy the version present when created. To adopt a later
  skill revision in an existing repo, review and explicitly copy/merge it
  into that repo's skill paths; do not overwrite its local customizations.
- If the downstream project retains template sync, read its
  `docs/template/syncing.md` and `.templatesyncignore` before triggering
  the opt-in workflow. Preserve the downstream package identity, `.gitignore`,
  application code, agent configuration, and intentionally deleted paths.
  Add customized shared files to the downstream ignore list before syncing;
  review additions, deletions, renames, and every sync PR. Static exclusions
  cannot identify all customizations, and template-created histories may be
  unrelated. Do not bypass sync guards to force an update.
- When opening a GitHub PR for application work, use the current downstream
  repository's branch and default/base branch. Only target
  `rigerc/ink-cli-starter` when the user explicitly requests an upstream
  contribution.

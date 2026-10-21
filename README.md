# ink-kit

A skeleton for polished terminal apps on **Ink 8** (React 19, Node 22+): theme system,
hooks, helpers and a component library, with a gallery and tests.

## Using the UI framework

Start with the [UI framework guide](docs/ui-framework.md) for provider composition,
screen/layout patterns, component choices, keyboard routing and input ownership,
semantic theming, async states, responsive terminals and tests. Then follow the
[feature walkthrough](templates/app/docs/adding-a-feature.md) for a minimal
screen and headless command. The guide is copied into generated projects as
`docs/ui-framework.md`; generated READMEs link to it.

## Scaffold a new app

From a Git checkout of this repository (Node.js 22+ and Git required):

```bash
npm run scaffold                                           # Guided interactive setup
npm run scaffold -- my-cli                                 # Backward-compatible default
npm run scaffold -- my-cli --path ../apps/my-cli
npm run scaffold -- my-cli --preset minimal
npm run scaffold -- my-cli --package-manager pnpm --toolchain tsdown
npm run scaffold -- my-cli --features settings,doctor,tests,ci
npm run scaffold -- my-cli --features none                 # No optional features
npm run scaffold -- my-cli --interactive                   # Prompt even with a name
```

### Choices

| Flag | Values | Default |
| --- | --- | --- |
| `--preset` | `minimal`, `standard`, `full` | `standard` |
| `--package-manager` | `npm`, `pnpm`, `yarn`, `bun` | `npm` |
| `--toolchain` | `vite-plus`, `tsdown` | `vite-plus` |
| `--features` | Comma-separated feature IDs or `none` | Preset features |

Available features: `settings`, `doctor`, `gallery`, `tests`, `screenshots`, `ci`.
The `minimal` preset includes tests only. Both `standard` and `full` currently
include all six features, matching the original generated app. `--features`
replaces the preset feature selection rather than merging with it.

The interactive flow offers name, destination, preset, package manager, toolchain,
optional features, and final confirmation. Explicit CLI flags take precedence
over the corresponding prompts. Every selection works non-interactively.

`--path` (or `-p`) means the complete destination directory, not its parent.
Relative paths resolve from your current directory. The destination must not
already exist. Invalid combinations fail before creating any output.

### Generated projects

Vite+ is the original build and test stack. `tsdown` uses tsdown to build and
standalone Vitest for tests, with its own configuration files. For non-default
dependency selections, the generator omits the stale npm lockfile. The first
`npm install` produces a new lockfile, to be committed by the app owner. pnpm,
Yarn, and Bun similarly create their own native lockfile on first install.
The scaffold does not install dependencies or initialize Git.

Unselected features are omitted from the generated screens, commands, scripts,
dependencies, tests, and CI. Core Ink components and configuration primitives
remain reusable even in minimal apps. The default `standard` preset still
includes Home, Settings, Help, the hidden Gallery, doctor, tests, screenshots
and CI. See the generated README for exact commands.

After scaffolding:
```bash
npm install
npm run dev                 # interactive app
npm run gallery             # jump straight to the component gallery
npm run demo:inline         # compact setup wizard in normal terminal scrollback
npm run demo:ui             # shared header, menu, footer and dashboard example
npm run dev -- --plain      # one-shot static render (what pipes/CI get)
npm test                    # interactive Ink tests + screen/theme/width overflow checks
npm run build && npm start
```

Interactive tests use `ink-testing-library` to send keyboard input and assert rendered
frames. Width-specific tests retain Ink's `renderToString()` for deterministic
terminal-column checks.

Starter keys: `tab` / `shift+tab` / `1-6` switch screens, `ctrl+k` opens the command menu, `t` cycles themes, `?` help, `q` quit.
Generated apps start with three visible tabs (Home, Settings, Help).

## Automated screenshots

Install Chromium once, then generate PNGs without an interactive terminal:

```bash
npx playwright install chromium
npm run screenshot
# Capture just one view (filters can be repeated):
npm run screenshot -- --screen gallery --theme dark --columns 100
npm run screenshot -- --screen inline --theme mono --ascii
npm run screenshot -- --help
```

On Linux, use `npx playwright install --with-deps chromium` if browser system
dependencies are missing. By default, the script captures all registered screens
and the inline demo, in all four themes at 80 and 120 columns (56 PNGs today).
Files go to the ignored `screenshots/` directory, named like
`gallery-dark-80.png`. Use `--output-dir <dir>` to choose another destination.

These are deterministic initial-state previews rendered by Ink's `renderToString`,
including the app header, tabs, and footer. ANSI colors become escaped HTML, which
Playwright captures with headless Chromium. Screenshots preserve Unicode by default;
`--ascii` uses ASCII glyphs. Animations and subsequent keyboard interactions are
not captured. The screenshot process fixes terminal diagnostics and the displayed
config path, and forces color independently of `NO_COLOR` or host configuration.
For consistent pixels across machines, use the same OS and installed fonts as CI.

The **Screenshots** GitHub Actions workflow runs on pushes to `main`, pull requests,
and manual dispatch. It installs dependencies and Chromium, runs type checks and
tests, then uploads the images as a `screenshots` artifact retained for 14 days.
Download it from the workflow run's **Artifacts** section. Generated images are
review artifacts; the workflow does not compare them against a visual baseline.

## Layout

```
src/
  cli.tsx            flags, config, theme resolution, interactive vs plain
  app.tsx            providers, shell, global keymap, PlainView
  keys.ts            global key list (status bar + Help)
  theme/             tokens, 4 themes, resolve order, ThemeProvider/useTheme/useTone
  components/        Stack Row Panel Card Badge StatusMessage Alert Spinner ProgressBar
                     KeyValue Table TaskList Select Tabs EmptyState ErrorPanel
                     MultiSelect SearchSelect Toggle PaginatedList
                     Stepper Step StepperProgress StepperNavigation Confirm InlineLayout
                     Header StatusBar ToastHost AppShell ScreenHeader ScreenLayout ScreenState
                     CommandMenu + typography (Heading, Label,
                     Muted, Code, Kbd, Icon, Divider)
  hooks/             KeymapProvider/useKeymap useRouter useAsync useToast useElapsed useInterval
                     useExit useTerminalSize InputCaptureProvider/useInputCapture
  lib/               format, gradient, terminal, config (zod), logger, errors
  screens/           Home Tasks Gallery Settings Help UiDemo  (+ registry in index.ts)
tests/
```

## Theming

Themes are semantic tokens (`primary accent success warn danger info muted` + `text border focus onTone`).
Components never hardcode colors; use `useTheme()` / `useTone(tone)`.

Resolution order: `NO_COLOR` > `--theme` > `INK_KIT_THEME` > config file > light/dark autodetect.
Themes: `dark`, `light`, `contrast` (ANSI names only), `mono` (no color; weight and symbols).
`--ascii` / `CLI_ASCII=1` swaps all glyphs and borders for ASCII.

### Customize theme tokens and the project default

The shipped semantic color palettes live in `src/theme/palettes.json`. Use the
scripts below to modify a token or select a project-wide fallback theme:

```bash
npm run theme:list                                 # Display palettes and current default
npm run theme:token -- dark primary '#ff80aa'      # Edit a semantic color
npm run theme:token -- contrast focus cyanBright  # Contrast allows ANSI colors only
npm run theme:default -- light                     # Default for new runs
npm run theme:default -- auto                      # Restore terminal detection
```

Available tokens are `primary`, `accent`, `success`, `warn`, `danger`, `info`,
`muted`, `text`, `subtle`, `border`, `focus`, and `onTone`. Values are six-digit
hex colors (`#RRGGBB`) or ANSI color names. `mono` deliberately has no colors.
Commands validate inputs before writing, and update JSON atomically.

The project default is stored in `src/theme/defaults.json` and is **not** a
per-user saved setting. `auto` preserves the original light/dark autodetection.
Resolution order remains `NO_COLOR` > CLI flag > environment variable > saved
config > project default. A saved `theme: auto` forces detection even when a
different project default was selected. The Settings editor shows the project
default for otherwise unset preferences.

These scripts are copied to scaffolded applications and operate on the project
containing `scripts/theme.mjs`, regardless of your shell's working directory.
The generated README includes the same commands.

To add an entirely new theme, extend the names in `src/theme/tokens.ts`,
register the palette in `src/theme/themes.ts`, and update other theme-facing
registries and tests as needed. The scripts above edit built-in palettes; they
do not generate new theme definitions.

## Configuration framework

The starter includes a Zod-validated JSON configuration store and two interactive
editors. All changes are drafts until explicitly saved.

```bash
ink-kit --setup                         # guided interactive wizard (TTY required)
ink-kit --config ./custom-config.json   # load an explicit config file
ink-kit --setup --config ./custom.json  # configure that file interactively
ink-kit --screen settings               # open Settings (press w for the wizard)
```

The default file is `$XDG_CONFIG_HOME/ink-kit/config.json` or
`~/.config/ink-kit/config.json`. A relative `--config` path resolves relative
to the current working directory. Both Settings and the standalone wizard use
the same file; they **never** write until the user confirms Save. Press
Escape to back out of editing, `s` to save and `d` to discard changes in Settings.
The Settings screen also has `w` for the guided wizard.

Resolution is **defaults < file < environment < CLI flags**. `NO_COLOR`
takes precedence over theme selection. Settings displays the current
source of overridden fields. Configuration edits take effect on the next run;
runtime environment/flag overrides are not written to disk.

The starter's application definition is in `src/config/schema.ts`. The
`appConfig.fields` registry drives the settings editor and wizard sections
without additional UI wiring. A field can have a section, label,
description, kind (`toggle`, `select`, `text`, `number`, `multi`),
options, optional default, environment variable and conditional visibility.
Extend the Zod schema and fields together to add application-specific
settings, for example:

```ts
// In src/config/schema.ts:
const schema = z.looseObject({
  version: z.number().int().positive().optional(),
  theme: z.enum(['auto', ...themeNames]).optional(),
  ascii: z.boolean().optional(),
  endpoint: z.string().url().optional(),
});
// Register a field in appConfig.fields:
{path: 'endpoint', label: 'API endpoint', section: 'General',
 kind: 'text', description: 'URL to contact'}
```

For other applications, `defineConfig()` and `createConfigStore()` are
public reusable APIs; `ConfigSectionEditor` can render an arbitrary registry.
`setAtPath()`, `getAtPath()` and `resolveConfig()` support nested
settings and source-aware precedence. The existing `loadConfig()` and
`saveConfig()` remain supported; both also accept an optional explicit path.

Writes validate the entire merged document, preserve unknown extension
keys, use a same-directory temporary file and rename atomically.
Malformed/unsupported configurations are never overwritten silently. The
store writes `version: 1` and supports explicit migration functions for
future schema changes. No automatic prompts appear in pipes or CI; `--setup`
instead reports that a TTY is required.

## Add a screen

For complete examples and focus-management conventions, read
[the UI framework guide](docs/ui-framework.md). The following is the
short registration path.


Create `src/screens/Foo.tsx`, add one line to the `screens` array in `src/screens/index.ts`.
It gets a tab, a number shortcut, a `--screen foo` flag value, and test coverage.

Use `ScreenLayout` for a shared screen title, description, and content padding; the
outer `AppShell` already owns the application header, tabs, toasts, and status bar.
Register optional per-screen `hints` on `ScreenDef` to put contextual shortcuts
first in the status bar. `src/keys.ts` is the single global shortcut definition
used by key handling, Help, and footer hints; the numeric range adjusts when screens
are added or removed. `ctrl+k` opens a searchable command menu of visible screens.
The footer reduces visible hints on narrow terminals without switching to alternate
screen mode. Use `ScreenState` for loading, empty, error, and success views.

## UI demo

`npm run demo:ui` (or `npm run dev -- --screen ui-demo`) launches a sample dashboard
built using the **same shared shell** as the rest of the starter. Unlike the
component gallery, it shows the components working together in a complete screen:
app header/version, tabs, responsive panels, screen title, status states, table,
notifications and contextual footer shortcuts.

- `s` cycles success, loading, empty, and error states; `r` resets.
- `m` shows a toast; `ctrl+k` opens the global command menu.
- `tab` / `shift+tab` / number keys navigate; `t` switches themes.
- `npm run demo:ui -- --plain` prints a static preview for pipes and CI.
- `npm run screenshot -- --screen ui-demo --theme dark --columns 100` captures it.

All UI demo data is illustrative and does not run jobs or write configuration.
The screen is specific to this starter and is intentionally excluded from
scaffolded applications.

## Inline demo

The shell already uses normal terminal output. `npm run demo:inline` (or `ink-kit --demo`)
shows a separate, compact setup wizard without tabs or global shortcuts. It takes only
the rows its content needs, preserves shell scrollback, and exits with its result visible.
Enter starts the wizard, arrows choose a template, and Enter confirms. Escape goes back
or cancels from the first step; Ctrl+C quits. On Review, choose No to cancel or Yes to run
async validation and finish. This demo does not create files or run external commands.

```bash
npm run demo:inline -- --theme contrast
npm run demo:inline -- --plain --ascii --theme mono
npm run build
node dist/cli.js --demo
```

Pipes, CI, and `--plain` print a static preview and exit without waiting for input.
Theme flags, `NO_COLOR`, config, and ASCII glyph handling work as in the main app.
## Component gallery

Run `npm run gallery` or `npm run dev -- --screen gallery`. The gallery displays
**one component family at a time**; no off-screen demo is mounted or receives
keyboard events.

- `[` / `]` steps through components; `/` explicitly opens a searchable
  component picker. Enter selects, Escape cancels.
- On the **SearchSelect** example, press Enter to focus its input. Only then
  does typing edit the query. Escape releases focus and restores shortcuts.
- Interactive examples keep their own documented keys (Space/Enter for Toggle,
  arrows/Space for MultiSelect, left/right for PaginatedList, and so on).
- Global navigation (`Tab`, numbers, `Ctrl+K`, `?`, `q`) is suspended
  while a search field owns input. Theme and ASCII modes work as usual.

The previous gallery-wide letter shortcuts (`m`, `o`, `p`, `w`, `r`)
were removed to prevent competing input handlers and accidental example
switching.

## Selection and collection components

All four components are exported from `src/components`, use theme tokens, and support
`isActive={false}` for static previews or when another control owns keyboard input.
Use unique option `value`s and stable pagination keys.

| Component       | Main props                                                                               | Keyboard                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `MultiSelect`   | `items`, `value` / `defaultValue`, `onChange`, `onSubmit`, `maxVisible`                  | Up/Down or j/k move; Space toggles; Enter submits; Home/End jump                            |
| `SearchSelect`  | `items`, `onSelect`, `onCancel`, `query` / `defaultQuery`, `onQueryChange`, `maxVisible` | Type to filter; Backspace edits; Ctrl+U clears; Up/Down move; Enter selects; Escape cancels |
| `Toggle`        | `label`, `value` / `defaultValue`, `onChange`, `onLabel`, `offLabel`                     | Space/Enter toggle; Left turns off; Right turns on                                          |
| `PaginatedList` | `items`, `getKey`, `renderItem`, `pageSize`, `page` / `initialPage`, `onPageChange`      | Left/Right or PageUp/PageDown move; Home/End jump                                           |

```tsx
<MultiSelect
  items={[{value: 'lint', label: 'Linting'}, {value: 'tests', label: 'Tests'}]}
  defaultValue={['tests']}
  onSubmit={(features) => saveFeatures(features)}
/>

<SearchSelect items={packages} onSelect={choosePackage} onCancel={closeSearch} />
<Toggle label="Enable caching" value={cacheEnabled} onChange={setCacheEnabled} />

<PaginatedList
  items={packages}
  pageSize={5}
  getKey={(pkg) => pkg.value}
  renderItem={(pkg, index) => `${index + 1}. ${pkg.label}`}
/>
```

MultiSelect and SearchSelect display at most `maxVisible` options (default 6) and scroll
the visible window with the cursor. MultiSelect emits available selected values in item
order; Enter on an empty list does nothing. SearchSelect filters labels and hints without
case sensitivity, resets its cursor when the query changes, and does not submit when there
are no matches. Its query editor appends text and removes the last Unicode grapheme with
Backspace; it is a search prompt, without cursor-position editing.

Toggle defaults to Off and always shows its state in text. PaginatedList uses zero-based
page indexes, defaults to 5 items per page, clamps indexes when data shrinks, and does not
wrap at boundaries. `renderItem` receives the absolute item index. Empty lists show an
`emptyMessage`; non-positive sizes normalize to 1 and non-finite sizes use the default.
Controlled values only update when their parent supplies a new prop.

`AppProviders` includes `InputCaptureProvider`. Active SearchSelect instances capture input,
and the shell pauses global shortcuts (including q/t/number keys) until they deactivate.
For another host, wrap it with `InputCaptureProvider`, use `useHasInputCapture()` to pause
all shared keymaps, and deactivate SearchSelect from `onSelect`/`onCancel`. Other text inputs
can call `useInputCapture(isActive)` to participate. Keep only one control active at a time.

`KeymapProvider` is installed once in `AppProviders`, so **the same precedence applies
across every screen**: control shortcuts override screen shortcuts, which override global
shortcuts. Only the highest-priority matching `useKeymap` binding runs per keypress.
Set `scope: 'screen'` on screen-level bindings and `scope: 'global'` for shell bindings;
controls use the default `'control'` scope. Input capture suppresses all regular
shortcuts until focus is released. The configuration editor explicitly marks its
nested Select/MultiSelect controls with `allowWhenCaptured` so they remain usable
while the editor has input capture. Standalone controls retain their previous
`useKeymap` behavior without the provider.

## Wizard components

The Stepper API is inspired by [archcorsair/ink-stepper](https://github.com/archcorsair/ink-stepper)
(MIT). This is a local implementation using the starter's theme tokens, with no new runtime dependency.

```tsx
import {Text} from 'ink';
import {InlineLayout, Stepper, Step, StepperNavigation} from './components';

<InlineLayout>
  <Stepper onComplete={finish} onCancel={cancel}>
    <Step name="Welcome">
      <Text>Press Enter to begin.</Text>
      <StepperNavigation />
    </Step>
    <Step name="Validate" canProceed={async () => await validate()}>
      {({isValidating}) => <Text>{isValidating ? 'Checking...' : 'Press Enter to finish.'}</Text>}
    </Step>
  </Stepper>
</InlineLayout>;
```

`Stepper` accepts direct `Step` children, fragments, and conditional Steps. Give conditional
steps stable keys so inserting another step preserves the active step. Unlike upstream,
custom components wrapping `Step` are not supported; wrap a step's content instead.
Only the active step's content mounts. Empty wizards render nothing.

- `Step`: `name`, `canProceed` (boolean or sync/async function), and content or a render function.
- Render context / `useStepper()`: `goNext`, `goBack`, `goTo`, `cancel`, `currentStep`,
  `totalSteps`, `isFirst`, `isLast`, `isValidating`. Indexes are zero-based.
- `Stepper`: `initialStep`, controlled `step` + `onStepChange`, `onExitStep`, `onEnterStep`,
  `onError`, `keyboardNav`, `showProgress`, and `renderProgress`.
- `StepperProgress`: `steps` (`{id, name}[]`), `currentStep`, and horizontal/vertical `orientation`.
  Labels wrap to terminal width. Set `currentStep` to `steps.length` for all complete.
- `StepperNavigation`: themed Enter/Escape hints inside an active Step.
- `Confirm`: `message`, `defaultValue` (defaults to No), `onConfirm(boolean)`, and `isActive`.
  Y/N or left/right selects an answer; Enter submits it.
- `InlineLayout`: optional `title`, `footer`, and `maxWidth` (defaults to 72 columns).
  Height follows its content and width shrinks with the terminal.

Next checks `canProceed`; back does not. `goTo` clamps its target and skips `canProceed`.
All navigation calls `onExitStep` first (return `false` to block), then `onStepChange`
and `onEnterStep` after a move. Errors block the move, show feedback, and call `onError`
when supplied. Navigation is locked through both async validation and exit hooks;
completion and cancellation fire once per mount. Remount with a new key to restart.

When a child input owns Enter/Escape, set `keyboardNav={false}` on the Stepper for that
step and navigate through the render context or `useStepper()`. See `src/demos/SetupWizard.tsx`
for Select and Confirm integration. Use the input-capture hooks above for free-form text
entry that must suspend host shortcuts.

## Notes

- Never `console.log` while Ink is rendering; use `logger` (writes a file with `--debug`).
- Ink has no border titles, so `Panel` draws its title as the first row.
- Status is never color-only: every tone pairs with a symbol.
- Config lives at `$XDG_CONFIG_HOME/ink-kit/config.json` (default `~/.config/ink-kit/`).
- Scaffold a renamed app with `npm run scaffold -- my-cli`.

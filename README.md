# ink-kit

A skeleton for polished terminal apps on **Ink 8** (React 19, Node 22+): theme system,
hooks, helpers and a component library, with a gallery and tests.

## Scaffold a new app

From a Git checkout of this repository (Node.js 22+ and Git required):

```bash
npm run scaffold                            # Interactive: name, destination, confirmation
npm run scaffold -- my-cli                  # Non-interactive, creates ./my-cli
npm run scaffold -- my-cli --path ../apps/my-cli  # Custom destination
npm run scaffold -- my-cli --interactive    # Prompt for destination and confirmation
```

`--path` (or `-p`) is the **complete output directory**, not a parent folder.
Relative paths resolve from the directory where the command is run. Missing parent
directories are created automatically, but an existing destination is never
overwritten. Omit the app name to enter interactive mode in a terminal; when
input is piped/non-interactive, provide the app name or use `--interactive`.
The app package name is always derived from the positional name (or prompt), not
from the destination directory name.

After scaffolding:

```bash
cd my-cli
npm install
npm run dev
```

The generator copies **tracked files** from the current starter checkout, including any
new screens, hooks, components, and tests—no file list or separate template to maintain.
It includes the generic CI and package-artifact workflows (but not the starter-only
screenshots workflow), excludes the scaffolding script and its tests, and writes
a small app-specific README instead of copying the starter documentation. Untracked
files, dependencies, and Git metadata are not copied.

Only `package.json`, the root of `package-lock.json`, and the `APP_NAME` constant
in `src/lib/config.ts` are renamed. The CLI title, help, theme environment variable
(`MY_CLI_THEME`), and screenshot paths derive from those values. App names must be
lowercase kebab-case (`my-cli`); existing directories are never overwritten.
The generator does not install dependencies or initialize a new Git repository.

```bash
npm install
npm run dev                 # interactive app
npm run gallery             # jump straight to the component gallery
npm run demo:inline         # compact setup wizard in normal terminal scrollback
npm run dev -- --plain      # one-shot static render (what pipes/CI get)
npm test                    # interactive Ink tests + screen/theme/width overflow checks
npm run build && npm start
```

Interactive tests use `ink-testing-library` to send keyboard input and assert rendered
frames. Width-specific tests retain Ink's `renderToString()` for deterministic
terminal-column checks.

Keys: `tab` / `1-5` switch screens, `t` cycles themes, `?` help, `q` quit.

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
and the inline demo, in all four themes at 80 and 120 columns (48 PNGs today).
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
                     Header StatusBar ToastHost AppShell + typography (Heading, Label,
                     Muted, Code, Kbd, Icon, Divider)
  hooks/             useKeymap useRouter useAsync useToast useElapsed useInterval
                     useExit useTerminalSize InputCaptureProvider/useInputCapture
  lib/               format, gradient, terminal, config (zod), logger, errors
  screens/           Home Tasks Gallery Settings Help  (+ registry in index.ts)
tests/
```

## Working reference application

The generated app includes a functional local-first task manager as an end-to-end
example of domain services, validation, persistence, TUI and headless commands.
No database service or account is required.

```bash
npm run dev                             # Interactive dashboard, tasks, gallery, settings, help
npm run dev -- tasks list --json        # Structured output for automation
npm run dev -- tasks add "Write docs"
npm run dev -- tasks complete <uuid>
npm run dev -- tasks rename <uuid> "Updated title"
npm run dev -- tasks reopen <uuid>
npm run dev -- tasks remove <uuid>
npm run dev -- doctor                   # Environment and data checks
npm run dev -- config path
npm run dev -- tasks list --data ./my-tasks.json
```

The installed CLI supports the same commands (`my-cli tasks ...` after scaffolding).
Interactive Tasks supports `n` to create, arrows or `j/k` to select, Enter
for details, Space to toggle completion, `e` to rename, `d` to delete with
confirmation, and Escape to go back.

The application separates these layers:

- `src/features/tasks/schema.ts`: validated domain models.
- `src/features/tasks/service.ts`: operations shared by CLI and TUI.
- `src/features/tasks/repository.ts`: persistence boundary.
- `src/storage/`: versioned JSON storage and XDG data paths.
- `src/commands/`: noninteractive dispatch and JSON output.
- `src/features/tasks/context.tsx`: service injection into Ink screens.

Task data resides at `$XDG_DATA_HOME/<app-name>/tasks.json`, defaulting to
`~/.local/share/<app-name>/tasks.json`, and can be overridden with `--data`.
This is separate from the existing user-editable JSON configuration. Changes
are validated and written using an atomic same-directory rename; malformed
or future-version files are refused rather than overwritten. The JSON backend
assumes a single writer; use a locking or transactional backend for simultaneous
writer processes.

Scaffolding retains generic CI and release-archive workflows, and continues to
exclude the starter's Playwright screenshot workflow. The release workflow
uploads an npm tarball as an artifact on version tags; it does not publish to
a registry.

## Theming

Themes are semantic tokens (`primary accent success warn danger info muted` + `text border focus onTone`).
Components never hardcode colors; use `useTheme()` / `useTone(tone)`.

Resolution order: `NO_COLOR` > `--theme` > `INK_KIT_THEME` > config file > light/dark autodetect.
Themes: `dark`, `light`, `contrast` (ANSI names only), `mono` (no color; weight and symbols).
`--ascii` / `CLI_ASCII=1` swaps all glyphs and borders for ASCII.

To add a theme: add a name in `theme/tokens.ts`, a palette in `theme/themes.ts`. The gallery and tests pick it up.

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

Create `src/screens/Foo.tsx`, add one line to the `screens` array in `src/screens/index.ts`.
It gets a tab, a number shortcut, a `--screen foo` flag value, and test coverage.

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
The gallery includes progress variants, a confirmation preview, and an interactive panel.
Press `m` for MultiSelect, `/` to edit SearchSelect, `o` for Toggle, `p` for PaginatedList,
or `w` for the inline wizard (`r` restarts it). Search owns keyboard input until Enter
selects a result or Escape releases it; app shortcuts resume afterward.

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
its keymap, and deactivate SearchSelect from `onSelect`/`onCancel`. Other text inputs can
call `useInputCapture(isActive)` to participate. Keep only one control active at a time.

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

# UI framework guide

This guide explains the local **Ink 8 / React 19** component framework. The UI framework lives in `src/` and is part of this template, not a separately published dependency. Downstream apps may remove unused primitives, providers, or demos. If syncing upstream later, exclude intentionally deleted shared paths in `.templatesyncignore`.

See [architecture](architecture.md) for entry points, [adding a feature](adding-a-feature.md) for a screen and headless command walkthrough, [configuration](configuration.md) for saved settings, and [recording](recording.md) for terminal captures. Reusable components remain available under `src/components/`.

## Start here

1. Run `npm run dev` in an interactive terminal; use `--plain` for one-shot output in pipes and CI.
2. Read `src/app.tsx`, `src/screens/Home.tsx` and `src/screens/index.ts` to see the application shell, screen composition and registration.
3. Discover reusable exports in `src/components/index.ts` and `src/hooks/index.ts`; compose these in your app screens as needed.
4. Add domain logic outside the React/Ink layer so noninteractive commands can reuse it.

## Architecture and ownership

| Location                   | Responsibility                                                      |
| -------------------------- | ------------------------------------------------------------------- |
| `src/cli.tsx`              | Parse flags and select interactive or plain rendering               |
| `src/app.tsx`              | Install providers, shared shell, navigation and global shortcuts    |
| `src/screens/index.ts`     | Register screen IDs, labels, tab order and contextual hints         |
| `src/screens/*.tsx`        | Compose reusable UI into screens                                    |
| `src/components/`          | Themed layout, presentation and input controls                      |
| `src/hooks/`               | Router, keys, input capture, async work, toast and terminal helpers |
| `src/theme/`               | Semantic colors, symbols and ASCII compatibility                    |
| `src/features/` (optional) | Domain models and operations independent of Ink                     |

**AppProviders** installs configuration, theme, input capture, keymap, action metadata, toast, router and error-boundary providers. By default, `App` renders `AppShell` (header, tabs, command menu, toasts, status footer) around a screen. If that structure does not fit your CLI, register a bare screen or compose native Ink UI directly. `ScreenLayout` and `InlineLayout` are optional conveniences.

## Define a custom application

The starter exposes `defineApp`, `AppRuntime`, and `PlainRuntime` from `src/app.tsx`.
The existing `App` / `PlainView` wrappers use the default screen registry and remain
fully compatible. Custom application definitions can supply another registry, brand,
shell, and named themes without rewriting the provider stack:

```tsx
import {Text} from 'ink';
import {AppRuntime, defineApp, type AppOptions} from './app';

const customApp = defineApp({
  initialScreen: 'dashboard',
  screens: [
    {id: 'dashboard', label: 'Dashboard', Component: DashboardScreen},
    {
      id: 'wizard',
      label: 'Wizard',
      Component: WizardScreen,
      chrome: {nav: false, footer: false},
      globalKeys: false,
    },
  ],
  brand: {title: 'my-cli', version: '1.0.0'},
  // shell: CustomShell, // receives header, nav, footer, showToasts, children
  // themes: {myTheme: {...baseTheme, name: 'myTheme'}},
});

export function CustomApp({options}: {options: AppOptions}) {
  return <AppRuntime definition={customApp} options={options} />;
}
```

Import the application's definition in `src/cli.tsx` for CLI screen validation and
use `PlainRuntime` for its noninteractive path. The bundled CLI already validates
against `defaultApp`, so replacing that definition updates the valid `--screen`
values. The `src/screens/index.ts` registry exports remain for existing consumers.

`defineApp` rejects duplicate IDs and invalid initial screens. You can use
`layout: 'bare'` for a completely independent view or `chrome: {header: false,
nav: false, footer: false, toasts: false}` to hide individual regions. A custom
shell receives exactly the normal `AppShellProps`, including `showToasts`.

Custom theme names are supported programmatically through `themes` and
`AppOptions.theme`; the bundled Commander's `--theme` validation continues to
accept only built-in theme names until downstream CLI wiring is customized.
The default mono fallback and existing `NO_COLOR` CLI precedence remain intact.

## Actions and unified input ownership

Prefer `useAction` when a screen shortcut should also appear in the contextual
footer. It uses the same `useKeymap` dispatcher, so the key and its display label
are configured together:

```tsx
useAction({
  id: 'jobs.refresh',
  key: 'r',
  label: 'refresh',
  scope: 'screen',
  run: refreshJobs,
  enabled: !loading,
});
```

Registered active screen actions appear in the default shell footer automatically.
Existing `ScreenDef.hints` remain supported and are deduplicated by key.
`useAction` also works outside `ActionProvider` as a scoped shortcut without
the footer metadata. For a custom shell, consume `useActionHints()` explicitly.

Built-in `SearchSelect`, `Confirm`, and `Stepper` use `useManagedInput`.
It routes raw keyboard input through the shared `KeymapProvider` with
control > screen > global priority, avoiding competing native Ink listeners.
A handler can return `false` to allow the next eligible listener to receive an
unhandled key. With no provider, controls use native Ink input as before.
Direct Ink `useInput` is still supported for custom controls, but native
listeners are not arbitrated with the managed dispatcher.

## Create and register a screen

Add `src/screens/Jobs.tsx`:

```tsx
import {Text} from 'ink';
import {useState} from 'react';
import {Panel, ScreenLayout, Stack, StatusMessage} from '../components';
import {useKeymap, useToast} from '../hooks';

export function JobsScreen() {
  const [refreshes, setRefreshes] = useState(0);
  const toast = useToast();

  useKeymap(
    [
      {
        key: 'r',
        run: () => {
          setRefreshes((count) => count + 1);
          toast.push('View refreshed', 'success');
        },
      },
    ],
    {scope: 'screen'},
  );

  return (
    <ScreenLayout title="Jobs" description="Recent activity">
      <Stack gap={1}>
        <Panel title="Overview">
          <Text>Refreshes: {refreshes}</Text>
        </Panel>
        <StatusMessage tone="info">Press r to refresh.</StatusMessage>
      </Stack>
    </ScreenLayout>
  );
}
```

Import `JobsScreen` in `src/screens/index.ts`, then add to the `screens` array:

```ts
{id: 'jobs', label: 'Jobs', Component: JobsScreen, hints: [
  {key: 'r', label: 'refresh'},
]},
```

A visible screen gets a tab and a `--screen jobs` flag; only the first nine visible screens get numeric shortcuts (`1`–`9`). `showInNav: false` makes a screen addressable through `--screen` without putting it in the tab bar. The `hints` property describes contextual actions in the footer but **does not register key handlers**; use `useKeymap` for those. Global keys are defined in `src/keys.ts`, not copied into each screen.

## Choose a screen layout and navigation model

The screen registry is the source of truth for launch IDs, tabs and capture IDs. These options can be combined independently:

| `ScreenDef` option         | Interactive behavior                                                       | `--plain` behavior                                                 |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Default (`layout` omitted) | Shared shell (header, tabs, footer, toasts)                                | App header and one static screen frame; no interactive tabs/footer |
| `layout: 'bare'`           | Screen renders without app-provided chrome or toast host                   | Only the screen's own content                                      |
| `globalKeys: false`        | Disables built-in Tab, 1–9, Ctrl+K, `t`, `?`, `q` shortcuts on that screen | No impact: there are no keyboard events                            |
| `showInNav: false`         | Omitted from tabs, numbered shortcuts and command palette                  | Still addressable with `--screen <id>`                             |
| `hints`                    | Displays context labels in the status footer (if present)                  | No footer; hints are not handlers                                  |

The visible screen order in `src/screens/index.ts` determines Tab order and the first nine `1`–`9` shortcuts. Additional visible screens remain navigable with Tab and the command menu. Hidden screens are valid `--screen` targets and are included in `--all` screenshots. The default global shortcuts come from `src/keys.ts`; do not register a second implementation of the same key without an explicit reason.

For navigation within a custom screen, `useRouter()` (inside `AppProviders`) exposes `current`, `push(id, params?)`, `replace(id, params?)`, `pop()` and `canGoBack`. Pass screen IDs from the registry. `push` keeps history, `replace` changes the current entry, and `pop` returns to the previous entry if present. A bare screen with global keys disabled should provide its own exit and navigation controls (or document Ctrl+C).

For typed route params, declare a route map and use it consistently in the
application's screens:

```tsx
type Routes = {gallery: undefined; detail: {id: string}};
const router = useRouter<Routes>();
router.push('detail', {id: 'build'});
const itemId = router.paramsFor('detail')?.id;
```

`current` remains a string for compatibility. `paramsFor(id)` returns params only
when that route is active. Params belong to history entries and are restored by
`pop()`. The Gallery/detail screens are a working example.

`useLeaveGuard((resume) => boolean, enabled)` lets the active screen defer a
transition by returning false. Show a confirmation and call `resume()` once the
user saves or discards; canceling simply leaves it uncalled. Push, replace, back,
and shell `q` all use the guard. Custom quit buttons should call
`router.requestLeave(exit)`. Settings demonstrates Save/Discard/Cancel and keeps
drafts mounted while the command menu is open. Forced process signals bypass
prompts and never save drafts automatically.

**Prefer the shared shell** for several related views with conventional navigation. Use a **bare screen** for a self-contained flow, a focused prompt or a full-width visualization. In either case, native Ink `Box` and `Text` remain available, and you do not have to keep unused sample components in a downstream project.

## Which components to use

| Goal               | Components                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| Layout and spacing | `Stack`, `Row`, Ink `Box`                                                               |
| Screen structure   | `ScreenLayout`, `ScreenHeader`                                                          |
| Grouping           | `Panel`, `Card`, `Divider`                                                              |
| Text and key hints | `Heading`, `Label`, `Muted`, `Code`, `Kbd`, `Icon`                                      |
| Status             | `Badge`, `StatusMessage`, `Alert`, `Spinner`, `ProgressBar`, `EmptyState`, `ErrorPanel` |
| Data               | `KeyValue`, `Table`, `TaskList`, `PaginatedList`                                        |
| Result states      | `ScreenState`                                                                           |
| Input              | `Select`, `MultiSelect`, `SearchSelect`, `Toggle`, `Confirm`                            |
| Wizards            | `Stepper`, `Step`, `StepperProgress`, `StepperNavigation`, `InlineLayout`               |

Import components through `../components` and hooks through `../hooks` when useful. They are a toolkit, not the only supported rendering API: Ink `Box`, `Text`, and `useInput` can be used directly. `Panel` and `Card` accept standard Ink Box props (including border and padding overrides); `Stack` and `Row` accept native gap values. Give selection options unique `value` fields and paginated items stable keys. Use `isActive={false}` to disable an inactive keyboard control.

## Using only what you need

Each screen entry may choose how much framework UI to use. Without extra options, the existing shell, navigation, and shortcuts behave as before:

```ts
// In src/screens/index.ts
{id: 'jobs', label: 'Jobs', Component: JobsScreen},

// Full control of the terminal view, but still inside AppProviders:
{id: 'custom', label: 'Custom', Component: CustomScreen, layout: 'bare', globalKeys: false},
```

`layout: 'bare'` removes the app-provided header, tabs, footer and toast host for that screen, in both interactive and `--plain` rendering. It does **not** remove the providers. `globalKeys: false` is independent of layout: it disables shell shortcuts and their footer hints for that screen, leaving registered screen/control handlers and Ink `useInput` available. If you disable quit/navigation keys, implement your own way to exit or navigate, or use Ctrl+C.

`ScreenLayout` supports a title-free layout with custom spacing:

```tsx
<ScreenLayout paddingX={0} gap={2}>
  <Panel borderStyle="double" paddingX={2} title="Custom panel">
    <Text>Native Ink layout props are supported.</Text>
  </Panel>
</ScreenLayout>
```

`AppShell` can also be used directly with no header and with `showToasts={false}` if you want only part of the shared chrome. These options are additive; existing screens do not need migration.

## Keyboard routing and focus

`AppProviders` installs a `KeymapProvider` and `InputCaptureProvider`. The provider dispatches **one** matching shortcut per keypress, with priority **control > screen > global**. Use `{scope: 'screen'}` for screen shortcuts, `{scope: 'global'}` for shell shortcuts; controls default to `control`. Avoid overlapping shortcuts between simultaneously active controls.

When editing free-form input, avoid conflicting keyboard listeners. `SearchSelect` automatically captures input while active, which pauses regular shortcuts (including Tab, q, t and numeric screen keys). Close or deactivate the search on selection and cancellation:

```tsx
import {Text} from 'ink';
import {useState} from 'react';
import {SearchSelect} from '../components';
import {useKeymap} from '../hooks';

export function PackagePicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('none');

  useKeymap([{key: '/', run: () => setOpen(true)}], {scope: 'screen', isActive: !open});

  return open ? (
    <SearchSelect
      items={[
        {value: 'ink', label: 'Ink'},
        {value: 'react', label: 'React'},
      ]}
      onSelect={(value) => {
        setSelected(value);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
    />
  ) : (
    <Text>Selected: {selected} (press / to choose)</Text>
  );
}
```

For another text editor, call `useInputCapture(isEditing)` while it owns input and release capture when editing stops. Nested controls owned by a capturing editor may use `allowWhenCaptured` with `Select` or `MultiSelect`. Prefer keeping **one text-input control active** at a time. When a child field owns Enter/Escape in a `Stepper`, set `keyboardNav={false}` and navigate using `useStepper()` or the step render callback.

### Handling conflicting input controls

`useKeymap()` registers shortcuts with the provider; only the highest-priority active match runs (`control` > `screen` > `global`, most recently registered within the same scope). Its `isActive` flag is important when a control is mounted but not focused. By contrast, Ink's native `useInput()` has **its own listeners** and is not arbitrated by `KeymapProvider`. Avoid leaving native listeners active beside a competing shortcut handler.

For text input:

1. Call `useInputCapture(isEditing)` for any custom free-form editor that should pause app shortcuts. Built-in `SearchSelect` captures input while active.
2. Set `isActive={false}` on inactive keyboard controls (`Select`, `MultiSelect`, `SearchSelect`, and other controls that support it), or unmount them. Do not render two competing text editors as active at once.
3. `useKeymap` handlers are suspended while input is captured unless a control explicitly sets `allowWhenCaptured: true`. The bundled config editor uses this for child selection controls.
4. Handle Escape and completion inside the active editor, release capture on close and restore normal screen shortcuts. A field-level Enter/Escape handler inside a `Stepper` should generally use `keyboardNav={false}`.

The `Select` component handles arrows, `j`/`k` and Enter; it does **not** include an Escape callback. Handle cancellation in the owning screen. `SearchSelect` handles text, arrows, Enter, Escape (via `onCancel`) and Ctrl+U to clear the query. The footer `hints` are informative only; if a hint says `r refresh`, the screen must register `r` separately.

### Focus test cases

Use `ink-testing-library` (see `tests/keymap-routing.test.tsx` and `tests/collections.test.tsx`) to assert that opening a search pauses Tab, `q`, `t` and number navigation; closing it restores them. Verify inactive selectors do not move on arrow presses, and a single Enter event selects once. Test Escape both from control mode and from the screen itself. Raw `useInput` requires more careful isolation than `useKeymap`.

## Async states and notifications

`useAsync(fn)` calls `fn(signal, ...args)` and returns `run`, `refetch`, `cancel`, and a state with `status` (`idle`, `loading`, `success`, `error`). Each new run aborts the previous signal; unmount also aborts. Operations must pass the signal to their I/O to cancel actual work. Stale results remain ignored even when an operation does not honor cancellation. `refetch()` repeats the last arguments; before the first run it does nothing. `cancel()` returns to idle without showing an error. Retries are explicit, including for operations that mutate data. Start operations from an event or effect, **not during render**. `ScreenState` renders loading, empty, error and success views, but the caller determines whether a successful result is empty.

When upgrading from a version whose callback received only the run arguments
(`fn(...args)`), add the abort signal as the first callback parameter and pass it
to your I/O:

```tsx
// Before
const jobs = useAsync((query: string) => loadJobs(query));
// After
const jobs = useAsync((signal: AbortSignal, query: string) => loadJobs(query, signal));
```

```tsx
// Inside a screen with useEffect, Text, useAsync, ScreenState imported.
// loadJobs is a domain operation returning records with id and name.
const jobs = useAsync((signal) => loadJobs(signal));
useEffect(() => {
  void jobs.run();
}, [jobs.run]);

const status =
  jobs.status === 'idle'
    ? 'loading'
    : jobs.status === 'success' && jobs.data.length === 0
      ? 'empty'
      : jobs.status;

return (
  <ScreenState
    status={status}
    error={jobs.status === 'error' ? jobs.error : undefined}
    title={status === 'empty' ? 'No jobs yet' : undefined}
  >
    {jobs.status === 'success' && jobs.data.map((job) => <Text key={job.id}>{job.name}</Text>)}
  </ScreenState>
);
```

Use `useToast().push(message, tone)` for transient messages, and `StatusMessage` or `Alert` for persistent feedback. Headless subcommands belong in `src/commands/` and must not import Ink. `--plain`, pipes and CI render **one frame without input**: do not rely on a keypress or delayed async update for essential plain output.

## Theme, accessibility and width

Use semantic theme tokens instead of hardcoded colors: `primary`, `accent`, `success`, `warn`, `danger`, `info` and `muted`. For custom rendering use `useTheme()` or `useTone(tone)`. Status must not be communicated by color alone. Respect `NO_COLOR`, `mono` and `--ascii`, including glyph and border fallbacks.

`useTerminalSize()` exposes the current column count. Prefer stacking panels at narrow widths and using Ink flex layouts over rigid dimensions. Wrap or truncate unbounded text. Test around 40, 80 and 120 columns.

Semantic palettes live in `src/theme/palettes.json` and the project fallback in `src/theme/defaults.json`. The `theme:list`, `theme:token` and `theme:default` scripts inspect and edit project source. A runtime theme can be overridden by CLI flag, environment or saved config.

## Responsive terminal layout: worked example

Ink lays out terminal _cells_, not browser pixels. A panel that looks correct at 120 columns can overflow at 40, especially with long IDs, paths, emoji or wide Unicode characters. `useTerminalSize()` reports `columns`, `rows` and `narrow` (`columns < 80`). Let content choose a vertical arrangement on narrow terminals:

```tsx
import {Box, Text} from 'ink';
import {Panel} from '../components';
import {useTerminalSize} from '../hooks';

export function SummaryColumns() {
  const {narrow} = useTerminalSize();

  return (
    <Box flexDirection={narrow ? 'column' : 'row'} gap={1}>
      <Panel flexGrow={1} minWidth={0} title="Jobs">
        <Text wrap="truncate-end">12 jobs</Text>
      </Panel>
      <Panel flexGrow={1} minWidth={0} title="Status">
        <Text wrap="truncate-end">Ready</Text>
      </Panel>
    </Box>
  );
}
```

Keep panel widths flexible, wrap or truncate user-supplied strings and prefer symbols from `useTheme().symbols` over hardcoded Unicode. Use color and an icon or text label together for status. Check wide and narrow layouts under `--ascii` and `NO_COLOR=1`. The starter's `StatusBar` already reduces the number of visible hints as width shrinks (and attempts to retain the quit hint); custom footers need similar handling.

## Deterministic rendering and visual review

The normal `--plain` path uses `PlainView`: it renders a single frame with the appropriate screen and an optional header, but without live keyboard navigation. Treat this as a real output mode for CLI pipelines, not a screenshot of an interactive app. Avoid fetching data only in effects when essential information must appear in plain output. For delayed UI, render an intentional loading state or choose a headless subcommand for machine-readable output.

For static visual review, `npm run screenshot -- --screen home --columns 40 --theme mono --ascii` captures the interactive app's _initial_ frame; unlike `--plain`, it includes the interactive app shell. For asynchronous or input-dependent views, use `--live --ready 'stable text'`. Both methods are documented in [recording](recording.md). Run width-based `renderToString` regression tests for custom components (see `tests/consistent-ui.test.tsx`) and interaction tests with `ink-testing-library`.

A practical new-screen checklist:

- Launch `npm run dev -- --screen <id> --plain` and confirm its static content is meaningful.
- Run the interactive view in a real terminal; test Tab, the command menu, a screen-specific key and quit/back behavior.
- Verify loading, empty, error and success states; avoid displaying stale data after a later request supersedes an earlier one.
- Capture 40, 80 and 120 columns where relevant; test mono, ASCII and a light theme.
- Add a repeatable screenshot example or recording workflow when the new feature has important visual behavior.

## Testing and quality

- Run `npm run typecheck`, `npm test`, and `npm run build`.
- Use `ink-testing-library` for keyboard/focus assertions, and Ink `renderToString()` for deterministic width-specific frames.
- Exercise TTY interactions, `--plain` output, loading/error/empty states, long text, narrow widths, mono/ASCII and multiple themes.
- Never call `console.log` while Ink is rendering; use the logger for diagnostics and keep headless output separate.
- When changing a framework convention, update this guide, the feature documentation, and regression tests.

For the next implementation step, consult [adding a feature](adding-a-feature.md).

## Gallery and terminal modes

Run `npm run dev -- --screen gallery` for Table, PaginatedList, MultiSelect,
route params, and async states in a local list/detail example. Enter opens the
selected item, Escape returns, `f` opens the status filter, `r` reloads, `e`
shows an empty result and `x` simulates an error. Only the filter owns input while
it is open. The initial frame uses deterministic local records in plain mode.

`--screen-reader` (or Ink's `INK_SCREEN_READER=true`) enables Ink's built-in
accessible renderer in interactive sessions. Shared selectors expose roles,
labels and states; custom controls should do the same. `--plain` remains a
synchronous static frame and does not use Ink's screen-reader renderer.

`--alternate-screen` opts into Ink's alternate buffer in interactive sessions;
Ink restores the primary buffer at exit. The default remains inline. Both flags
are runtime rendering options, not saved settings. See
[Ink's rendering options](https://github.com/vadimdemedes/ink#rendertree-options).

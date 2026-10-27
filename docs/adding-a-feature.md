# Add your first feature

The template has no predefined business domain. Add only the pieces needed by
your application. Read [the UI framework guide](ui-framework.md) before adding interactive
controls; it explains provider ownership, component selection, input capture,
semantic styling and async states.

1. Create `src/features/example/` for pure models and operations if needed.
2. Add `src/screens/Example.tsx` and register the screen in `src/screens/index.ts`.
3. If required, add a noninteractive subcommand to `src/commands/index.ts`.
4. Add typed configuration in `src/config/schema.ts` only when necessary (see [configuration](configuration.md) for schema, editor fields and persistence).
5. Write tests under `tests/` and run `npm run typecheck`, `npm test`, and `npm run build`.

## Minimal screen

```tsx
// src/screens/Example.tsx
import {Text} from 'ink';
import {Panel, ScreenLayout} from '../components';

export function ExampleScreen() {
  return (
    <ScreenLayout title="Example" description="An example feature">
      <Panel title="Overview">
        <Text>Your content goes here.</Text>
      </Panel>
    </ScreenLayout>
  );
}
```

Import and register it in `src/screens/index.ts`:

```ts
import {ExampleScreen} from './Example';

// Add to the exported screens array:
{id: 'example', label: 'Example', Component: ExampleScreen},
```

The screen now has a tab and `--screen example`. It also gets a numeric
shortcut if it is among the first nine visible screens. The footer and Help
derive the available numeric shortcut range from the screen registry; no edits
to `src/keys.ts` are needed. Add optional `hints` to the `ScreenDef`
when a screen has local actions, and use `ScreenState` for async states.

## Full-control screen (optional)

For a screen that supplies its own layout and keyboard behavior, register it with:

```ts
{id: 'custom', label: 'Custom', Component: CustomScreen, layout: 'bare', globalKeys: false},
```

A `bare` screen bypasses the app header, tabs, toasts and footer (including in `--plain` output), but still receives the theme, router, config, and keymap providers. `globalKeys: false` is independent of the layout choice; omit it to retain the default app shortcuts. Use Ink `Box`, `Text`, or `useInput` directly. When disabling global shortcuts, provide your own exit/navigation keys if needed.

## Minimal headless command

Define the command once, then add it to `commands` in `src/commands/index.ts`:

```ts
import {z} from 'zod';
import {defineCommand} from './definition';

export const exampleCommand = defineCommand({
  name: 'example',
  description: 'Run the example',
  options: [{flags: '--limit <count>', description: 'Maximum results'}],
  schema: z.object({limit: z.coerce.number().int().positive().default(10)}),
  run: async ({options, context}) => {
    const result = await loadResults(context.signal, options.limit);
    context.output(context.flags.json ? JSON.stringify(result) : result.join('\n'));
  },
});
```

The schema gives the handler typed options and validates Commander output.
`arguments: '<id>'` declares positional arguments; handlers receive `args`.
Use `defineCommandGroup` for nested commands. The CLI loops over the registry;
no entry-point edit is needed. Completion scripts derive from that same tree.
Headless commands load without React or Ink.

`context.output()` writes results to stdout, including under `--quiet`.
`context.notice()` writes human notices to stderr unless quiet or JSON output is
selected. `context.flags` contains shared options such as `config`, `json`, and
`verbose`; `context.signal` aborts on SIGINT/SIGTERM. Avoid direct process exits:
throw `AppError` with an appropriate exit code, or set `process.exitCode` for a
completed diagnostic command.

The shipped `example` command and Gallery screen share `listItems` in
`src/features/example/items.ts`. Try `example --status ready --json` or pipe an
array of `{id, name, status, description}` records into `example - --json`.
Headless commands read stdin **only** when the caller passes the explicit `-`
argument; they never auto-read piped input, so a command exits promptly even
when a caller leaves stdin open. Model any new piped-input command on `example`
or `config set` and their `readInput` usage.
The example is local and removable: remove its screen registrations, command
registration, feature module, and corresponding tests when replacing it.

## UI conventions for features

- The default shared `AppShell` supplies header, tabs, toasts, command palette and footer. Use `ScreenLayout` for convenient heading/spacing, or opt out with `layout: 'bare'` and compose native Ink elements directly.
- Use `useKeymap([{key: 'r', run: refresh}], {scope: 'screen'})` for screen actions. Add corresponding footer `hints` to the screen registry. Don't wire a second global keyboard handler.
- Interactive `Select`, `MultiSelect`, `Toggle` and `PaginatedList` controls accept `isActive={false}` when another control owns input. `SearchSelect` captures text input while active; deactivate or unmount it on selection/cancel.
- Use `useAsync` and `ScreenState` for loading, empty, error and success results; call your domain operation from events/effects rather than render.
- Use `useTheme` / `useTone` for colors and `useTerminalSize` for responsive layouts. Test `--plain`, mono/ASCII and narrow widths.

See [the UI framework guide](ui-framework.md) for screen, focus and async examples. Use [the recording guide](recording.md) to capture a new screen after registering its ID.

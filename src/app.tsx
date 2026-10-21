import {useState, type ReactNode} from 'react';
import pkg from '../package.json';
import {AppShell, Badge, CommandMenu, ErrorBoundary, Header, StatusBar, Tabs} from './components';
import {ConfigRuntimeProvider} from './config/context';
import type {Config} from './config';
import {
  useExit,
  useKeymap,
  useRouter,
  RouterProvider,
  ToastProvider,
  InputCaptureProvider,
  useHasInputCapture,
} from './hooks';
import {getGlobalBindings, getGlobalKeys, type KeyHint} from './keys';
import {navScreens, screens} from './screens';
import {ThemeProvider, useThemeControls} from './theme/context';
import type {ThemeName} from './theme/tokens';

export interface AppOptions {
  theme: ThemeName;
  ascii: boolean;
  debug: boolean;
  screen: string;
  configFile?: string;
  configFlags?: Partial<Config>;
}

export function AppProviders({options, children}: {options: AppOptions; children: ReactNode}) {
  return (
    <ConfigRuntimeProvider path={options.configFile} flags={options.configFlags}>
      <ThemeProvider name={options.theme} ascii={options.ascii}>
        <InputCaptureProvider>
          <ToastProvider>
            <RouterProvider initial={options.screen}>
              <ErrorBoundary debug={options.debug}>{children}</ErrorBoundary>
            </RouterProvider>
          </ToastProvider>
        </InputCaptureProvider>
      </ThemeProvider>
    </ConfigRuntimeProvider>
  );
}

const menuHints: KeyHint[] = [
  {key: '↑/↓', label: 'navigate'},
  {key: 'enter', label: 'select'},
  {key: 'esc', label: 'close'},
];
const inputHints: KeyHint[] = [
  {key: 'esc', label: 'back'},
  {key: 'enter', label: 'edit/select'},
];

function Shell() {
  const router = useRouter();
  const exit = useExit();
  const {theme, cycleTheme} = useThemeControls();
  const inputCaptured = useHasInputCapture();
  const [commandOpen, setCommandOpen] = useState(false);

  const index = Math.max(0, navScreens.findIndex((s) => s.id === router.current));
  const go = (i: number) =>
    router.replace(navScreens[(i + navScreens.length) % navScreens.length]!.id);

  useKeymap(
    getGlobalBindings(
      navScreens.length,
      {
        next: () => go(index + 1),
        previous: () => go(index - 1),
        commands: () => setCommandOpen(true),
        theme: cycleTheme,
        help: () => router.replace('help'),
        quit: exit,
      },
      go,
    ),
    {isActive: !inputCaptured && !commandOpen},
  );

  const screen = screens.find((s) => s.id === router.current) ?? navScreens[0]!;
  const Screen = screen.Component;
  const hints = commandOpen
    ? menuHints
    : inputCaptured
      ? inputHints
      : [...(screen.hints ?? []), ...getGlobalKeys(navScreens.length)];

  return (
    <AppShell
      header={
        <Header
          title={pkg.name}
          version={pkg.version}
          right={<Badge tone="accent">{theme.name}</Badge>}
        />
      }
      nav={<Tabs items={navScreens} activeId={router.current} />}
      footer={<StatusBar hints={hints} />}
    >
      {commandOpen ? (
        <CommandMenu
          items={navScreens.map((item) => ({id: item.id, label: item.label, hint: 'Go to screen'}))}
          onSelect={(id) => {
            router.replace(id);
            setCommandOpen(false);
          }}
          onCancel={() => setCommandOpen(false)}
        />
      ) : (
        <Screen />
      )}
    </AppShell>
  );
}

export const App = ({options}: {options: AppOptions}) => (
  <AppProviders options={options}>
    <Shell />
  </AppProviders>
);

/** Static, non-interactive rendering of one screen (pipes, CI, --plain). */
export function PlainView({options}: {options: AppOptions}) {
  const Screen = (screens.find((s) => s.id === options.screen) ?? screens[0]!).Component;
  return (
    <AppProviders options={options}>
      <AppShell header={<Header title={pkg.name} version={pkg.version} />}>
        <Screen />
      </AppShell>
    </AppProviders>
  );
}

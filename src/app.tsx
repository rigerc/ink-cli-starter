import type {ReactNode} from 'react';
import pkg from '../package.json';
import {AppShell, Badge, ErrorBoundary, Header, StatusBar, Tabs} from './components';
import {useExit, useKeymap, useRouter, RouterProvider, ToastProvider, InputCaptureProvider, useHasInputCapture} from './hooks';
import {globalKeys} from './keys';
import {screens} from './screens';
import {ThemeProvider, useThemeControls} from './theme/context';
import type {ThemeName} from './theme/tokens';

export interface AppOptions {
  theme: ThemeName;
  ascii: boolean;
  debug: boolean;
  screen: string;
}

export function AppProviders({options, children}: {options: AppOptions; children: ReactNode}) {
  return (
    <ThemeProvider name={options.theme} ascii={options.ascii}>
      <InputCaptureProvider>
        <ToastProvider>
          <RouterProvider initial={options.screen}>
            <ErrorBoundary debug={options.debug}>{children}</ErrorBoundary>
          </RouterProvider>
        </ToastProvider>
      </InputCaptureProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const router = useRouter();
  const exit = useExit();
  const {theme, cycleTheme} = useThemeControls();
  const inputCaptured = useHasInputCapture();

  const index = Math.max(0, screens.findIndex((s) => s.id === router.current));
  const go = (i: number) => router.replace(screens[(i + screens.length) % screens.length]!.id);

  useKeymap([
    {key: 'q', run: () => exit()},
    {key: 'tab', run: () => go(index + 1)},
    {key: 'shift+tab', run: () => go(index - 1)},
    {key: 't', run: cycleTheme},
    {key: '?', run: () => router.replace('help')},
    ...screens.map((s, i) => ({key: String(i + 1), run: () => go(i)})),
  ], {isActive: !inputCaptured});

  const Screen = screens[index]!.Component;
  return (
    <AppShell
      header={<Header title="ink-kit" version={pkg.version} right={<Badge tone="accent">{theme.name}</Badge>} />}
      nav={<Tabs items={screens} activeId={router.current} />}
      footer={<StatusBar hints={inputCaptured ? [{key: 'esc', label: 'leave search'}, {key: 'enter', label: 'select'}] : [...globalKeys]} />}
    >
      <Screen />
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
      <AppShell header={<Header title="ink-kit" version={pkg.version} />}>
        <Screen />
      </AppShell>
    </AppProviders>
  );
}

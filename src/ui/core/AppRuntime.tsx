import {useState} from 'react';
import {Badge, CommandMenu, Header, StatusBar, Tabs} from '../../components';
import {
  useExit,
  useActionHints,
  useHasInputCapture,
  useKeymap,
  useRouter,
} from '../../hooks';
import {getGlobalBindings, getGlobalKeys, type KeyHint} from '../../keys';
import {useThemeControls} from '../../theme/context';
import {AppProviders, type AppOptions} from './AppProviders';
import type {UIAppDefinition} from './defineApp';
import {ScreenFrame} from '../layout/ScreenFrame';

const menuHints: KeyHint[] = [
  {key: '↑/↓', label: 'navigate'},
  {key: 'enter', label: 'select'},
  {key: 'esc', label: 'close'},
];

const inputHints: KeyHint[] = [
  {key: 'esc', label: 'back'},
  {key: 'enter', label: 'edit/select'},
];

function ActiveScreen({definition}: {definition: UIAppDefinition}) {
  const router = useRouter();
  const exit = useExit();
  const {theme, cycleTheme} = useThemeControls();
  const inputCaptured = useHasInputCapture();
  const actionHints = useActionHints();
  const [commandOpen, setCommandOpen] = useState(false);
  const screen = definition.findScreen(router.current) ?? definition.findScreen(definition.initialScreen)!;
  const navScreens = definition.navScreens;
  const index = Math.max(0, navScreens.findIndex((item) => item.id === router.current));
  const go = (i: number) => {
    if (!navScreens.length) return;
    router.replace(navScreens[((i % navScreens.length) + navScreens.length) % navScreens.length]!.id);
  };

  useKeymap(
    getGlobalBindings(
      navScreens.length,
      {
        next: () => go(index + 1),
        previous: () => go(index - 1),
        commands: () => setCommandOpen(true),
        theme: cycleTheme,
        help: () => {
          if (definition.findScreen('help')) router.replace('help');
        },
        quit: exit,
      },
      go,
    ),
    {isActive: screen.globalKeys !== false && !inputCaptured && !commandOpen, scope: 'global'},
  );

  const contextualHints = [
    ...(screen.hints ?? []),
    ...actionHints,
    ...(screen.globalKeys === false ? [] : getGlobalKeys(navScreens.length)),
  ];
  const hints = commandOpen
    ? menuHints
    : inputCaptured
      ? inputHints
      : contextualHints.filter(
          (hint, position) => contextualHints.findIndex((item) => item.key === hint.key) === position,
        );

  const Screen = screen.Component;
  const brand = definition.brand;

  return (
    <ScreenFrame
      shell={definition.shell}
      layout={screen.layout}
      chrome={screen.chrome}
      header={
        brand && (
          <Header
            title={brand.title}
            version={brand.version}
            right={<Badge tone="accent">{theme.name}</Badge>}
          />
        )
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
    </ScreenFrame>
  );
}

export function AppRuntime({definition, options}: {definition: UIAppDefinition; options: AppOptions}) {
  return (
    <AppProviders options={options} themes={definition.themes}>
      <ActiveScreen definition={definition} />
    </AppProviders>
  );
}

/** One-frame view for pipes and CI; no interactive navigation or toast host. */
export function PlainRuntime({definition, options}: {definition: UIAppDefinition; options: AppOptions}) {
  const screen = definition.findScreen(options.screen) ?? definition.findScreen(definition.initialScreen)!;
  const Screen = screen.Component;
  const brand = definition.brand;

  return (
    <AppProviders options={options}>
      <ScreenFrame
        shell={definition.shell}
        layout={screen.layout}
        chrome={{...screen.chrome, nav: false, footer: false, toasts: false}}
        header={brand && <Header title={brand.title} version={brand.version} />}
      >
        <Screen />
      </ScreenFrame>
    </AppProviders>
  );
}

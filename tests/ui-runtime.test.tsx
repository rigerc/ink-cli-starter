import {Box, Text, renderToString} from 'ink';
import {describe, expect, it, vi} from 'vite-plus/test';
import {defineApp, AppRuntime, PlainRuntime} from '../src/app';
import type {AppShellProps} from '../src/components/AppShell';
import {ActionProvider, useAction, useActionHints} from '../src/hooks/useActions';
import {InputCaptureProvider} from '../src/hooks/useInputCapture';
import {KeymapProvider, useKeymap, useManagedInput} from '../src/hooks/useKeymap';
import {ThemeProvider, useTheme} from '../src/theme/context';
import {themes} from '../src/theme/themes';
import {mount, press, settle} from './helpers/terminal';

const options = {screen: 'main', theme: 'mono', ascii: true, debug: false};

const Main = () => <Text>Main screen</Text>;
const Extra = () => <Text>Extra screen</Text>;

function CustomShell({header, nav, footer, children}: AppShellProps) {
  return (
    <Box flexDirection="column">
      <Text>Custom shell</Text>
      {header}
      {nav}
      {children}
      {footer}
    </Box>
  );
}

describe('composable UI runtime', () => {
  it('validates screen identities and maintains a live registry', () => {
    const screens = [{id: 'main', label: 'Main', Component: Main}];
    const definition = defineApp({initialScreen: 'main', screens});

    expect(definition.findScreen('main')?.label).toBe('Main');
    expect(definition.navScreens).toHaveLength(1);
    screens.push({id: 'extra', label: 'Extra', Component: Extra});
    expect(definition.navScreens).toHaveLength(2);

    expect(() => defineApp({initialScreen: 'missing', screens})).toThrow('Unknown initial screen');

    expect(() => defineApp({initialScreen: 'main', screens: [...screens, screens[0]!]})).toThrow(
      'Duplicate or empty screen id',
    );
  });

  it('renders custom shell and selectively hides individual chrome regions', () => {
    const definition = defineApp({
      initialScreen: 'main',
      screens: [{id: 'main', label: 'Main', Component: Main, chrome: {nav: false, footer: false}}],
      shell: CustomShell,
      brand: {title: 'test-cli', version: '2.0.0'},
    });

    const frame = renderToString(<AppRuntime definition={definition} options={options} />);
    expect(frame).toContain('Custom shell');
    expect(frame).toContain('test-cli');
    expect(frame).toContain('Main screen');
    expect(frame).not.toContain('jump to screen');

    const plain = renderToString(<PlainRuntime definition={definition} options={options} />);
    expect(plain).toContain('Main screen');
    expect(plain).not.toContain('quit');
  });

  it('can render a bare view without the custom shell', () => {
    const definition = defineApp({
      initialScreen: 'main',
      screens: [{id: 'main', label: 'Main', Component: Main, layout: 'bare'}],
      shell: CustomShell,
    });

    const frame = renderToString(<PlainRuntime definition={definition} options={options} />);
    expect(frame).toContain('Main screen');
    expect(frame).not.toContain('Custom shell');
  });

  it('accepts an additional named theme in an application definition', () => {
    function ThemeName() {
      const theme = useTheme();
      return <Text>{theme.name}</Text>;
    }

    const custom = {...themes.dark, name: 'custom'};
    const definition = defineApp({
      initialScreen: 'main',
      screens: [{id: 'main', label: 'Main', Component: ThemeName}],
      themes: {custom},
    });

    expect(
      renderToString(
        <PlainRuntime definition={definition} options={{...options, theme: 'custom'}} />,
      ),
    ).toContain('custom');

    expect(
      renderToString(
        <ThemeProvider name="custom" registry={{custom}}>
          <ThemeName />
        </ThemeProvider>,
      ),
    ).toContain('custom');
  });
});

describe('shared input and contextual actions', () => {
  it('delivers raw input to a managed control before a global shortcut', async () => {
    const calls: string[] = [];

    function Fixture() {
      useKeymap([{key: 'x', run: () => calls.push('global')}], {scope: 'global'});
      useManagedInput(
        (input) => {
          if (input !== 'x') return false;
          calls.push('control');
          return true;
        },
        {scope: 'control'},
      );

      return <Text>Ready</Text>;
    }

    const app = await mount(
      <InputCaptureProvider>
        <KeymapProvider>
          <Fixture />
        </KeymapProvider>
      </InputCaptureProvider>,
    );
    await press(app, 'x');

    expect(calls).toEqual(['control']);
  });

  it('derives footer hints from registered actions and activates their binding', async () => {
    const run = vi.fn();

    function ActionFixture() {
      useAction({id: 'refresh', key: 'r', label: 'refresh', run});
      return <Text>Action ready</Text>;
    }

    function Fixture() {
      const hints = useActionHints();
      return (
        <Box flexDirection="column">
          <ActionFixture />
          <Text>{hints.map(({key, label}) => `${key}: ${label}`).join(', ')}</Text>
        </Box>
      );
    }

    const app = await mount(
      <InputCaptureProvider>
        <KeymapProvider>
          <ActionProvider>
            <Fixture />
          </ActionProvider>
        </KeymapProvider>
      </InputCaptureProvider>,
    );
    await settle();
    expect(app.lastFrame()).toContain('r: refresh');
    await press(app, 'r');
    expect(run).toHaveBeenCalledOnce();
  });
});

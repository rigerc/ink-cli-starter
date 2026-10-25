import {Text, renderToString} from 'ink';
import stringWidth from 'string-width';
import {describe, expect, it, vi} from 'vite-plus/test';
import {App, PlainView, ScreenFrame} from '../src/app';
import {AppShell, Panel, Row, ScreenLayout, ScreenState, Stack, StatusBar} from '../src/components';
import {getGlobalBindings, getGlobalKeys} from '../src/keys';
import {screens} from '../src/screens';
import {ThemeProvider} from '../src/theme/context';
import {mount, press, settle} from './helpers/terminal';

const options = {theme: 'mono' as const, ascii: true, debug: false, screen: 'home'};

describe('consistent terminal UI', () => {
  it('uses the same global action registry for help hints and key bindings', () => {
    const next = vi.fn();
    const previous = vi.fn();
    const commands = vi.fn();
    const theme = vi.fn();
    const help = vi.fn();
    const quit = vi.fn();
    const jump = vi.fn();
    const bindings = getGlobalBindings(
      3,
      {next, previous, commands, theme, help, quit},
      jump,
    );
    expect(bindings.map((binding) => binding.key)).toEqual([
      'tab', 'shift+tab', '1', '2', '3', 'ctrl+k', 't', '?', 'q',
    ]);
    expect(getGlobalKeys(3).find((key) => key.label === 'jump to screen')?.key).toBe('1-3');
    bindings.find((binding) => binding.key === '2')?.run();
    expect(jump).toHaveBeenCalledWith(1);
    bindings.find((binding) => binding.key === 'ctrl+k')?.run();
    expect(commands).toHaveBeenCalledOnce();
  });

  it('renders the same screen header and async states in mono mode', () => {
    for (const status of ['loading', 'empty', 'error', 'success'] as const) {
      const out = renderToString(
        <ThemeProvider name="mono" ascii>
          <ScreenLayout title="Packages" description="Manage packages">
            <ScreenState status={status} message="Test state" />
          </ScreenLayout>
        </ThemeProvider>,
        {columns: 60},
      );
      expect(out).toContain('Packages');
      expect(out).toContain('Test state');
    }
  });

  it('keeps contextual keyboard hints within narrow terminal widths', () => {
    const hints = [
      {key: 'r', label: 'retry'},
      {key: 'x', label: 'simulate failure'},
      ...getGlobalKeys(5),
    ];
    for (const columns of [40, 60, 80, 120]) {
      const out = renderToString(
        <ThemeProvider name="mono" ascii>
          <StatusBar hints={hints} />
        </ThemeProvider>,
        {columns},
      );
      for (const line of out.split('\n'))
        expect(stringWidth(line)).toBeLessThanOrEqual(columns);
      expect(out).toContain('[r]');
      expect(out).toContain('[q]');
    }
  });


  it('keeps the shared shell by default but allows a bare screen', () => {
    const shared = renderToString(
      <ScreenFrame header={<Text>App title</Text>} footer={<Text>Footer</Text>}>
        <Text>Content</Text>
      </ScreenFrame>,
      {columns: 80},
    );
    expect(shared).toContain('App title');
    expect(shared).toContain('Footer');

    const bare = renderToString(
      <ScreenFrame layout="bare" header={<Text>App title</Text>} footer={<Text>Footer</Text>}>
        <Text>Custom content</Text>
      </ScreenFrame>,
      {columns: 80},
    );
    expect(bare).toContain('Custom content');
    expect(bare).not.toContain('App title');
    expect(bare).not.toContain('Footer');
  });

  it('respects bare layout when rendering a registered screen in plain mode', () => {
    const testScreen = {
      id: 'test-bare-screen',
      label: 'Bare',
      Component: () => <Text>Standalone view</Text>,
      layout: 'bare' as const,
      globalKeys: false,
      showInNav: false,
    };
    screens.push(testScreen);
    try {
      const out = renderToString(
        <PlainView options={{...options, screen: testScreen.id}} />,
        {columns: 80},
      );
      expect(out).toContain('Standalone view');
      expect(out).not.toContain('ink-kit');
    } finally {
      screens.pop();
    }
  });

  it('supports custom Ink layouts without forcing a title or spacing scale', () => {
    const out = renderToString(
      <ThemeProvider name="mono" ascii>
        <AppShell showToasts={false}>
          <ScreenLayout paddingX={0} gap={6}>
            <Stack gap={5}>
              <Panel title="Custom" borderStyle="double" paddingX={2}>
                <Text>Flexible panel</Text>
              </Panel>
              <Row gap={8}><Text>One</Text><Text>Two</Text></Row>
            </Stack>
          </ScreenLayout>
        </AppShell>
      </ThemeProvider>,
      {columns: 80},
    );
    expect(out).toContain('Flexible panel');
    expect(out).toContain('One');
    expect(out).toContain('Two');
  });

  it('navigates via the command menu and restores the current screen on cancel', async () => {
    const app = await mount(<App options={options} />);
    expect(app.lastFrame()).toContain('Home');
    await press(app, '\u000b'); // Ctrl+K
    await settle();
    expect(app.lastFrame()).toContain('Commands');
    await press(app, 'settings');
    expect(app.lastFrame()).toContain('Settings');
    await press(app, '\r');
    await settle();
    expect(app.lastFrame()).toContain('Review and configure application preferences');
    await press(app, '\u000b');
    await settle();
    expect(app.lastFrame()).toContain('Commands');
    await press(app, '\u001b');
    await settle();
    expect(app.lastFrame()).toContain('Review and configure application preferences');
  });
});

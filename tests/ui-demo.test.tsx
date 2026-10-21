import {renderToString} from 'ink';
import stringWidth from 'string-width';
import {describe, expect, it} from 'vite-plus/test';
import {App, AppProviders, PlainView} from '../src/app';
import {UiDemoScreen} from '../src/screens/UiDemo';
import {themeNames} from '../src/theme/tokens';
import {mount, press} from './helpers/terminal';

const options = {theme: 'mono' as const, ascii: true, debug: false, screen: 'ui-demo'};

describe('UI demo', () => {
  it('uses the existing application header, tabs and footer', () => {
    const output = renderToString(
      <App options={options} />,
      {columns: 100},
    );
    expect(output).toContain('ink-kit');
    expect(output).toContain('UI Demo');
    expect(output).toContain('Workspace');
    expect(output).toContain('Pipeline');
    expect(output).toContain('Recent activity');
    expect(output).toContain('next state');
    expect(output).toContain('quit');
  });

  it('cycles the standard screen states and resets without performing I/O', async () => {
    const app = await mount(<App options={options} />);
    expect(app.lastFrame()).toContain('All checks complete');
    await press(app, 's');
    expect(app.lastFrame()).toContain('Loading sample results');
    await press(app, 's');
    expect(app.lastFrame()).toContain('Nothing queued');
    await press(app, 's');
    expect(app.lastFrame()).toContain('Demo failure');
    await press(app, 'r');
    expect(app.lastFrame()).toContain('All checks complete');
    await press(app, 'm');
    expect(app.lastFrame()).toContain('This is a sample notification.');
  });

  it('opens the existing global command menu from the UI demo', async () => {
    const app = await mount(<App options={options} />);
    await press(app, '\u000b'); // Ctrl+K
    expect(app.lastFrame()).toContain('Commands');
    expect(app.lastFrame()).toContain('UI Demo');
    await press(app, '\u001b');
    expect(app.lastFrame()).toContain('Workspace');
  });

  for (const theme of themeNames) {
    for (const columns of [40, 60, 80, 120]) {
      it(`renders ${theme} / ${columns} columns without overflowing`, () => {
        const output = renderToString(
          <AppProviders options={{...options, theme}}>
            <UiDemoScreen />
          </AppProviders>,
          {columns},
        );
        for (const line of output.split('\n'))
          expect(stringWidth(line)).toBeLessThanOrEqual(columns);
      });
    }
  }

  it('renders a plain static preview for pipes and CI', () => {
    const output = renderToString(<PlainView options={options} />, {columns: 80});
    expect(output).toContain('UI Demo');
    expect(output).toContain('All checks complete');
  });
});

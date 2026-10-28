import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {Box, Text, renderToString} from 'ink';
import {describe, expect, it} from 'vite-plus/test';
import {AppRuntime, PlainRuntime, defineApp} from '../src/app';
import type {AppShellProps} from '../src/components/AppShell';
import {mount, sendKey} from './helpers/ink';

const options = {
  screen: 'overview',
  theme: 'mono',
  ascii: true,
  debug: false,
  configFile: join(tmpdir(), 'ink-cli-starter-test-absent-config.json'),
};

const Overview = () => <Text>Overview body</Text>;
const Details = () => <Text>Details body</Text>;

function Shell({header, nav, footer, children}: AppShellProps) {
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

describe('application composition', () => {
  it('rejects invalid registries and resolves visible screens', () => {
    expect(() => defineApp({screens: [], initialScreen: 'x'})).toThrow('At least one screen');
    expect(() =>
      defineApp({
        screens: [{id: 'overview', label: 'Overview', Component: Overview}],
        initialScreen: 'missing',
      }),
    ).toThrow('Unknown initial screen');
    expect(() =>
      defineApp({
        screens: [
          {id: 'overview', label: 'Overview', Component: Overview},
          {id: 'overview', label: 'Duplicate', Component: Details},
        ],
        initialScreen: 'overview',
      }),
    ).toThrow('Duplicate or empty screen id');

    const app = defineApp({
      screens: [
        {id: 'overview', label: 'Overview', Component: Overview},
        {id: 'details', label: 'Details', Component: Details, showInNav: false},
      ],
      initialScreen: 'overview',
    });
    expect(app.findScreen('details')?.label).toBe('Details');
    expect(app.navScreens.map((item) => item.id)).toEqual(['overview']);
  });

  it('shows contextual screen hints in the footer', () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [
        {
          id: 'overview',
          label: 'Overview',
          Component: Overview,
          hints: [{key: 'r', label: 'refresh'}],
        },
      ],
    });
    const output = renderToString(<AppRuntime definition={app} options={options} />, {
      columns: 80,
    });
    expect(output).toContain('[r]');
    expect(output).toContain('refresh');
  });

  it('renders a custom shell while honoring individual chrome switches', () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [
        {
          id: 'overview',
          label: 'Overview',
          Component: Overview,
          chrome: {nav: false, footer: false},
        },
      ],
      brand: {title: 'example-cli', version: '1.2.3'},
      shell: Shell,
    });
    const output = renderToString(<AppRuntime definition={app} options={options} />);
    expect(output).toContain('Custom shell');
    expect(output).toContain('example-cli');
    expect(output).toContain('Overview body');
    expect(output).not.toContain('next screen');
  });

  it('renders the screen tabs inside the header by default', () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [
        {id: 'overview', label: 'Overview', Component: Overview},
        {id: 'details', label: 'Details', Component: Details},
      ],
      brand: {title: 'example-cli', version: '1.2.3'},
    });
    const output = renderToString(<AppRuntime definition={app} options={options} />, {columns: 80});
    const brandLine = output.split('\n').find((line) => line.includes('example-cli'));
    expect(brandLine).toBeDefined();
    expect(brandLine).toContain('1 Overview');
    expect(brandLine).toContain('2 Details');
    expect(brandLine).not.toContain('Overview body');
  });

  it('keeps every tab visible when the header wraps at narrow widths', () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [
        {id: 'overview', label: 'Overview', Component: Overview},
        {id: 'details', label: 'Details', Component: Details},
      ],
      brand: {title: 'example-cli', version: '1.2.3'},
    });
    const output = renderToString(<AppRuntime definition={app} options={options} />, {columns: 40});
    expect(output).toContain('1 Overview');
    expect(output).toContain('2 Details');
  });

  it('omits the tabs from the header when nav chrome is disabled', () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [
        {
          id: 'overview',
          label: 'Alpha',
          Component: Overview,
          chrome: {nav: false},
        },
        {id: 'details', label: 'Beta', Component: Details},
      ],
      brand: {title: 'example-cli', version: '1.2.3'},
    });
    const output = renderToString(<AppRuntime definition={app} options={options} />);
    expect(output).toContain('example-cli');
    expect(output).not.toContain('1 Alpha');
    expect(output).not.toContain('2 Beta');
  });

  it('still passes the tabs to a custom shell as a separate nav region', () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [
        {id: 'overview', label: 'Overview', Component: Overview},
        {id: 'details', label: 'Details', Component: Details},
      ],
      brand: {title: 'example-cli', version: '1.2.3'},
      shell: Shell,
    });
    const output = renderToString(<AppRuntime definition={app} options={options} />, {columns: 80});
    expect(output).toContain('Custom shell');
    expect(output).toContain('1 Overview');
    const brandLine = output.split('\n').find((line) => line.includes('example-cli'));
    expect(brandLine).not.toContain('1 Overview');
  });

  it('renders bare screens without any supplied shell', () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [{id: 'overview', label: 'Overview', Component: Overview, layout: 'bare'}],
      shell: Shell,
    });
    const output = renderToString(<PlainRuntime definition={app} options={options} />);
    expect(output).toContain('Overview body');
    expect(output).not.toContain('Custom shell');
  });

  it('uses the screen registry to navigate with a global shortcut', async () => {
    const app = defineApp({
      initialScreen: 'overview',
      screens: [
        {id: 'overview', label: 'Overview', Component: Overview},
        {id: 'details', label: 'Details', Component: Details},
      ],
    });
    const instance = await mount(<AppRuntime definition={app} options={options} />);
    expect(instance.lastFrame()).toContain('Overview body');
    await sendKey(instance, '2');
    expect(instance.lastFrame()).toContain('Details body');
  });
});

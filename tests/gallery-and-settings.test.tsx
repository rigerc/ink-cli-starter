import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {renderToString} from 'ink';
import stringWidth from 'string-width';
import {describe, expect, it} from 'vite-plus/test';
import {App, PlainView} from '../src/app';
import {mount, sendKey, flushFrame} from './helpers/ink';
import {withAsyncWorkspace, withWorkspace} from './helpers/fixtures';

const options = {theme: 'mono', ascii: true, debug: false, screen: 'gallery'};
describe('gallery example', () => {
  it.each([40, 80, 120])('fits Unicode output at %i columns', (columns) =>
    withWorkspace((directory) => {
      const output = renderToString(
        <PlainView
          options={{
            ...options,
            theme: 'dark',
            ascii: false,
            configFile: join(directory, 'settings.json'),
          }}
        />,
        {columns},
      );
      expect(output).toContain('Build package');
      for (const line of output.split('\n')) expect(stringWidth(line)).toBeLessThanOrEqual(columns);
    }),
  );

  it.each([40, 80, 120])('renders a meaningful static frame within %i columns', (columns) =>
    withWorkspace((directory) => {
      const output = renderToString(
        <PlainView options={{...options, configFile: join(directory, 'settings.json')}} />,
        {columns},
      );
      expect(output).toContain('Gallery');
      expect(output).toContain('Build package');
      expect(output).toContain('Status summary');
      for (const line of output.split('\n')) expect(stringWidth(line)).toBeLessThanOrEqual(columns);
    }),
  );

  it('opens details, goes back, owns filter input, and demonstrates async states', async () =>
    withAsyncWorkspace(async (directory) => {
      const app = await mount(
        <App options={{...options, configFile: join(directory, 'settings.json')}} />,
      );
      await sendKey(app, '\r');
      expect(app.lastFrame()).toContain('Compile the application');
      await sendKey(app, '\u001b');
      expect(app.lastFrame()).toContain('Example work items');
      await sendKey(app, 'f');
      await sendKey(app, '1');
      expect(app.lastFrame()).toContain('Filter statuses');
      await sendKey(app, ' ');
      await sendKey(app, '\r');
      expect(app.lastFrame()).not.toContain('Build package');
      await sendKey(app, 'e');
      await flushFrame();
      await flushFrame();
      await flushFrame();
      expect(app.lastFrame()).toContain('No matching items');
      await sendKey(app, 'x');
      await flushFrame();
      await flushFrame();
      await flushFrame();
      expect(app.lastFrame()).toContain('Example refresh failed');
      await sendKey(app, 'r');
      await flushFrame();
      await flushFrame();
      await flushFrame();
      expect(app.lastFrame()).toContain('Run tests');
    }));
});

describe('Settings leave confirmation', () => {
  it('cancels navigation, preserves the draft through the command menu, then saves before leaving', async () =>
    withAsyncWorkspace(async (directory) => {
      const path = join(directory, 'settings.json');
      const app = await mount(<App options={{...options, screen: 'settings', configFile: path}} />);
      await sendKey(app, '\r');
      await sendKey(app, '\u001b[B');
      await sendKey(app, '\r');
      await sendKey(app, '\u001b');
      expect(app.lastFrame()).toContain('Unsaved changes');
      await sendKey(app, '1');
      expect(app.lastFrame()).toContain('Unsaved settings');
      await sendKey(app, '\r');
      expect(app.lastFrame()).toContain('Unsaved changes');
      await sendKey(app, '\u000b');
      await sendKey(app, '\u001b');
      expect(app.lastFrame()).toContain('Unsaved changes');
      await sendKey(app, '1');
      await sendKey(app, '\u001b[B');
      await sendKey(app, '\r');
      expect(app.lastFrame()).toContain('Build your app');
      expect(JSON.parse(readFileSync(path, 'utf8')).ascii).toBe(true);
    }));

  it('discards a pending draft before leaving', async () =>
    withAsyncWorkspace(async (directory) => {
      const app = await mount(
        <App
          options={{...options, screen: 'settings', configFile: join(directory, 'settings.json')}}
        />,
      );
      await sendKey(app, '\r');
      await sendKey(app, '\u001b[B');
      await sendKey(app, '\r');
      await sendKey(app, '\u001b');
      await sendKey(app, '1');
      await sendKey(app, '\u001b[B');
      await sendKey(app, '\u001b[B');
      await sendKey(app, '\r');
      expect(app.lastFrame()).toContain('Build your app');
    }));
});

import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {Command} from '@commander-js/extra-typings';
import {z} from 'zod';
import {defineCommand} from '../src/commands';
import {APP_ASCII_ENV, APP_THEME_ENV} from '../src/lib/identity';
import {runNode, withWorkspace, writeFixture} from './helpers/fixtures';

function cli(directory: string, args: string[], env: NodeJS.ProcessEnv = {}, input?: string) {
  return runNode('src/cli.tsx', args, {
    env: {
      CI: '1',
      NO_COLOR: '',
      XDG_CONFIG_HOME: directory,
      XDG_STATE_HOME: directory,
      NODE_OPTIONS: '--import tsx',
      [APP_ASCII_ENV]: '',
      CLI_ASCII: '',
      [APP_THEME_ENV]: '',
      ...env,
    },
    input,
  });
}

describe('registered headless commands', {timeout: 20_000}, () => {
  it('registers typed options and awaits an async handler without CLI edits', async () => {
    const root = new Command();
    let received = 0;
    defineCommand({
      name: 'another',
      description: 'A consumer command',
      options: [{flags: '--count <count>', description: 'Count'}],
      schema: z.object({count: z.coerce.number()}),
      run: async ({options}) => {
        await Promise.resolve();
        received = options.count;
      },
    }).register(root, () => ({
      flags: {},
      signal: new AbortController().signal,
      output: () => {},
      notice: () => {},
    }));
    await root.parseAsync(['another', '--count', '7'], {from: 'user'});
    expect(received).toBe(7);
  });

  it('reads without creating a config file and accepts global options after nested commands', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'custom.json');
      const result = cli(directory, ['config', 'path', '--config', path, '--json']);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({path});
      expect(existsSync(path)).toBe(false);
      expect(cli(directory, ['config', 'get', 'ascii']).stdout.trim()).toBe('false');
    }));

  it('validates writes, reads sources, and resets without losing extension keys', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      writeFixture(directory, 'settings.json', '{"theme":"dark","plugin":{"enabled":true}}');
      const args = ['--config', path];
      expect(cli(directory, [...args, 'config', 'set', 'ascii', 'true', '--quiet']).stderr).toBe(
        '',
      );
      const effective = cli(directory, [
        ...args,
        '--theme',
        'light',
        'config',
        'get',
        'theme',
        '--json',
      ]);
      expect(JSON.parse(effective.stdout)).toEqual({key: 'theme', value: 'light', source: 'flag'});
      const stored = cli(directory, [...args, 'config', 'get', 'theme', '--stored', '--json'], {
        [APP_THEME_ENV]: 'contrast',
      });
      expect(JSON.parse(stored.stdout)).toEqual({key: 'theme', value: 'dark', source: 'file'});
      const before = readFileSync(path, 'utf8');
      expect(cli(directory, [...args, 'config', 'set', 'ascii', 'yes']).status).toBe(2);
      expect(cli(directory, [...args, 'config', 'set', 'theme', 'bogus']).status).toBe(2);
      expect(cli(directory, [...args, 'config', 'set', '__proto__', 'bad']).status).toBe(2);
      expect(readFileSync(path, 'utf8')).toBe(before);
      expect(cli(directory, [...args, 'config', 'reset', 'ascii']).status).toBe(0);
      expect(JSON.parse(readFileSync(path, 'utf8'))).toMatchObject({
        theme: 'dark',
        plugin: {enabled: true},
      });
      expect(cli(directory, [...args, 'config', 'reset']).status).toBe(0);
      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({version: 1, plugin: {enabled: true}});
    }));

  it.each(['{bad', '{"version":999}', '{"ascii":"yes"}'])(
    'preserves invalid files through set and reset: %s',
    (content) =>
      withWorkspace((directory) => {
        const path = join(directory, 'settings.json');
        writeFixture(directory, 'settings.json', content);
        for (const command of [['set', 'ascii', 'true'], ['reset'], ['get', 'ascii']]) {
          const result = cli(directory, ['--config', path, 'config', ...command]);
          expect(result.status).not.toBe(0);
          expect(readFileSync(path, 'utf8')).toBe(content);
        }
      }),
  );

  it('honors prefixed ASCII, its legacy alias, and NO_COLOR', () =>
    withWorkspace((directory) => {
      const args = ['config', 'get', 'ascii', '--json'];
      expect(JSON.parse(cli(directory, args, {CLI_ASCII: '1'}).stdout).value).toBe(true);
      expect(
        JSON.parse(cli(directory, args, {CLI_ASCII: '1', [APP_ASCII_ENV]: '0'}).stdout).value,
      ).toBe(false);
      const mono = cli(directory, ['--theme', 'light', 'config', 'get', 'theme', '--json'], {
        NO_COLOR: '0',
      });
      expect(JSON.parse(mono.stdout)).toEqual({key: 'theme', value: 'mono', source: 'environment'});
    }));

  it('consumes explicit and implicit pipe input and keeps JSON stdout clean', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      expect(
        cli(directory, ['--config', path, 'config', 'set', 'ascii', '-'], {}, 'true\n').status,
      ).toBe(0);
      const input = JSON.stringify([
        {id: 'pipe', name: 'Piped item', status: 'ready', description: 'From stdin'},
      ]);
      for (const args of [['example', '-'], ['example']]) {
        const result = cli(directory, [...args, '--json', '--verbose'], {}, input);
        expect(result.status, result.stderr).toBe(0);
        expect(JSON.parse(result.stdout)).toEqual(JSON.parse(input));
      }
      expect(cli(directory, ['example', '-'], {}, 'bad').status).toBe(2);
      expect(cli(directory, ['example', '-'], {}, '').status).toBe(2);
    }));

  it('reports stacks only in debug mode and writes unexpected failures to the logger', () =>
    withWorkspace((directory) => {
      const basic = cli(directory, ['--screen', 'missing']);
      const debug = cli(directory, ['--debug', '--screen', 'missing']);
      expect(basic.stderr).not.toContain('at runApp');
      expect(debug.stderr).toContain('at runApp');
      expect(readFileSync(join(directory, 'ink-kit', 'ink-kit.log'), 'utf8')).toContain(
        'Unknown screen',
      );
      expect(cli(directory, ['--quiet', '--verbose', 'doctor']).status).toBe(2);
    }));
});

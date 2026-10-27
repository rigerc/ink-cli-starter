import {existsSync, readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {Command} from '@commander-js/extra-typings';
import {z} from 'zod';
import {defineCommand} from '../src/commands';
import {APP_ASCII_ENV, APP_THEME_ENV} from '../src/lib/identity';
import {exampleItems} from '../src/features/example/items';
import {runNode, withAsyncWorkspace, withWorkspace, writeFixture} from './helpers/fixtures';

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

  it('consumes explicit pipe input and keeps JSON stdout clean', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      expect(
        cli(directory, ['--config', path, 'config', 'set', 'ascii', '-'], {}, 'true\n').status,
      ).toBe(0);
      const input = JSON.stringify([
        {id: 'pipe', name: 'Piped item', status: 'ready', description: 'From stdin'},
      ]);
      const result = cli(directory, ['example', '-', '--json', '--verbose'], {}, input);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(JSON.parse(input));
      // Without `-`, piped input is not read; the command prints the default items.
      const implicit = cli(directory, ['example', '--json'], {}, input);
      expect(implicit.status, implicit.stderr).toBe(0);
      expect(JSON.parse(implicit.stdout)).toEqual(exampleItems);
      expect(cli(directory, ['example', '-'], {}, 'bad').status).toBe(2);
      expect(cli(directory, ['example', '-'], {}, '').status).toBe(2);
    }));

  it('exits promptly when example gets an open stdin without -', async () =>
    withAsyncWorkspace(async (directory) => {
      const child = spawn(process.execPath, ['src/cli.tsx', 'example', '--json'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          CI: '1',
          NO_COLOR: '1',
          XDG_CONFIG_HOME: directory,
          XDG_STATE_HOME: directory,
          NODE_OPTIONS: '--import tsx',
        },
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      // Deliberately keep child.stdin open; the command must not wait on it.
      const exited = new Promise<{status: number; stdout: string}>((resolve) => {
        let stdout = '';
        child.stdout!.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
        child.on('exit', (code) => resolve({status: code ?? -1, stdout}));
      });
      const result = await Promise.race([
        exited,
        new Promise<never>((_, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('example hung on an open stdin')),
            12_000,
          );
          child.on('exit', () => clearTimeout(timeout));
        }),
      ]);
      child.kill();
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(exampleItems);
    }));

  it('prints group help and exits non-zero for a bare group command', () =>
    withWorkspace((directory) => {
      const result = cli(directory, ['config']);
      expect(result.status).toBe(2);
      expect(result.stdout).toContain('Usage:');
      expect(result.stderr).toContain('Missing config subcommand');
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

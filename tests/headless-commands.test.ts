import {existsSync, readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {Command} from '@commander-js/extra-typings';
import {z} from 'zod';
import {defineCommand} from '../src/commands';
import {APP_ENV_PREFIX} from '../src/lib/identity';
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
      [`${APP_ENV_PREFIX}_LABEL`]: '',
      ...env,
    },
    input,
  });
}

describe('headless commands', {timeout: 20_000}, () => {
  it('validates typed options and awaits async handlers', async () => {
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

  it('reads without creating a config file and accepts inherited flags', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'custom.json');
      const result = cli(directory, ['config', 'path', '--config', path, '--json']);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({path});
      expect(existsSync(path)).toBe(false);
      expect(cli(directory, ['config', 'get', 'label']).stdout.trim()).toBe('ink-kit');
    }));

  it('validates writes, environment precedence and extension-key preservation', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      writeFixture(directory, 'settings.json', '{"label":"Original","plugin":{"enabled":true}}');
      const args = ['--config', path];
      expect(cli(directory, [...args, 'config', 'set', 'label', 'Changed', '--quiet']).status).toBe(0);
      const env = {[`${APP_ENV_PREFIX}_LABEL`]: 'From environment'};
      const value = cli(directory, [...args, 'config', 'get', 'label', '--json'], env);
      expect(JSON.parse(value.stdout)).toEqual({
        key: 'label',
        value: 'From environment',
        source: 'environment',
      });
      const stored = cli(directory, [...args, 'config', 'get', 'label', '--stored', '--json'], env);
      expect(JSON.parse(stored.stdout)).toEqual({key: 'label', value: 'Changed', source: 'file'});
      const before = readFileSync(path, 'utf8');
      expect(cli(directory, [...args, 'config', 'set', 'label', '']).status).toBe(2);
      expect(cli(directory, [...args, 'config', 'set', '__proto__', 'bad']).status).toBe(2);
      expect(readFileSync(path, 'utf8')).toBe(before);
      expect(cli(directory, [...args, 'config', 'reset', 'label']).status).toBe(0);
      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
        version: 1,
        plugin: {enabled: true},
      });
    }));

  it.each(['{bad', '{"version":999}', '{"label":17}'])(
    'preserves invalid settings files: %s',
    (content) =>
      withWorkspace((directory) => {
        const path = join(directory, 'settings.json');
        writeFixture(directory, 'settings.json', content);
        for (const command of [['set', 'label', 'foo'], ['reset'], ['get', 'label']]) {
          const result = cli(directory, ['--config', path, 'config', ...command]);
          expect(result.status).not.toBe(0);
          expect(readFileSync(path, 'utf8')).toBe(content);
        }
      }),
  );

  it('supports explicit piped input without mixing JSON and log output', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      expect(
        cli(directory, ['--config', path, 'config', 'set', 'label', '-'], {}, 'Piped CLI\n').status,
      ).toBe(0);
      const input = JSON.stringify([
        {id: 'pipe', name: 'Piped item', status: 'ready', description: 'From stdin'},
      ]);
      const result = cli(directory, ['example', '-', '--json', '--verbose'], {}, input);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(JSON.parse(input));
      expect(JSON.parse(cli(directory, ['example', '--json'], {}, input).stdout)).toEqual(
        exampleItems,
      );
      expect(cli(directory, ['example', '-'], {}, 'bad').status).toBe(2);
    }));

  it('does not read a piped stream unless - is passed', async () =>
    withAsyncWorkspace(async (directory) => {
      const child = spawn(process.execPath, ['src/cli.tsx', 'example', '--json'], {
        cwd: process.cwd(),
        env: {...process.env, CI: '1', XDG_CONFIG_HOME: directory, NODE_OPTIONS: '--import tsx'},
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const exited = new Promise<{status: number; stdout: string}>((resolve) => {
        let stdout = '';
        child.stdout!.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
        child.on('exit', (code) => resolve({status: code ?? -1, stdout}));
      });
      const result = await Promise.race([
        exited,
        new Promise<never>((_, reject) => {
          const timeout = setTimeout(() => reject(new Error('example hung on stdin')), 12_000);
          child.on('exit', () => clearTimeout(timeout));
        }),
      ]);
      child.kill();
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(exampleItems);
    }));

  it('reports group usage errors without a TTY', () =>
    withWorkspace((directory) => {
      const result = cli(directory, ['config']);
      expect(result.status).toBe(2);
      expect(result.stdout).toContain('Usage:');
    }));

  it('reports errors and debug stacks and rejects conflicting verbosity flags', () =>
    withWorkspace((directory) => {
      const basic = cli(directory, ['config', 'get', 'missing']);
      const debug = cli(directory, ['--debug', 'config', 'get', 'missing']);
      expect(basic.status).toBe(2);
      expect(basic.stderr).not.toContain('at fieldFor');
      expect(debug.stderr).toContain('at fieldFor');
      expect(readFileSync(join(directory, 'ink-kit', 'ink-kit.log'), 'utf8')).toContain(
        'Unknown configuration key',
      );
      expect(cli(directory, ['--quiet', '--verbose', 'doctor']).status).toBe(2);
    }));
});

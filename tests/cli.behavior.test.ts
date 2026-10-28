import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import pkg from '../package.json' with {type: 'json'};
import {runNode, withWorkspace} from './helpers/fixtures';

function cli(args: string[], home: string) {
  return runNode('src/cli.tsx', args, {
    env: {
      CI: '1',
      NO_COLOR: '1',
      XDG_CONFIG_HOME: home,
      XDG_STATE_HOME: home,
      NODE_OPTIONS: '--import tsx',
    },
  });
}

describe('CLI as a subprocess', () => {
  it('exposes version, plain output and headless commands', () =>
    withWorkspace((home) => {
      expect(cli(['--version'], home).stdout.trim()).toBe(pkg.version);
      const help = cli(['--help'], home);
      expect(help.status).toBe(0);
      expect(help.stdout).toContain('--plain');
      expect(help.stdout).toContain('doctor');
      expect(help.stdout).not.toContain('--screen <id>');
    }));

  it('prints a native Ink frame without a TTY', () =>
    withWorkspace((home) => {
      const result = cli(['--plain'], home);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain(pkg.name);
      expect(result.stdout).toContain('Edit src/app.tsx');
    }));

  it('reads a configured label without a UI settings screen', () =>
    withWorkspace((home) => {
      const path = join(home, 'settings.json');
      expect(cli(['config', 'set', 'label', 'Example CLI', '--config', path], home).status).toBe(0);
      const result = cli(['--plain', '--config', path], home);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Example CLI');
    }));

  it('supports doctor JSON and an explicit config path', () =>
    withWorkspace((home) => {
      const path = join(home, 'settings.json');
      const result = cli(['doctor', '--json', '--config', path], home);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout).checks).toEqual(
        expect.arrayContaining([expect.objectContaining({name: 'configuration'})]),
      );
    }));

  it.each([
    {args: ['--json'], message: '--json requires a headless subcommand'},
    {args: ['--plain', 'doctor'], message: 'Subcommands cannot be combined'},
  ])('rejects invalid combinations', ({args, message}) =>
    withWorkspace((home) => {
      const result = cli(args, home);
      expect(result.status).toBe(2);
      expect(result.stderr).toContain(message);
    }),
  );

  it('rejects unknown commands', () =>
    withWorkspace((home) => {
      const result = cli(['does-not-exist'], home);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Unknown command');
    }));
});

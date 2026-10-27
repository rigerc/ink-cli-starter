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

describe('CLI as a subprocess (the public contract)', () => {
  it('exposes version, screens, flags, and a headless command', () =>
    withWorkspace((home) => {
      const version = cli(['--version'], home);
      expect(version.status, version.stderr).toBe(0);
      expect(version.stdout.trim()).toBe(pkg.version);

      const help = cli(['--help'], home);
      expect(help.status, help.stderr).toBe(0);
      expect(help.stdout).toContain('--plain');
      expect(help.stdout).toContain('--screen');
      expect(help.stdout).toContain('doctor');
    }));

  it('prints a deterministic screen without an interactive terminal', () =>
    withWorkspace((home) => {
      const result = cli(['--plain', '--screen', 'home', '--ascii'], home);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('Home');
      expect(result.stdout).toContain('Build your app');
    }));

  it('supports doctor JSON and an explicit config path', () =>
    withWorkspace((home) => {
      const config = join(home, 'not-created.json');
      const result = cli(['--json', 'doctor', '--config', config], home);
      expect(result.status, result.stderr).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.ok).toBe(true);
      expect(report.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({name: 'configuration', detail: expect.stringContaining(config)}),
        ]),
      );
    }));

  it.each([
    {args: ['--json'], message: '--json requires a headless subcommand'},
    {args: ['--plain', '--screen', 'absent'], message: 'Unknown screen'},
    {args: ['--setup', '--plain'], message: 'requires an interactive terminal'},
    {args: ['--plain', 'doctor'], message: 'Subcommands cannot be combined'},
  ])('rejects invalid flags: $args', ({args, message}) =>
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

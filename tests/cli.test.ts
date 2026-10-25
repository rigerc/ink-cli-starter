import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import packageJson from '../package.json' with {type: 'json'};

const runCli = (...args: string[]) =>
  spawnSync(process.execPath, ['--import', 'tsx', 'src/cli.tsx', ...args], {
    encoding: 'utf8',
    env: {...process.env, CI: '1', NO_COLOR: '1'},
  });

describe('Commander CLI', () => {
  it('shows the root options, subcommands, and environment help', () => {
    const result = runCli('--help');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('--screen');
    expect(result.stdout).toContain('--setup');
    expect(result.stdout).toContain('doctor');
    expect(result.stdout).toContain('NO_COLOR');
  });

  it('reads the executable version from package metadata', () => {
    const result = runCli('--version');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
  });

  it('renders a requested screen in noninteractive plain mode', () => {
    const result = runCli('--plain', '--screen', 'home', '--theme', 'mono', '--ascii');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Home');
  });

  it('passes command-local JSON and config options to doctor', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ink-cli-'));

    try {
      const config = join(dir, 'absent.json');
      const result = runCli('doctor', '--config', config, '--json');
      expect(result.status, result.stderr).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.ok).toBe(true);
      expect(report.checks[1].detail).toContain(config);
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('accepts root options before a subcommand', () => {
    const result = runCli('--json', 'doctor');
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).checks).toHaveLength(2);
  });

  it('rejects JSON output without a headless subcommand', () => {
    const result = runCli('--json');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('--json requires a headless subcommand');
  });

  it('rejects setup or plain rendering combined with doctor', () => {
    for (const flag of ['--setup', '--plain']) {
      const result = runCli(flag, 'doctor');
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('Subcommands cannot be combined');
    }
  });

  it('rejects unknown commands and extra arguments', () => {
    const unknown = runCli('missing');
    expect(unknown.status).not.toBe(0);
    expect(unknown.stderr).toMatch(/unknown command/i);

    const extra = runCli('doctor', 'extra');
    expect(extra.status).not.toBe(0);
  });

  it('keeps screen validation', () => {
    const result = runCli('--screen', 'missing', '--plain');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Unknown screen');
  });
});

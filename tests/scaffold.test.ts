import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vite-plus/test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts/scaffold.mjs');

function run(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [script, ...args], {cwd, encoding: 'utf8'});
}

function withTempDir(check: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'ink-scaffold-'));
  try {
    check(dir);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

describe('app scaffolding', () => {
  it('creates a standalone, renamed app with the starter tooling', () => {
    withTempDir((dir) => {
      const result = run(dir, 'sample-cli');
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'sample-cli');
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      const lock = JSON.parse(readFileSync(join(target, 'package-lock.json'), 'utf8'));
      expect(pkg.name).toBe('sample-cli');
      expect(pkg.bin).toEqual({'sample-cli': './dist/cli.js'});
      expect(pkg.scripts.scaffold).toBe('node scripts/scaffold.mjs');
      expect(lock.name).toBe('sample-cli');
      expect(lock.packages[''].name).toBe('sample-cli');
      expect(readFileSync(join(target, 'src/lib/config.ts'), 'utf8')).toContain("APP_NAME = 'sample-cli'");
      expect(readFileSync(join(target, 'src/cli.tsx'), 'utf8')).toContain('SAMPLE_CLI_THEME');
      expect(readFileSync(join(target, 'src/app.tsx'), 'utf8')).toContain('title="sample-cli"');
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('# sample-cli');
      expect(existsSync(join(target, 'src/screens'))).toBe(true);
      expect(existsSync(join(target, 'tests/screens.test.tsx'))).toBe(true);
      expect(existsSync(join(target, 'scripts/screenshot.tsx'))).toBe(true);
      expect(existsSync(join(target, '.github'))).toBe(false);
      expect(readFileSync(join(target, 'README.md'), 'utf8')).not.toContain('The **Screenshots** GitHub Actions workflow');
      expect(existsSync(join(target, 'node_modules'))).toBe(false);
      expect(existsSync(join(target, '.git'))).toBe(false);
    });
  });

  it('never overwrites an existing directory', () => {
    withTempDir((dir) => {
      mkdirSync(join(dir, 'taken'));
      writeFileSync(join(dir, 'taken', 'keep.txt'), 'leave me alone');
      const result = run(dir, 'taken');
      expect(result.status).not.toBe(0);
      expect(readFileSync(join(dir, 'taken', 'keep.txt'), 'utf8')).toBe('leave me alone');
      expect(existsSync(join(dir, 'taken', 'package.json'))).toBe(false);
    });
  });

  it('rejects invalid names and prints help', () => {
    withTempDir((dir) => {
      expect(run(dir, '../outside').status).not.toBe(0);
      expect(run(dir, 'Bad_Name').status).not.toBe(0);
      const result = run(dir, '--help');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('npm run scaffold -- <app-name>');
    });
  });
});

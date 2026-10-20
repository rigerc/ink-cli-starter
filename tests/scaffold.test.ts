import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
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

function write(path: string, content: string) {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, content);
}

describe('app scaffolding', () => {
  it('creates a standalone app with targeted metadata and a minimal README', () => {
    withTempDir((dir) => {
      const result = run(dir, 'sample-cli');
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'sample-cli');
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      const lock = JSON.parse(readFileSync(join(target, 'package-lock.json'), 'utf8'));
      expect(pkg.name).toBe('sample-cli');
      expect(pkg.bin).toEqual({'sample-cli': './dist/cli.js'});
      expect(pkg.scripts.scaffold).toBeUndefined();
      expect(lock.name).toBe('sample-cli');
      expect(lock.packages[''].name).toBe('sample-cli');
      expect(lock.packages[''].bin).toEqual({'sample-cli': 'dist/cli.js'});
      expect(lock.packages[''].devDependencies['ink-testing-library']).toBe('^4.0.0');
      expect(readFileSync(join(target, 'src/lib/config.ts'), 'utf8')).toContain(
        "APP_NAME = 'sample-cli'",
      );
      expect(readFileSync(join(target, 'src/cli.tsx'), 'utf8')).toContain('APP_THEME_ENV');
      expect(readFileSync(join(target, 'src/app.tsx'), 'utf8')).toContain('title={pkg.name}');
      expect(readFileSync(join(target, 'src/demos/InlineDemo.tsx'), 'utf8')).toContain('APP_NAME');
      expect(readFileSync(join(target, 'scripts/screenshot.tsx'), 'utf8')).toContain('pkg.name');
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toMatch(/^# sample-cli\n/);
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('npm run dev');
      expect(readFileSync(join(target, 'README.md'), 'utf8')).not.toContain('GitHub Actions');
      expect(existsSync(join(target, 'src/screens'))).toBe(true);
      expect(existsSync(join(target, 'tests/screens.test.tsx'))).toBe(true);
      expect(existsSync(join(target, 'scripts/screenshot.tsx'))).toBe(true);
      for (const excluded of [
        '.github',
        '.git',
        'node_modules',
        'scripts/scaffold.mjs',
        'tests/scaffold.test.ts',
      ]) {
        expect(existsSync(join(target, excluded))).toBe(false);
      }
    });
  });

  it('discovers new tracked files without copying untracked files or unrelated names', () => {
    withTempDir((dir) => {
      const source = join(dir, 'source');
      const scaffold = join(source, 'scripts/scaffold.mjs');
      mkdirSync(dirname(scaffold), {recursive: true});
      copyFileSync(script, scaffold);
      write(
        join(source, 'package.json'),
        JSON.stringify({
          name: 'ink-kit',
          bin: {'ink-kit': './dist/cli.js'},
          scripts: {scaffold: 'node scripts/scaffold.mjs', dev: 'tsx src/cli.tsx'},
        }),
      );
      write(
        join(source, 'package-lock.json'),
        JSON.stringify({name: 'ink-kit', packages: {'': {name: 'ink-kit', bin: {'ink-kit': 'dist/cli.js'}}}}),
      );
      write(join(source, 'src/lib/config.ts'), "export const APP_NAME = 'ink-kit';\n");
      write(join(source, 'src/components/NewWidget.tsx'), '// ink-kit is mentioned in a comment\n');
      write(join(source, 'README.md'), 'Starter-only documentation');
      write(join(source, '.github/workflows/ci.yml'), 'CI should not be copied');
      write(join(source, 'tests/scaffold.test.ts'), 'Scaffolding-only tests');

      expect(spawnSync('git', ['init', '-q'], {cwd: source}).status).toBe(0);
      expect(spawnSync('git', ['add', '.'], {cwd: source}).status).toBe(0);
      write(join(source, 'src/untracked.ts'), 'Keep out');

      const result = spawnSync(process.execPath, [scaffold, 'new-app'], {cwd: dir, encoding: 'utf8'});
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'new-app');
      expect(readFileSync(join(target, 'src/components/NewWidget.tsx'), 'utf8')).toBe(
        '// ink-kit is mentioned in a comment\n',
      );
      expect(readFileSync(join(target, 'src/lib/config.ts'), 'utf8')).toContain("APP_NAME = 'new-app'");
      expect(existsSync(join(target, 'src/untracked.ts'))).toBe(false);
      expect(existsSync(join(target, '.github'))).toBe(false);
      expect(existsSync(join(target, 'scripts/scaffold.mjs'))).toBe(false);
      expect(existsSync(join(target, 'tests/scaffold.test.ts'))).toBe(false);
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

import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {expect, it} from 'vite-plus/test';

const paths = ['package.json', 'package-lock.json', 'src/lib/config.ts', 'src/config/store.ts'];
const initializer = fileURLToPath(new URL('../scripts/init-project.mjs', import.meta.url));

function withFixture(test: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'ink-init-'));

  try {
    for (const path of paths) {
      const destination = join(root, path);
      mkdirSync(dirname(destination), {recursive: true});
      copyFileSync(new URL('../' + path, import.meta.url), destination);
    }

    test(root);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

function run(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [initializer, ...args], {cwd: root, encoding: 'utf8'});
}

function json(root: string, path: string) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

it('customizes package identity, lockfile, and both config defaults, then becomes a no-op', () => {
  withFixture((root) => {
    const previousLock = json(root, 'package-lock.json');
    const result = run(root, '--name', 'my-cli', '--description', 'My own CLI');
    expect(result.status, result.stderr).toBe(0);
    const pkg = json(root, 'package.json');
    const lock = json(root, 'package-lock.json');
    expect(pkg.name).toBe('my-cli');
    expect(pkg.description).toBe('My own CLI');
    expect(pkg.bin).toEqual({'my-cli': './dist/cli.js'});
    expect(pkg.private).toBe(true);
    expect(lock.name).toBe('my-cli');
    expect(lock.packages[''].name).toBe('my-cli');
    expect(lock.packages[''].bin).toEqual({'my-cli': 'dist/cli.js'});
    expect(lock.packages[''].dependencies).toEqual(previousLock.packages[''].dependencies);
    expect(readFileSync(join(root, 'src/lib/config.ts'), 'utf8')).toContain(
      "APP_NAME = 'my-cli'",
    );
    expect(readFileSync(join(root, 'src/config/store.ts'), 'utf8').match(/appName = 'my-cli'/g)).toHaveLength(2);

    const rerun = run(root, '--name', 'my-cli', '--description', 'My own CLI');
    expect(rerun.status, rerun.stderr).toBe(0);
    expect(rerun.stdout).toContain('Already initialized as my-cli');
  });
});

it('uses the unscoped command name for a scoped package', () => {
  withFixture((root) => {
    const result = run(root, '--name', '@acme/shell-tool');
    expect(result.status, result.stderr).toBe(0);
    expect(json(root, 'package.json').name).toBe('@acme/shell-tool');
    expect(json(root, 'package.json').bin).toEqual({'shell-tool': './dist/cli.js'});
    expect(json(root, 'package.json').description).toBe('shell-tool command-line application');
    expect(json(root, 'package-lock.json').packages[''].bin).toEqual({
      'shell-tool': 'dist/cli.js',
    });
    expect(readFileSync(join(root, 'src/lib/config.ts'), 'utf8')).toContain(
      "APP_NAME = 'shell-tool'",
    );
  });
});

it('supports dry-run without changing files', () => {
  withFixture((root) => {
    const before = paths.map((path) => readFileSync(join(root, path), 'utf8'));
    const result = run(root, '--name', 'other-cli', '--dry-run');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Would update package.json');
    expect(paths.map((path) => readFileSync(join(root, path), 'utf8'))).toEqual(before);
  });
});

it.each(['ink-kit', 'Invalid Name', '@scope/', 'x/name', 'UPPER'])(
  'rejects an invalid or unchanged package name: %s',
  (name) => {
    withFixture((root) => {
      const before = readFileSync(join(root, 'package.json'), 'utf8');
      const result = run(root, '--name', name);
      expect(result.status).toBe(1);
      expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(before);
    });
  },
);

it('does not overwrite customized app identity or partially modify files', () => {
  withFixture((root) => {
    const source = join(root, 'src/lib/config.ts');
    writeFileSync(source, readFileSync(source, 'utf8').replace("'ink-kit'", "'different'"));
    const before = readFileSync(join(root, 'package.json'), 'utf8');
    const result = run(root, '--name', 'my-cli');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('refusing to overwrite');
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(before);
  });
});

it('refuses to replace a customized description with a different description', () => {
  withFixture((root) => {
    const file = join(root, 'package.json');
    const pkg = json(root, 'package.json');
    pkg.description = 'Existing custom description';
    writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
    const result = run(root, '--name', 'my-cli', '--description', 'Overwriting description');
    expect(result.status).toBe(1);
    expect(json(root, 'package.json').name).toBe('ink-kit');
  });
});

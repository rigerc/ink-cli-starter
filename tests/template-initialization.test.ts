import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {copyFromRepo, readJson, runNode, withWorkspace, writeFixture} from './helpers/fixtures';

const sourceFiles = [
  'package.json',
  'package-lock.json',
  'src/lib/config.ts',
  'src/config/store.ts',
];
const initializer = fileURLToPath(new URL('../scripts/init-project.mjs', import.meta.url));

function fixture<T>(run: (directory: string) => T) {
  return withWorkspace((directory) => {
    copyFromRepo(directory, sourceFiles);
    return run(directory);
  });
}

describe('template identity initialization', () => {
  it('reports a dry run without modifying any files', () =>
    fixture((directory) => {
      const before = sourceFiles.map((path) => readFileSync(join(directory, path), 'utf8'));
      const result = runNode(initializer, ['--name', 'my-cli', '--dry-run'], {cwd: directory});
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('Would update package.json');
      expect(sourceFiles.map((path) => readFileSync(join(directory, path), 'utf8'))).toEqual(
        before,
      );
    }));

  it('updates package, executable, lockfile, and config identity together', () =>
    fixture((directory) => {
      const result = runNode(initializer, ['--name', '@acme/my-cli', '--description', 'My CLI'], {
        cwd: directory,
      });
      expect(result.status, result.stderr).toBe(0);
      expect(readJson(directory, 'package.json')).toMatchObject({
        name: '@acme/my-cli',
        description: 'My CLI',
        bin: {'my-cli': './dist/cli.js'},
      });
      expect(readJson(directory, 'package-lock.json').packages[''].bin).toEqual({
        'my-cli': 'dist/cli.js',
      });

      const again = runNode(initializer, ['--name', '@acme/my-cli', '--description', 'My CLI'], {
        cwd: directory,
      });
      expect(again.status, again.stderr).toBe(0);
      expect(again.stdout).toContain('Already initialized');
    }));

  it.each(['ink-kit', 'Bad Name', '@scope/', 'upperCASE'])(
    'rejects invalid package identity %s without changing files',
    (name) =>
      fixture((directory) => {
        const before = readFileSync(join(directory, 'package.json'), 'utf8');
        const result = runNode(initializer, ['--name', name], {cwd: directory});
        expect(result.status).toBe(1);
        expect(readFileSync(join(directory, 'package.json'), 'utf8')).toBe(before);
      }),
  );

  it('refuses to overwrite pre-customized identity', () =>
    fixture((directory) => {
      const pkg = readJson(directory, 'package.json');
      pkg.bin = {'other-cli': './dist/cli.js'};
      writeFixture(directory, 'package.json', JSON.stringify(pkg));
      const before = readFileSync(join(directory, 'package.json'), 'utf8');
      const result = runNode(initializer, ['--name', 'my-cli'], {cwd: directory});
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('refusing to overwrite');
      expect(readFileSync(join(directory, 'package.json'), 'utf8')).toBe(before);
    }));
});

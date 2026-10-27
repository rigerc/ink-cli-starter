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

  it('renames the package in pending changesets so changeset version keeps working', () =>
    fixture((directory) => {
      const changeset = (name: string, bump: string) =>
        `---\n'${name}': ${bump}\n---\n\nMentions ink-kit in prose, which stays untouched.\n`;
      writeFixture(directory, '.changeset/one.md', changeset('ink-kit', 'patch'));
      writeFixture(
        directory,
        '.changeset/two.md',
        changeset('ink-kit', 'minor').replaceAll("'", '"'),
      );
      writeFixture(directory, '.changeset/other.md', changeset('another-package', 'patch'));
      writeFixture(directory, '.changeset/README.md', '# Changesets\n\nink-kit docs.\n');

      const preview = runNode(initializer, ['--name', '@acme/my-cli', '--dry-run'], {
        cwd: directory,
      });
      expect(preview.status, preview.stderr).toBe(0);
      expect(preview.stdout).toContain('Would update .changeset');
      expect(readFileSync(join(directory, '.changeset/one.md'), 'utf8')).toContain("'ink-kit'");

      const result = runNode(initializer, ['--name', '@acme/my-cli'], {cwd: directory});
      expect(result.status, result.stderr).toBe(0);
      const read = (file: string) => readFileSync(join(directory, '.changeset', file), 'utf8');
      expect(read('one.md')).toContain("'@acme/my-cli': patch");
      expect(read('two.md')).toContain("'@acme/my-cli': minor");
      expect(read('one.md')).toContain('Mentions ink-kit in prose');
      expect(read('other.md')).toContain("'another-package': patch");
      expect(read('README.md')).toContain('ink-kit docs');

      const again = runNode(initializer, ['--name', '@acme/my-cli'], {cwd: directory});
      expect(again.status, again.stderr).toBe(0);
      expect(again.stdout).toContain('Already initialized');
    }));

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

import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {copyFromRepo, readJson, runNode, withWorkspace, writeFixture} from './helpers/fixtures';

const checker = fileURLToPath(new URL('../scripts/check-template.mjs', import.meta.url));
const preflight = fileURLToPath(new URL('../scripts/release-preflight.mjs', import.meta.url));

describe('template and publishing checks', () => {
  it('warns on uncustomized identity without failing a template checkout', () =>
    withWorkspace((directory) => {
      copyFromRepo(directory, [
        'package.json',
        'package-lock.json',
        'src/lib/config.ts',
        'src/config/store.ts',
      ]);
      const result = runNode(checker, [], {cwd: directory});
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).toContain('warning: package.json:');
      expect(result.stderr).toContain('Customize these values');
    }));

  it('stops reporting package name warnings after metadata is customized', () =>
    withWorkspace((directory) => {
      copyFromRepo(directory, ['package.json', 'package-lock.json']);
      const pkg = readJson(directory, 'package.json');
      pkg.name = 'example-cli';
      pkg.description = 'An example CLI';
      pkg.bin = {'example-cli': './dist/cli.js'};
      writeFixture(directory, 'package.json', JSON.stringify(pkg));
      const lock = readJson(directory, 'package-lock.json');
      lock.name = 'example-cli';
      lock.packages[''].name = 'example-cli';
      lock.packages[''].bin = {'example-cli': 'dist/cli.js'};
      writeFixture(directory, 'package-lock.json', JSON.stringify(lock));
      const result = runNode(checker, [], {cwd: directory});
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).not.toContain('warning:');
    }));

  it('does not require npm release settings for GitHub-only releases', () => {
    const result = runNode(preflight, [], {env: {NPM_PUBLISH: 'false'}});
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('versioning, git tags and GitHub releases only');
  });

  it('blocks npm publishing while template metadata is unchanged', () => {
    const result = runNode(preflight, [], {env: {NPM_PUBLISH: 'true'}});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('private');
    expect(result.stderr).toContain('repository');
  });
});

describe('sync changelog input validation', () => {
  const changelog = fileURLToPath(
    new URL('../scripts/template-sync-changelog.mjs', import.meta.url),
  );

  it('skips cleanly when no sync PR was created', () => {
    const result = runNode(changelog, [], {env: {SYNC_PR_NUMBER: ''}});
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('No sync PR was created');
  });

  it('refuses malformed PR identifiers before reading any state', () => {
    const result = runNode(changelog, [join('unused', 'state.json')], {
      env: {
        SYNC_PR_NUMBER: 'zero',
        SYNC_PR_BRANCH: 'chore/template_sync_test',
        SYNC_TEMPLATE_HASH: '0123456789abcdef',
        GITHUB_REPOSITORY: 'example/downstream',
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Expected a valid PR number');
  });
});

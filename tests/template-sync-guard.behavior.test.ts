import {spawnSync} from 'node:child_process';
import {copyFileSync, mkdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {withWorkspace, writeFixture} from './helpers/fixtures';

function project(
  run: (fixture: {
    root: string;
    state: string;
    git: (...args: string[]) => string;
    write: (path: string, content: string) => void;
    guard: (phase: 'snapshot' | 'prepare' | 'verify') => ReturnType<typeof spawnSync>;
  }) => void,
) {
  withWorkspace((directory) => {
    const root = join(directory, 'checkout');
    const state = join(directory, 'sync-state.json');
    mkdirSync(root);
    const write = (path: string, content: string) => writeFixture(root, path, content);
    const runGit = (...args: string[]) =>
      spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], {
        cwd: root,
        encoding: 'utf8',
      });
    const git = (...args: string[]) => {
      const result = runGit(...args);
      if (result.status !== 0) throw new Error(result.stderr || result.stdout);
      return result.stdout.trim();
    };
    const guard = (phase: 'snapshot' | 'prepare' | 'verify') =>
      spawnSync(
        process.execPath,
        [
          phase === 'snapshot'
            ? join(root, 'scripts/template-sync-guard.mjs')
            : join(directory, 'template-sync-guard.mjs'),
          phase,
          state,
        ],
        {cwd: root, encoding: 'utf8'},
      );

    git('init', '-q', '-b', 'main');
    git('config', 'user.name', 'Sync guard test');
    git('config', 'user.email', 'sync@example.invalid');
    write('README.md', 'downstream documentation\n');
    write('src/components/Shared.tsx', 'original component\n');
    write('src/screens/Owned.tsx', 'local application screen\n');
    mkdirSync(join(root, 'scripts'));
    copyFileSync(
      new URL('../scripts/template-sync-guard.mjs', import.meta.url),
      join(root, 'scripts/template-sync-guard.mjs'),
    );
    copyFileSync(
      new URL('../.templatesyncignore', import.meta.url),
      join(root, '.templatesyncignore'),
    );
    git('add', '.');
    git('commit', '-qm', 'downstream base');
    git('branch', 'upstream');
    run({root, state, git, write, guard});
  });
}

describe('sync guard against real local Git merges', () => {
  it('keeps downstream-owned files and applies reusable component updates', () =>
    project(({root, git, write, guard}) => {
      expect(guard('snapshot').status).toBe(0);
      git('checkout', '-q', 'upstream');
      write('README.md', 'upstream documentation\n');
      write('src/screens/Owned.tsx', 'upstream screen\n');
      write('src/components/Shared.tsx', 'updated shared component\n');
      git('add', '.');
      git('commit', '-qm', 'upstream update');
      git('checkout', '-q', 'main');
      git('merge', '--squash', 'upstream');
      const prepared = guard('prepare');
      expect(prepared.status).toBe(0);
      expect(readFileSync(join(root, 'README.md'), 'utf8')).toBe('downstream documentation\n');
      expect(readFileSync(join(root, 'src/screens/Owned.tsx'), 'utf8')).toBe(
        'local application screen\n',
      );
      expect(readFileSync(join(root, 'src/components/Shared.tsx'), 'utf8')).toBe(
        'updated shared component\n',
      );
      git('add', '.');
      git('commit', '-qm', 'guarded sync');
      const verified = guard('verify');
      expect(verified.status).toBe(0);
      expect(git('diff', '--name-only', 'HEAD^', 'HEAD')).toBe('src/components/Shared.tsx');
    }));

  it('rejects dirty checkouts before starting a sync', () =>
    project(({write, guard}) => {
      write('README.md', 'uncommitted change\n');
      const result = guard('snapshot');
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('requires a clean checkout');
    }));

  it('rejects a guarded commit that changes an excluded path', () =>
    project(({git, write, guard}) => {
      expect(guard('snapshot').status).toBe(0);
      git('checkout', '-q', 'upstream');
      write('src/components/Shared.tsx', 'upstream shared update\n');
      git('add', '.');
      git('commit', '-qm', 'upstream update');
      git('checkout', '-q', 'main');
      git('merge', '--squash', 'upstream');
      expect(guard('prepare').status).toBe(0);
      write('README.md', 'unexpected sync overwrite\n');
      git('add', '.');
      git('commit', '-qm', 'bad sync');
      const result = guard('verify');
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('changes excluded paths');
    }));

  it('stops unresolved shared-file conflicts rather than auto-accepting upstream', () =>
    project(({git, write, guard}) => {
      git('checkout', '-q', 'upstream');
      write('src/components/Shared.tsx', 'upstream change\n');
      git('add', '.');
      git('commit', '-qm', 'upstream');
      git('checkout', '-q', 'main');
      write('src/components/Shared.tsx', 'downstream change\n');
      git('add', '.');
      git('commit', '-qm', 'customize component');
      expect(guard('snapshot').status).toBe(0);
      const merge = spawnSync('git', ['merge', '--squash', 'upstream'], {
        cwd: git('rev-parse', '--show-toplevel'),
        encoding: 'utf8',
      });
      expect(merge.status).not.toBe(0);
      const result = guard('prepare');
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Unresolved template conflicts');
    }));
});

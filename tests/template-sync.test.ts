import {spawnSync} from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {expect, it} from 'vite-plus/test';

class SyncProject {
  directory = mkdtempSync(join(tmpdir(), 'template-sync-'));
  root = join(this.directory, 'checkout');
  state = join(this.directory, 'sync-state.json');
  guardPath = join(this.directory, 'template-sync-guard.mjs');

  constructor() {
    mkdirSync(this.root);
    this.git('init', '-q', '-b', 'downstream');
    this.git('config', 'user.name', 'Template sync test');
    this.git('config', 'user.email', 'template-sync@example.invalid');
    this.git('config', 'core.autocrlf', 'false');
    this.git('config', 'merge.renames', 'true');
    this.write('.gitignore', '/node_modules/\n');
    this.write('README.md', 'application documentation\n');
    this.write('package.json', '{"name":"my-app"}\n');
    this.write('src/screens/Owned.tsx', 'application screen, with unique contents\n');
    this.write('src/screens/Deleted.tsx', 'screen removed by the application\n');
    this.write('src/components/Shared.tsx', 'shared component\n');
    this.write('src/components/Obsolete.tsx', 'obsolete shared component\n');
    mkdirSync(join(this.root, 'scripts'));
    copyFileSync(
      new URL('../scripts/template-sync-guard.mjs', import.meta.url),
      join(this.root, 'scripts/template-sync-guard.mjs'),
    );
    copyFileSync(
      new URL('../.templatesyncignore', import.meta.url),
      join(this.root, '.templatesyncignore'),
    );
    this.commit('base template');
    this.git('branch', 'template');
  }

  runGit(...args: string[]) {
    return spawnSync(
      'git',
      ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args],
      {cwd: this.root, encoding: 'utf8'},
    );
  }

  git(...args: string[]) {
    const result = this.runGit(...args);

    if (result.status !== 0) throw new Error(result.stderr || result.stdout);

    return result.stdout;
  }

  write(path: string, contents: string) {
    const destination = join(this.root, path);
    mkdirSync(dirname(destination), {recursive: true});
    writeFileSync(destination, contents);
  }

  read(path: string) {
    return readFileSync(join(this.root, path), 'utf8');
  }

  commit(message: string) {
    this.git('add', '.');
    this.git('commit', '-qm', message);
  }

  snapshot() {
    return spawnSync(
      process.execPath,
      ['scripts/template-sync-guard.mjs', 'snapshot', this.state],
      {
        cwd: this.root,
        encoding: 'utf8',
      },
    );
  }

  guard(phase: string) {
    return spawnSync(process.execPath, [this.guardPath, phase, this.state], {
      cwd: this.root,
      encoding: 'utf8',
    });
  }

  pull(update: () => void) {
    const snapshot = this.snapshot();
    expect(snapshot.status, snapshot.stderr).toBe(0);
    this.git('checkout', '-q', 'template');
    update();
    this.commit('upstream changes');
    this.git('checkout', '-q', 'downstream');

    const result = this.runGit(
      'merge',
      '--allow-unrelated-histories',
      '--squash',
      '--strategy=recursive',
      'template',
    );

    // actions-template-sync restores the downstream ignore file after pulling,
    // even when the pull reports conflicts.
    this.git('reset', '--', '.templatesyncignore');
    this.git('checkout', '--', '.templatesyncignore');

    return result;
  }

  finish() {
    const prepared = this.guard('prepare');
    expect(prepared.status, prepared.stderr).toBe(0);
    // Mirror v2's staging/exclusion sequence after the precommit hook succeeds:
    // git add ., reset ignored paths, clean untracked files, restore unstaged files.
    this.git('add', '.');

    const patterns = this.read('.templatesyncignore')
      .split(/\r?\n/)
      .map((line) => line.split('#', 1)[0]!.trim())
      .filter(Boolean);

    this.git('reset', '--', ...patterns);
    this.git('clean', '-df');
    this.git('checkout', '--', '.');
    this.git('commit', '-qm', 'sync template');
    const verified = this.guard('verify');
    expect(verified.status, verified.stderr).toBe(0);
  }
}

function withProject(run: (project: SyncProject) => void) {
  const project = new SyncProject();

  try {
    run(project);
  } finally {
    rmSync(project.directory, {recursive: true, force: true});
  }
}

it('preserves customized gitignore rules when upstream changes conflict', () => {
  withProject((project) => {
    const downstream = '/node_modules/\n/local-data/\n';
    project.write('.gitignore', downstream);
    project.commit('customize ignore rules');

    const merge = project.pull(() => {
      project.write('.gitignore', '/node_modules/\n/screenshots/\n');
      project.write('src/components/Shared.tsx', 'updated shared component\n');
    });

    expect(merge.status).not.toBe(0);
    expect(project.git('ls-files', '--unmerged')).toContain('.gitignore');
    project.finish();
    expect(project.read('.gitignore')).toBe(downstream);
    expect(project.read('src/components/Shared.tsx')).toBe('updated shared component\n');
    expect(project.git('diff', '--name-only', 'HEAD^', 'HEAD')).toBe('src/components/Shared.tsx\n');
  });
});

it('keeps downstream edits and deletions while syncing shared updates and deletions', () => {
  withProject((project) => {
    project.write('README.md', 'custom application documentation\n');
    project.git('rm', 'src/screens/Deleted.tsx');
    project.commit('customize application');
    project.pull(() => {
      project.write('README.md', 'starter documentation\n');
      project.write('package.json', '{"name":"ink-kit"}\n');
      project.write('src/screens/Deleted.tsx', 'upstream changed this deleted screen\n');
      project.git('rm', 'src/screens/Owned.tsx');
      project.write('src/screens/New [screen].tsx', 'new starter screen\n');
      project.write('.github/workflows/new.yml', 'new starter workflow\n');
      project.write('src/components/Shared.tsx', 'updated shared component\n');
      project.git('rm', 'src/components/Obsolete.tsx');
    });
    project.finish();

    expect(project.read('README.md')).toBe('custom application documentation\n');
    expect(project.read('package.json')).toContain('my-app');
    expect(project.read('src/screens/Owned.tsx')).toContain('application screen');
    expect(project.read('src/components/Shared.tsx')).toBe('updated shared component\n');
    expect(existsSync(join(project.root, 'src/screens/New [screen].tsx'))).toBe(false);
    expect(
      project.git(
        'ls-files',
        'src/screens/Deleted.tsx',
        'src/screens/New [screen].tsx',
        '.github/workflows/new.yml',
        'src/components/Obsolete.tsx',
      ),
    ).toBe('');
  });
});

it.each(['opencode.json', 'src/config/AGENTS.md', 'src/components/deep/AGENTS.md'])(
  'preserves downstream agent configuration and removes upstream additions: %s',
  (path) => {
    withProject((project) => {
      project.write(path, 'downstream agent configuration\n');
      project.commit('customize agent configuration');
      project.pull(() => {
        project.write(path, 'upstream agent configuration\n');
        project.write('src/hooks/AGENTS.md', 'new upstream instructions\n');
        project.write('src/hooks/New.ts', 'shared hook\n');
      });
      project.finish();

      expect(project.read(path)).toBe('downstream agent configuration\n');
      expect(existsSync(join(project.root, 'src/hooks/AGENTS.md'))).toBe(false);
      expect(project.read('src/hooks/New.ts')).toBe('shared hook\n');
      expect(project.git('diff', '--name-only', 'HEAD^', 'HEAD')).toBe('src/hooks/New.ts\n');
    });
  },
);

it('stops shared conflicts before staging can hide the unmerged index', () => {
  withProject((project) => {
    project.write('src/components/Shared.tsx', 'downstream shared customization\n');
    project.commit('customize shared component');
    const base = project.git('rev-parse', 'HEAD');

    const merge = project.pull(() =>
      project.write('src/components/Shared.tsx', 'upstream shared update\n'),
    );

    expect(merge.status).not.toBe(0);
    const result = project.guard('prepare');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unresolved template conflicts');
    expect(project.git('ls-files', '--unmerged')).toContain('src/components/Shared.tsx');
    expect(project.git('rev-parse', 'HEAD')).toBe(base);
    expect(project.guard('verify').status).toBe(1);
  });
});

it('propagates a failing precommit hook before the action can stage or commit', () => {
  withProject((project) => {
    project.write('src/components/Shared.tsx', 'downstream shared customization\n');
    project.commit('customize shared component');
    const base = project.git('rev-parse', 'HEAD');
    project.pull(() => project.write('src/components/Shared.tsx', 'upstream shared update\n'));

    // The action dispatches each hook command through a Bash pipeline under set -e.
    const result = spawnSync(
      'bash',
      [
        '-e',
        '-c',
        'printf \'%s\\n\' \'"$SYNC_NODE" "$SYNC_GUARD" prepare "$SYNC_STATE"\' | bash\ngit add .\ngit commit -qm "sync template"',
      ],
      {
        cwd: project.root,
        encoding: 'utf8',
        env: {
          ...process.env,
          SYNC_NODE: process.execPath,
          SYNC_GUARD: project.guardPath,
          SYNC_STATE: project.state,
        },
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unresolved template conflicts');
    expect(project.git('ls-files', '--unmerged')).toContain('src/components/Shared.tsx');
    expect(project.git('rev-parse', 'HEAD')).toBe(base);
  });
});

it('stops conflicting shared updates when template history is unrelated', () => {
  withProject((project) => {
    project.git('checkout', '--orphan', 'unrelated-template');
    project.git('commit', '-qm', 'independent template root');
    project.git('branch', '-f', 'template', 'HEAD');
    project.git('checkout', '-q', 'downstream');

    const merge = project.pull(() =>
      project.write('src/components/Shared.tsx', 'upstream update\n'),
    );

    expect(merge.status).not.toBe(0);
    const result = project.guard('prepare');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unresolved template conflicts');
  });
});

it('allows a customized shared file to be explicitly excluded', () => {
  withProject((project) => {
    project.write(
      '.templatesyncignore',
      project.read('.templatesyncignore') + '\nsrc/components/Shared.tsx\n',
    );
    project.write('src/components/Shared.tsx', 'downstream shared customization\n');
    project.commit('exclude customized component');
    project.pull(() => {
      project.write('src/components/Shared.tsx', 'upstream shared update\n');
      project.write('src/hooks/New.ts', 'shared hook\n');
    });
    project.finish();
    expect(project.read('src/components/Shared.tsx')).toBe('downstream shared customization\n');
    expect(project.read('src/hooks/New.ts')).toBe('shared hook\n');
  });
});

it.each([
  ['src/screens/Owned.tsx', 'src/screens/Renamed.tsx'],
  ['src/screens/Owned.tsx', 'src/components/Renamed.tsx'],
  ['src/components/Shared.tsx', 'src/screens/Renamed.tsx'],
])('stops a rename involving a protected path: %s -> %s', (source, destination) => {
  withProject((project) => {
    project.pull(() => {
      mkdirSync(dirname(join(project.root, destination)), {recursive: true});
      project.git('mv', source, destination);
    });
    const result = project.guard('prepare');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Rename involves an excluded path');
    expect(project.guard('verify').status).toBe(1);
  });
});

it('syncs a rename between shared paths', () => {
  withProject((project) => {
    project.pull(() =>
      project.git('mv', 'src/components/Shared.tsx', 'src/components/Renamed.tsx'),
    );
    project.finish();
    expect(project.read('src/components/Renamed.tsx')).toBe('shared component\n');
    expect(project.git('ls-files', 'src/components/Shared.tsx')).toBe('');
  });
});

it('uses the original exclusions and guard even if upstream replaces them', () => {
  withProject((project) => {
    project.pull(() => {
      project.write('.templatesyncignore', '# upstream removed all exclusions\n');
      project.write('scripts/template-sync-guard.mjs', 'throw new Error("upstream guard");\n');
      project.write('README.md', 'starter documentation\n');
    });
    project.finish();
    expect(project.read('README.md')).toBe('application documentation\n');
    expect(project.read('.templatesyncignore')).toContain('package.json');
    expect(project.read('scripts/template-sync-guard.mjs')).toContain('upstream guard');
  });
});

it('rejects a sync commit that changes an excluded path', () => {
  withProject((project) => {
    project.pull(() => project.write('src/components/Shared.tsx', 'shared update\n'));
    expect(project.guard('prepare').status).toBe(0);
    project.write('README.md', 'unexpected overwrite after the guard\n');
    project.commit('bad sync');
    const result = project.guard('verify');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Sync commit changes excluded paths');
  });
});

it('rejects an extra commit after the guarded sync', () => {
  withProject((project) => {
    project.pull(() => project.write('src/components/Shared.tsx', 'shared update\n'));
    project.finish();
    project.write('src/components/Shared.tsx', 'another update\n');
    project.commit('extra commit');
    expect(project.guard('verify').status).toBe(1);
  });
});

it('requires a clean checkout and nonempty exclusions', () => {
  withProject((project) => {
    project.write('README.md', 'uncommitted work\n');
    expect(project.snapshot().stderr).toContain('requires a clean checkout');
    project.write('.templatesyncignore', '# no exclusions\n');
    project.commit('remove exclusions');
    expect(project.snapshot().stderr).toContain('requires nonempty exclusions');
  });
});

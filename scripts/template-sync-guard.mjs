#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const [phase, statePath] = process.argv.slice(2);

function git(...args) {
  return execFileSync('git', args, {encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']});
}

function paths(output) {
  return output.split('\0').filter(Boolean);
}

function fail(message) {
  throw new Error(message);
}

try {
  if (!statePath || !['snapshot', 'prepare', 'verify'].includes(phase)) {
    fail('Usage: template-sync-guard.mjs <snapshot|prepare|verify> <state-file>');
  }

  if (phase === 'snapshot') {
    if (git('status', '--porcelain', '-z')) fail('Template sync requires a clean checkout.');
    const root = git('rev-parse', '--show-toplevel').trim();
    const destination = resolve(statePath);

    if (destination === root || destination.startsWith(root + '/')) {
      fail('Store the sync guard and state outside the checkout, such as RUNNER_TEMP.');
    }

    const ignorePath = existsSync('.github/.templatesyncignore')
      ? '.github/.templatesyncignore'
      : '.templatesyncignore';

    const patterns = readFileSync(ignorePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.split('#', 1)[0].trim())
      .filter(Boolean);

    if (!patterns.length) fail('Template sync requires nonempty exclusions.');
    // The action restores its ignore file separately; verify that protection too.
    patterns.push(`:(literal)${ignorePath}`);
    const state = {root, base: git('rev-parse', 'HEAD').trim(), patterns, prepared: false};
    writeFileSync(destination, JSON.stringify(state));
    copyFileSync(
      fileURLToPath(import.meta.url),
      join(dirname(destination), 'template-sync-guard.mjs'),
    );
    console.log('Saved downstream sync exclusions and guard outside the checkout.');
  } else {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));

    if (git('rev-parse', '--show-toplevel').trim() !== state.root) {
      fail('The sync guard state belongs to a different checkout.');
    }

    if (phase === 'prepare') {
      if (git('rev-parse', 'HEAD').trim() !== state.base) {
        fail('Template sync must leave HEAD at the original downstream commit until staging.');
      }

      const protectedPaths = new Set([
        ...paths(
          git('diff', '--name-only', '--no-renames', '-z', state.base, '--', ...state.patterns),
        ),
        ...paths(
          git(
            'diff',
            '--cached',
            '--name-only',
            '--no-renames',
            '-z',
            state.base,
            '--',
            ...state.patterns,
          ),
        ),
      ]);

      const changes = paths(
        git('diff', '--cached', '--name-status', '--find-renames', '-z', state.base),
      );

      for (let index = 0; index < changes.length;) {
        const status = changes[index++];
        const source = changes[index++];

        if (status.startsWith('R')) {
          const destination = changes[index++];

          if (protectedPaths.has(source) || protectedPaths.has(destination)) {
            fail(
              `Rename involves an excluded path: ${JSON.stringify(source)} -> ${JSON.stringify(destination)}. Review it manually.`,
            );
          }
        }
      }

      if (protectedPaths.size) {
        const literals = [...protectedPaths].map((path) => `:(literal)${path}`);
        // Reset first so modify/delete conflicts preserve downstream deletions.
        execFileSync(
          'git',
          ['reset', state.base, '--pathspec-from-file=-', '--pathspec-file-nul'],
          {input: literals.join('\0') + '\0'},
        );
        const tracked = [...new Set(paths(git('ls-files', '--cached', '-z', '--', ...literals)))];

        if (tracked.length) {
          execFileSync(
            'git',
            ['restore', '--worktree', '--pathspec-from-file=-', '--pathspec-file-nul'],
            {input: tracked.map((path) => `:(literal)${path}\0`).join('')},
          );
        }

        // Only clean excluded paths removed from the index, never unrelated files.
        git('clean', '-fd', '--', ...literals);
      }

      const unmerged = git('diff', '--name-only', '--diff-filter=U', '-z');

      if (unmerged) {
        fail(
          `Unresolved template conflicts: ${paths(unmerged)
            .map((path) => JSON.stringify(path))
            .join(', ')}. No sync commit will be created.`,
        );
      }

      // Failed merges can leave backup files that the action's git add would pick up.
      if (git('ls-files', '--others', '--exclude-standard', '-z')) {
        fail('Unexpected untracked files after the merge. Review them before syncing.');
      }

      state.prepared = true;
      writeFileSync(statePath, JSON.stringify(state));
      console.log(
        `Restored ${protectedPaths.size} excluded paths; no unresolved conflicts remain.`,
      );
    } else {
      if (!state.prepared || git('show', '-s', '--format=%P', 'HEAD').trim() !== state.base) {
        fail('Expected one guarded sync commit on top of the downstream base.');
      }

      const changed = git(
        'diff',
        '--name-only',
        '--no-renames',
        '-z',
        state.base,
        'HEAD',
        '--',
        ...state.patterns,
      );

      if (changed) {
        fail(
          `Sync commit changes excluded paths: ${paths(changed)
            .map((path) => JSON.stringify(path))
            .join(', ')}. Refusing to push.`,
        );
      }

      if (git('status', '--porcelain', '-z')) fail('Sync checkout is not clean. Refusing to push.');
      console.log('Verified sync commit preserves all excluded paths.');
    }
  }
} catch (error) {
  console.error(`Template sync guard: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

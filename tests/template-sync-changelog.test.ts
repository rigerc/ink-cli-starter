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

const repository = 'example/application';
const source = 'rigerc/ink-cli-starter';
const branch = 'chore/template_sync_test';
const pullEndpoint = `repos/${repository}/pulls/42`;

interface Pull {
  number: number;
  state: string;
  body: string | null;
  merged_at: string | null;
  merge_commit_sha: string;
  base: {ref: string};
  head: {ref: string; sha: string; repo: {full_name: string} | null};
}

class ChangelogProject {
  directory = mkdtempSync(join(tmpdir(), 'template-changelog-'));
  root = join(this.directory, 'checkout');
  state = join(this.directory, 'sync-state.json');
  helper = join(this.directory, 'template-sync-changelog.mjs');
  bin = join(this.directory, 'bin');
  routes = new Map<string, {stdout: string; stderr: string; status: number}>();
  history: Pull[][] = [[]];
  sourceBase: string;
  sourceHead: string;
  downstreamBase: string;
  pull: Pull;

  constructor(unrelated = false) {
    mkdirSync(this.root);
    mkdirSync(this.bin);
    this.git('init', '-q', '-b', 'main');
    this.git('config', 'user.name', 'Changelog test');
    this.git('config', 'user.email', 'changelog@example.invalid');
    this.write('README.md', 'downstream documentation\n');
    this.write('src/components/Shared.tsx', 'shared component\n');
    this.write('src/components/Obsolete.tsx', 'obsolete component\n');
    this.write('src/components/Old.tsx', 'renamed component with unique content\n');

    for (const path of [
      '.templatesyncignore',
      'scripts/template-sync-guard.mjs',
      'scripts/template-sync-changelog.mjs',
    ]) {
      const destination = join(this.root, path);
      mkdirSync(dirname(destination), {recursive: true});
      copyFileSync(new URL(`../${path}`, import.meta.url), destination);
    }

    this.commit('downstream base');

    if (unrelated) {
      this.git('checkout', '--orphan', 'template');
      this.git('commit', '-qm', 'unrelated template root');
    } else {
      this.git('checkout', '-qb', 'template');
    }

    this.write('src/hooks/Prior.ts', 'previously adopted hook\n');
    this.commit('previous upstream update');
    this.sourceBase = this.git('rev-parse', 'HEAD').trim();
    this.git('checkout', '-q', 'main');
    this.git(
      'merge',
      '--allow-unrelated-histories',
      '--squash',
      '--strategy=recursive',
      'template',
    );
    this.commit('accept previous sync with squash');
    this.downstreamBase = this.git('rev-parse', 'HEAD').trim();
    this.git('checkout', '-q', 'template');
    this.write('README.md', 'excluded upstream documentation\n');

    // With unrelated history, existing shared files must agree to avoid add/add conflicts.
    if (!unrelated) this.write('src/components/Shared.tsx', 'updated component\n');
    this.write('src/hooks/New.ts', 'new hook\n');
    this.git('rm', 'src/components/Obsolete.tsx');
    this.git('mv', 'src/components/Old.tsx', 'src/components/New [name].tsx');

    // Incoming source changes cannot replace the helper executing this run.
    if (!unrelated) {
      this.write('scripts/template-sync-changelog.mjs', 'throw new Error("incoming helper");\n');
    }

    this.commit('upstream updates');
    this.sourceHead = this.git('rev-parse', 'HEAD').trim();
    this.git('checkout', '-q', 'main');
    copyFileSync(join(this.root, 'scripts/template-sync-changelog.mjs'), this.helper);
    this.guard('snapshot');
    this.git('fetch', '.', 'template');
    // Like the action, tolerate a failed pull before running the guard.
    this.runGit(
      'merge',
      '--allow-unrelated-histories',
      '--squash',
      '--strategy=recursive',
      'FETCH_HEAD',
    );
    this.guard('prepare');
    this.commit('guarded sync');
    this.guard('verify');
    this.pull = {
      number: 42,
      state: 'open',
      body: 'Initial sync description',
      merged_at: null,
      merge_commit_sha: '',
      base: {ref: 'main'},
      head: {ref: branch, sha: this.git('rev-parse', 'HEAD').trim(), repo: {full_name: repository}},
    };
    writeFileSync(
      join(this.bin, 'gh'),
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const method = args[args.indexOf('--method') + 1];
const endpoint = args.find((arg) => arg.startsWith('repos/'));
const key = method + ' ' + endpoint;
const routes = new Map(JSON.parse(fs.readFileSync(process.env.TEST_ROUTES, 'utf8')));
fs.appendFileSync(process.env.TEST_CALLS, key + '\\n');
const reply = routes.get(key);
if (!reply) { process.stderr.write('Unexpected API request: ' + key); process.exit(1); }
if (method === 'PATCH' && reply.status === 0) fs.writeFileSync(process.env.TEST_BODY, fs.readFileSync(0));
process.stdout.write(reply.stdout);
process.stderr.write(reply.stderr);
process.exit(reply.status);
`,
      {mode: 0o755},
    );
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

  write(path: string, content: string) {
    const destination = join(this.root, path);
    mkdirSync(dirname(destination), {recursive: true});
    writeFileSync(destination, content);
  }

  commit(message: string) {
    this.git('add', '.');
    this.git('commit', '-qm', message);
  }

  guard(phase: string) {
    const guard =
      phase === 'snapshot'
        ? join(this.root, 'scripts/template-sync-guard.mjs')
        : join(this.directory, 'template-sync-guard.mjs');

    const result = spawnSync(process.execPath, [guard, phase, this.state], {
      cwd: this.root,
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
  }

  accepted(revision = this.sourceBase, mergedAt = '2026-01-01T00:00:00Z'): Pull {
    return {
      ...this.pull,
      number: 1,
      state: 'closed',
      body: `<!-- template-sync:${source}@${revision} -->`,
      merged_at: mergedAt,
      merge_commit_sha: this.downstreamBase,
    };
  }

  respond(endpoint: string, content: string, status = 0) {
    this.routes.set(endpoint, {
      stdout: status ? '' : content,
      stderr: status ? content : '',
      status,
    });
  }

  compare(status = 'ahead', count = 1, message = 'feat: improve shared UI') {
    this.respond(
      `GET repos/${source}/compare/${this.sourceBase}...${this.sourceHead}?per_page=100&page=1`,
      JSON.stringify({
        status,
        total_commits: count,
        commits: Array.from({length: count}, () => ({sha: this.sourceHead, commit: {message}})),
      }),
    );
  }

  run(number = '42') {
    this.respond(`GET ${pullEndpoint}`, JSON.stringify(this.pull));

    if (!this.routes.has(`PATCH ${pullEndpoint}`)) this.respond(`PATCH ${pullEndpoint}`, '{}');

    for (let index = 0; index <= this.history.length; index++) {
      this.respond(
        `GET repos/${repository}/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=100&page=${index + 1}`,
        JSON.stringify(this.history[index] || []),
      );
    }

    writeFileSync(join(this.directory, 'routes.json'), JSON.stringify([...this.routes]));

    return spawnSync(process.execPath, [this.helper, this.state], {
      cwd: this.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${this.bin}:${process.env.PATH}`,
        GH_TOKEN: 'test-token',
        GITHUB_REPOSITORY: repository,
        SYNC_PR_NUMBER: number,
        SYNC_PR_BRANCH: branch,
        SYNC_TEMPLATE_HASH: this.sourceHead.slice(0, 7),
        TEST_ROUTES: join(this.directory, 'routes.json'),
        TEST_CALLS: join(this.directory, 'calls.txt'),
        TEST_BODY: join(this.directory, 'body.json'),
      },
    });
  }

  body() {
    const result: {body: string} = JSON.parse(
      readFileSync(join(this.directory, 'body.json'), 'utf8'),
    );

    return result.body;
  }

  calls() {
    const path = join(this.directory, 'calls.txt');

    return existsSync(path) ? readFileSync(path, 'utf8') : '';
  }
}

function withProject(run: (project: ChangelogProject) => void, unrelated = false) {
  const project = new ChangelogProject(unrelated);

  try {
    run(project);
  } finally {
    rmSync(project.directory, {recursive: true, force: true});
  }
}

it('reports only guarded applied files and records a first-sync baseline using the saved helper', () => {
  withProject((project) => {
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    const body = project.body();
    expect(body).toContain('Added: <code>src/hooks/New.ts</code>');
    expect(body).toContain('Modified: <code>src/components/Shared.tsx</code>');
    expect(body).toContain('Deleted: <code>src/components/Obsolete.tsx</code>');
    expect(body).toContain(
      'Renamed: <code>src/components/Old.tsx</code> → <code>src/components/New &#91;name&#93;.tsx</code>',
    );
    expect(body).not.toContain('README.md');
    expect(body).toContain('No previous accepted upstream revision');
    expect(body).toContain(`<!-- template-sync:${source}@${project.sourceHead} -->`);
    expect(body).toContain('## Manual adoption');
    expect(project.calls()).not.toContain('/compare/');
    project.guard('verify');
  });
});

it('generates a commit changelog with unrelated template and downstream history', () => {
  withProject((project) => {
    // The upstream baseline was squash-merged, so it is not a downstream ancestor.
    expect(
      project.runGit('merge-base', '--is-ancestor', project.sourceBase, project.downstreamBase)
        .status,
    ).toBe(1);
    project.history = [[project.accepted()]];
    project.compare();
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    expect(project.body()).toContain('feat: improve shared UI');
    expect(project.body()).toContain(`${project.sourceBase}...${project.sourceHead}`);
    expect(project.body()).toContain('These commits include excluded changes');
  }, true);
});

it('finds the latest accepted baseline across pages, ignoring unmerged and unrelated PRs', () => {
  withProject((project) => {
    const old = project.accepted('a'.repeat(40), '2025-01-01T00:00:00Z');
    const valid = project.accepted();

    const wrongSource = {
      ...project.accepted(),
      body: `<!-- template-sync:other/template@${project.sourceHead} -->`,
    };

    const wrongRepo = {
      ...project.accepted(),
      head: {...valid.head, repo: {full_name: 'other/application'}},
    };

    const wrongBranch = {...project.accepted(), base: {ref: 'other'}};
    const wrongPrefix = {...project.accepted(), head: {...valid.head, ref: 'feature/new'}};
    const malformed = {...project.accepted(), body: `<!-- template-sync:${source}@bad-sha -->`};
    const unmerged = {...project.accepted(), merged_at: null};

    const notYetAccepted = {
      ...project.accepted(project.sourceHead, '2027-01-01T00:00:00Z'),
      merge_commit_sha: project.pull.head.sha,
    };

    const unrelated = {
      ...project.accepted(project.sourceHead, '2028-01-01T00:00:00Z'),
      merge_commit_sha: project.sourceHead,
    };

    project.history = [
      [
        old,
        wrongSource,
        wrongRepo,
        wrongBranch,
        wrongPrefix,
        malformed,
        unmerged,
        notYetAccepted,
        unrelated,
        ...Array.from({length: 91}, () => unmerged),
      ],
      [valid],
    ];
    project.compare();
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    expect(project.calls()).toContain('page=2');
    expect(project.body()).toContain('feat: improve shared UI');
    expect(project.calls()).not.toContain(`/compare/${old.body?.match(/@([a-f0-9]+)/)?.[1]}...`);
  }, true);
});

it('escapes commit Markdown, mentions, and HTML while keeping only the subject', () => {
  withProject((project) => {
    project.history = [[project.accepted()]];
    project.compare(
      'ahead',
      1,
      'fix: <script> @team [link](url) `code` & #123\n\nHidden commit body',
    );
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    const body = project.body();
    expect(body).toContain(
      '&#60;script&#62; &#64;team &#91;link&#93;&#40;url&#41; &#96;code&#96; &#38; &#35;123',
    );
    expect(body).not.toContain('Hidden commit body');
    expect(body).not.toContain('<script>');
  });
});

it('bounds large file lists and commit lists and retains the baseline marker', () => {
  withProject((project) => {
    for (let index = 0; index < 120; index++) project.write(`src/hooks/Hook${index}.ts`, 'hook\n');
    project.git('add', '.');
    project.git('commit', '--amend', '--no-edit', '-q');
    project.pull.head.sha = project.git('rev-parse', 'HEAD').trim();
    project.history = [[project.accepted()]];
    project.compare('ahead', 100, '[<@'.repeat(400));
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    const body = project.body();
    expect(body).toMatch(/Showing \d+ of 125 entries/);
    expect(body).toMatch(/Showing \d+ of 100 entries/);
    expect(Buffer.byteLength(body)).toBeLessThan(45_000);
    expect(body).toContain('/pull/42/files');
    expect(body).toContain(`<!-- template-sync:${source}@${project.sourceHead} -->`);
  });
});

it('preserves unusual filename boundaries and escapes their display text', () => {
  withProject((project) => {
    project.write('src/hooks/<odd> @team [x]\n\ttest.ts', 'hook\n');
    project.git('add', '.');
    project.git('commit', '--amend', '--no-edit', '-q');
    project.pull.head.sha = project.git('rev-parse', 'HEAD').trim();
    const result = project.run();

    expect(result.status, result.stderr).toBe(0);
    expect(project.body()).toContain(
      'Added: <code>src/hooks/&#60;odd&#62; &#64;team &#91;x&#93;  test.ts</code>',
    );
    expect(project.body()).not.toContain('<odd>');
    project.guard('verify');
  });
});

it('rejects a template revision that differs from the upstream commit actually fetched', () => {
  withProject((project) => {
    project.git('fetch', '.', 'main');
    const result = project.run();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not match the fetched upstream commit');
    expect(project.calls()).toBe('');
  });
});

it.each(['diverged', 'behind'])('explains rewritten upstream history (%s)', (status) => {
  withProject((project) => {
    project.history = [[project.accepted()]];
    project.compare(status);
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    expect(project.body()).toContain('history has diverged or moved backward');
    expect(project.body()).not.toContain('feat: improve shared UI');
  });
});

it.each([404, 422])('explains an unavailable upstream revision (HTTP %s)', (status) => {
  withProject((project) => {
    project.history = [[project.accepted()]];
    project.respond(
      `GET repos/${source}/compare/${project.sourceBase}...${project.sourceHead}?per_page=100&page=1`,
      `gh: unavailable (HTTP ${status})`,
      1,
    );
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    expect(project.body()).toContain('revision is unavailable');
    expect(project.body()).toContain(`${project.sourceBase}...${project.sourceHead}`);
  });
});

it('reports an identical upstream revision without inventing commits', () => {
  withProject((project) => {
    project.history = [[project.accepted()]];
    project.compare('identical', 0);
    const result = project.run();
    expect(result.status, result.stderr).toBe(0);
    expect(project.body()).toContain('No new upstream commits');
  });
});

it('skips without API calls when the action did not create a PR', () => {
  withProject((project) => {
    const result = project.run('');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('skipping changelog');
    expect(project.calls()).toBe('');
  });
});

it('rejects a PR whose head no longer matches the guarded commit', () => {
  withProject((project) => {
    project.pull.head.sha = project.sourceHead;
    const result = project.run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no longer matches');
    expect(project.calls()).not.toContain('PATCH');
  });
});

it('fails on API authorization errors rather than treating them as a missing baseline', () => {
  withProject((project) => {
    project.history = [[project.accepted()]];
    project.respond(
      `GET repos/${source}/compare/${project.sourceBase}...${project.sourceHead}?per_page=100&page=1`,
      'gh: forbidden (HTTP 403)',
      1,
    );
    const result = project.run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('HTTP 403');
    expect(project.calls()).not.toContain('PATCH');
  });
});

it('fails visibly when updating the PR description fails and preserves the sync commit', () => {
  withProject((project) => {
    project.respond(`PATCH ${pullEndpoint}`, 'gh: update failed (HTTP 500)', 1);
    const result = project.run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('update failed');
    expect(project.git('rev-parse', 'HEAD').trim()).toBe(project.pull.head.sha);
    project.guard('verify');
  });
});

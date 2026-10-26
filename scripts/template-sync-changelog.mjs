#!/usr/bin/env node
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const source = 'rigerc/ink-cli-starter';
const sourceUrl = `https://github.com/${source}`;
const fullHash = /^[a-f0-9]{40}$/;
const marker = /<!-- template-sync:rigerc\/ink-cli-starter@([a-f0-9]{40}) -->/;
const processOptions = {encoding: 'utf8', timeout: 30_000, maxBuffer: 16 * 1024 * 1024};

function git(...args) {
  return execFileSync('git', args, {...processOptions, stdio: ['pipe', 'pipe', 'pipe']}).trim();
}

function request(endpoint, method = 'GET', payload) {
  const args = [
    'api',
    '--hostname',
    'github.com',
    '--method',
    method,
    '-H',
    'Accept: application/vnd.github+json',
    endpoint,
  ];

  if (payload !== undefined) args.push('--input', '-');

  const result = spawnSync('gh', args, {
    ...processOptions,
    input: payload === undefined ? undefined : JSON.stringify(payload),
  });

  // A missing/replaced upstream revision is an expected changelog limitation.
  if (method === 'GET' && endpoint.includes('/compare/') && /HTTP (404|422)/.test(result.stderr)) {
    return null;
  }

  if (result.error || result.status !== 0) {
    throw new Error(`GitHub request failed: ${result.error?.message || result.stderr.trim()}`);
  }

  return JSON.parse(result.stdout);
}

function text(value) {
  const line = value.replace(/\p{Cc}/gu, ' ');
  const clipped = line.length > 500 ? line.slice(0, 500) + '…' : line;

  // Display filenames and subjects literally; code spans also suppress mentions.
  const escaped = clipped.replace(
    /[&<>"'\\`*_[\]{}()!#@|~]/g,
    (character) => `&#${character.codePointAt(0)};`,
  );

  return `<code>${escaped}</code>`;
}

function limitedList(lines, total, destination) {
  const shown = [];
  let bytes = 0;

  for (const line of lines.slice(0, 50)) {
    bytes += Buffer.byteLength(line, 'utf8');

    if (bytes > 20_000) break;
    shown.push(line);
  }

  if (shown.length < total) {
    shown.push(
      `\nShowing ${shown.length} of ${total} entries. See ${destination} for the complete list.`,
    );
  }

  return shown.join('\n');
}

function appliedChanges(base, head, repository, number) {
  // NUL delimiters preserve spaces, tabs, newlines, and rename source/destination pairs.
  const entries = git('diff', '--name-status', '--find-renames', '-z', base, head, '--').split(
    '\0',
  );

  const lines = [];
  const labels = {A: 'Added', D: 'Deleted', M: 'Modified', T: 'Type changed'};

  for (let index = 0; index < entries.length && entries[index];) {
    const status = entries[index++];
    const path = entries[index++];

    if (status.startsWith('R')) {
      lines.push(`- Renamed: ${text(path)} → ${text(entries[index++])}`);
    } else {
      lines.push(`- ${labels[status] || status}: ${text(path)}`);
    }
  }

  const filesUrl = `https://github.com/${repository}/pull/${number}/files`;

  return limitedList(lines, lines.length, `[Files changed](${filesUrl})`);
}

function previousRevision(repository, current, base) {
  let latest;

  // List all pages: updated order differs from merge order, and old PRs can be edited.
  for (let page = 1; ; page++) {
    const pulls = request(
      `repos/${repository}/pulls?state=closed&base=${encodeURIComponent(current.base.ref)}&sort=updated&direction=desc&per_page=100&page=${page}`,
    );

    for (const pull of pulls) {
      const revision = marker.exec(pull.body || '')?.[1];

      if (
        !pull.merged_at ||
        !revision ||
        pull.base.ref !== current.base.ref ||
        pull.head.repo?.full_name !== repository ||
        !pull.head.ref.startsWith('chore/template_sync_') ||
        !fullHash.test(pull.merge_commit_sha) ||
        (latest && pull.merged_at <= latest.mergedAt)
      )
        continue;

      const ancestor = spawnSync(
        'git',
        ['merge-base', '--is-ancestor', pull.merge_commit_sha, base],
        processOptions,
      );

      if (ancestor.error) throw ancestor.error;

      if (ancestor.status === 0) latest = {revision, mergedAt: pull.merged_at};
    }

    if (pulls.length < 100) return latest?.revision;
  }
}

function upstreamChanges(previous, current) {
  if (!previous) {
    return 'No previous accepted upstream revision was recorded. The commit range is unavailable for this sync; this PR records the baseline for subsequent syncs.';
  }

  const compareUrl = `${sourceUrl}/compare/${previous}...${current}`;
  const link = `[upstream comparison](${compareUrl})`;

  const comparison = request(
    `repos/${source}/compare/${previous}...${current}?per_page=100&page=1`,
  );

  if (!comparison) {
    return `The previous or current upstream revision is unavailable. Review the ${link} manually; no commit list could be generated.`;
  }

  if (!['ahead', 'identical'].includes(comparison.status)) {
    return `Upstream history has diverged or moved backward. Review the ${link} manually; a reliable “since last sync” commit list is unavailable.`;
  }

  if (!comparison.total_commits) return `No new upstream commits. See the ${link}.`;

  const lines = comparison.commits.map((commit) => {
    if (!fullHash.test(commit.sha)) throw new Error('Invalid upstream commit SHA.');

    return `- [${commit.sha.slice(0, 7)}](${sourceUrl}/commit/${commit.sha}) ${text(commit.commit.message.split('\n')[0])}`;
  });

  return `Since [${previous.slice(0, 7)}](${sourceUrl}/commit/${previous}). These commits include excluded changes and are upstream context; the applied files are listed above.\n\n${limitedList(lines, comparison.total_commits, link)}\n\nSee the ${link}.`;
}

function main() {
  const number = process.env.SYNC_PR_NUMBER;

  if (!number) {
    console.log('No sync PR was created; skipping changelog.');

    return;
  }

  const repository = process.env.GITHUB_REPOSITORY;
  const branch = process.env.SYNC_PR_BRANCH;
  const templateHash = process.env.SYNC_TEMPLATE_HASH;

  if (
    !/^[1-9]\d*$/.test(number) ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository || '') ||
    !/^[a-f0-9]{7,40}$/.test(templateHash || '')
  ) {
    throw new Error('Expected a valid PR number, GITHUB_REPOSITORY, and SYNC_TEMPLATE_HASH.');
  }

  const state = JSON.parse(readFileSync(process.argv[2], 'utf8'));

  if (
    !state.prepared ||
    !fullHash.test(state.base) ||
    git('rev-parse', '--show-toplevel') !== state.root
  ) {
    throw new Error('Expected the saved guard state for this checkout.');
  }

  const head = git('rev-parse', 'HEAD');

  if (git('show', '-s', '--format=%P', head) !== state.base || git('status', '--porcelain')) {
    throw new Error('Expected a clean, single sync commit on the saved downstream base.');
  }

  const current = git('rev-parse', '--verify', `${templateHash}^{commit}`);

  if (!fullHash.test(current) || current !== git('rev-parse', '--verify', 'FETCH_HEAD^{commit}')) {
    throw new Error('The template revision does not match the fetched upstream commit.');
  }

  const endpoint = `repos/${repository}/pulls/${number}`;
  const pull = request(endpoint);

  if (
    pull.state !== 'open' ||
    pull.head.sha !== head ||
    pull.head.ref !== branch ||
    pull.head.repo?.full_name !== repository
  ) {
    throw new Error('The created PR no longer matches the guarded sync branch.');
  }

  const previous = previousRevision(repository, pull, state.base);

  const body = [
    `Sync changes from [ink-cli-starter at ${current.slice(0, 7)}](${sourceUrl}/commit/${current}).`,
    '## Applied changes',
    appliedChanges(state.base, head, repository, number),
    '## Upstream changelog',
    upstreamChanges(previous, current),
    '## Manual adoption',
    'Package metadata, dependencies, npm scripts, workflows, release setup, and application-owned files are excluded by default. Review upstream changes to these separately and adopt the relevant changes manually.',
    'Static exclusions cannot identify every downstream customization. Maintain `.templatesyncignore` and review the Files changed tab before merging.',
    `<!-- template-sync:${source}@${current} -->`,
  ].join('\n\n');

  request(endpoint, 'PATCH', {body});
  console.log(`Updated sync PR #${number} with a changelog.`);
}

try {
  main();
} catch (error) {
  console.error(
    `Template sync changelog: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}

import {spawnSync} from 'node:child_process';
import {copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect, it} from 'vite-plus/test';

type PackageMetadata = {
  name: string;
  private?: boolean;
  repository?: string | {type: string; url: string};
};

function preflight(metadata: PackageMetadata, publish: string) {
  const root = mkdtempSync(join(tmpdir(), 'ink-release-preflight-'));

  try {
    mkdirSync(join(root, 'scripts'));
    copyFileSync(
      new URL('../scripts/release-preflight.mjs', import.meta.url),
      join(root, 'scripts/release-preflight.mjs'),
    );
    writeFileSync(join(root, 'package.json'), JSON.stringify(metadata));

    return spawnSync(process.execPath, [join(root, 'scripts/release-preflight.mjs')], {
      cwd: tmpdir(),
      env: {...process.env, NPM_PUBLISH: publish},
      encoding: 'utf8',
    });
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

it.each(['', 'false', 'TRUE'])('allows tag-only releases with NPM_PUBLISH=%j', (publish) => {
  const result = preflight({name: 'ink-kit', private: true}, publish);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain('versioning, git tags and GitHub releases only');
});

it.each([
  [{name: 'my-cli', private: true, repository: 'owner/repo'}, '"private": true'],
  [{name: 'ink-kit', repository: 'owner/repo'}, 'template name'],
  [{name: 'my-cli'}, '"repository" field'],
])('blocks npm publishing with incomplete metadata: %j', (metadata, message) => {
  const result = preflight(metadata, 'true');
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(message);
});

it('allows npm publishing after customization', () => {
  const result = preflight(
    {name: 'my-cli', repository: {type: 'git', url: 'https://github.com/owner/repo.git'}},
    'true',
  );

  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toBe('');
});

import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {afterEach, test} from 'node:test';
import {checkSkillAccuracy} from '../scripts/check-skill-accuracy.mjs';

const tempRoots = [];
const canonical = '.agents/skills/ink-cli-starter/SKILL.md';
const mirror = '.claude/skills/ink-cli-starter/SKILL.md';
const skill = `---
name: ink-cli-starter
description: >-
  Guide for copied GitHub template apps.
---
# Guide

Read \`docs/architecture.md\` and run \`npm run check\` or \`npm test\`.
Use \`src/features/<feature>/\` for domain code.

\`\`\`bash
npm run check
\`\`\`
`;
function put(root, relative, value) {
  const file = join(root, relative);
  mkdirSync(dirname(file), {recursive: true});
  writeFileSync(file, value);
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'ink-skill-accuracy-'));
  tempRoots.push(root);
  put(root, canonical, skill);
  put(root, mirror, skill);
  put(root, 'docs/architecture.md', '# Architecture\n');
  put(root, 'package.json', JSON.stringify({scripts: {check: 'node -v', test: 'node --test'}}));
  return root;
}
afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, {recursive: true, force: true});
});

test('accepts a valid skill and ignores example placeholder paths', () => {
  const {issues, paths, scripts} = checkSkillAccuracy(fixture());
  assert.deepEqual(issues, []);
  assert.deepEqual(paths, ['docs/architecture.md']);
  assert.deepEqual(scripts, ['check', 'test']);
});

test('fails when the canonical and Claude mirror diverge', () => {
  const root = fixture();
  put(root, mirror, skill + '\nLocal change\n');
  assert.match(checkSkillAccuracy(root).issues.join('\n'), /Skill copies differ/);
});

test('reports missing reference paths and missing package scripts', () => {
  const root = fixture();
  const modified = skill
    .replace('docs/architecture.md', 'docs/removed.md')
    .replaceAll('npm run check', 'npm run deleted');
  put(root, canonical, modified);
  put(root, mirror, readFileSync(join(root, canonical), 'utf8'));
  const issues = checkSkillAccuracy(root).issues.join('\n');
  assert.match(issues, /missing path: docs\/removed\.md/);
  assert.match(issues, /missing from package\.json: deleted/);
});

test('rejects broken frontmatter and unclosed code fences', () => {
  const root = fixture();
  const broken = skill
    .replace('name: ink-cli-starter', 'name: another-skill')
    .replace(/\n```\n$/, '\n');
  put(root, canonical, broken);
  put(root, mirror, broken);
  const issues = checkSkillAccuracy(root).issues.join('\n');
  assert.match(issues, /frontmatter must declare name/);
  assert.match(issues, /Unclosed Markdown code fence/);
});

test('detects stale documented APIs when exports disappear', () => {
  const root = fixture();
  const withApi = skill.replace('# Guide', '# Guide\nUse `defineCommand` for input.');
  put(root, canonical, withApi);
  put(root, mirror, withApi);
  put(root, 'src/commands/definition.ts', 'export function defineCommand() {}');
  assert.deepEqual(checkSkillAccuracy(root).issues, []);
  put(root, 'src/commands/definition.ts', 'export function renamed() {}');
  assert.match(checkSkillAccuracy(root).issues.join('\n'), /no longer exported/);
});

test('checks documented directory paths as well as files', () => {
  const root = fixture();
  const altered = skill.replace(
    'Read `docs/architecture.md`',
    'Read `docs/architecture.md` and `docs/missing/`',
  );
  put(root, canonical, altered);
  put(root, mirror, altered);
  assert.match(checkSkillAccuracy(root).issues.join('\n'), /missing path: docs\/missing\//);
});

test('accepts tilde-fenced command examples', () => {
  const root = fixture();
  const modified = skill.replaceAll('```', '~~~');
  put(root, canonical, modified);
  put(root, mirror, modified);
  assert.deepEqual(checkSkillAccuracy(root).issues, []);
});

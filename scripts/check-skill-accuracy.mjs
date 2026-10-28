#!/usr/bin/env node
import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const canonicalPath = '.agents/skills/ink-cli-starter/SKILL.md';
const mirrorPath = '.claude/skills/ink-cli-starter/SKILL.md';

// These documented extension APIs must still exist in their starter modules.
const apiSources = {
  defineCommand: 'src/commands/definition.ts',
  defineCommandGroup: 'src/commands/definition.ts',
  useKeymap: 'src/hooks/useKeymap.ts',
  useInputCapture: 'src/hooks/useInputCapture.tsx',
  useAsync: 'src/hooks/useAsync.ts',
  ScreenState: 'src/components/ScreenState.tsx',
};

function referencedPaths(markdown) {
  // Check concrete paths in inline code. Template placeholders such as
  // src/features/<feature>/ are intentionally not filesystem paths.
  const references = [...markdown.matchAll(/`([^`\r\n]+)`/g)].map((match) => match[1]);
  const candidates = references.map((value) => value.replace(/^\.\//, '').split('#')[0]);
  const repoPath =
    /^(?:(?:src|docs|tests|scripts)\/|\.(?:agents|claude|agentsmesh)\/|(?:AGENTS|CLAUDE|README)\.md$|package\.json$|\.templatesyncignore$)/;
  return [...new Set(candidates.filter((value) => !/[<>\s]/.test(value) && repoPath.test(value)))];
}

function fencedCodeIssues(markdown) {
  const issues = [];
  let fence = null;
  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    const marker = match[1];
    if (fence === null) {
      fence = {marker: marker[0], length: marker.length, line: index + 1};
    } else if (
      marker[0] === fence.marker &&
      marker.length >= fence.length &&
      match[2].trim() === ''
    ) {
      fence = null;
    }
  }
  if (fence) issues.push(`Unclosed Markdown code fence starting on line ${fence.line}`);
  return issues;
}

/** Check the upstream template's vendored agent skill without running the application. */
export function checkSkillAccuracy(root = process.cwd()) {
  const issues = [];
  const read = (relative) => readFileSync(join(root, relative), 'utf8');
  if (!existsSync(join(root, canonicalPath))) {
    issues.push(`Missing canonical skill: ${canonicalPath}`);
  }
  if (!existsSync(join(root, mirrorPath))) {
    issues.push(`Missing Claude mirror: ${mirrorPath}`);
  }
  if (issues.length) return {issues, paths: [], scripts: []};

  const skill = read(canonicalPath);
  if (read(mirrorPath) !== skill) {
    issues.push(`Skill copies differ: ${canonicalPath} and ${mirrorPath}`);
  }

  const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatter) {
    issues.push('SKILL.md must begin with YAML frontmatter enclosed by --- lines');
  } else {
    const header = frontmatter[1];
    if (!/^name:\s*ink-cli-starter\s*$/m.test(header)) {
      issues.push('Skill frontmatter must declare name: ink-cli-starter');
    }
    const description = header.match(
      /^description:\s*[>|][-+]?\s*\r?\n((?:[ \t]+[^\r\n]*\r?\n?)+)/m,
    );
    if (!description || !description[1].trim()) {
      issues.push('Skill frontmatter must have a nonempty block description');
    }
    if (!/^#\s+\S/m.test(skill.slice(frontmatter[0].length))) {
      issues.push('Skill body must contain a Markdown heading');
    }
  }
  issues.push(...fencedCodeIssues(skill));

  const paths = referencedPaths(skill);
  for (const path of paths) {
    if (!existsSync(join(root, path))) issues.push(`Skill refers to missing path: ${path}`);
  }

  let packageJson;
  try {
    packageJson = JSON.parse(read('package.json'));
  } catch {
    issues.push('Cannot read package.json to verify documented npm scripts');
  }
  const scripts = [...new Set([...skill.matchAll(/\bnpm\s+run\s+([\w:-]+)/g)].map((m) => m[1]))];
  if (/\bnpm\s+test\b/.test(skill)) scripts.push('test');
  for (const name of new Set(scripts)) {
    if (packageJson && !Object.hasOwn(packageJson.scripts ?? {}, name)) {
      issues.push(`Skill uses npm script missing from package.json: ${name}`);
    }
  }

  for (const [name, path] of Object.entries(apiSources)) {
    if (!new RegExp(`\\b${name}\\b`).test(skill)) continue;
    if (!existsSync(join(root, path))) {
      issues.push(`Skill mentions ${name}, but its starter source is missing: ${path}`);
    } else if (
      !new RegExp(
        `\\bexport\\s+(?:(?:async|default)\\s+)?(?:function|const|class)\\s+${name}\\b`,
      ).test(read(path))
    ) {
      issues.push(`Skill mentions ${name}, but it is no longer exported from ${path}`);
    }
  }

  return {issues, paths, scripts: [...new Set(scripts)]};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const {issues, paths, scripts} = checkSkillAccuracy();
  if (issues.length) {
    console.error('Ink CLI starter skill accuracy check failed:');
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Skill accuracy OK: mirrors match, ${paths.length} paths and ${scripts.length} scripts checked.`,
    );
  }
}

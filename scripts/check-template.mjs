#!/usr/bin/env node
import {existsSync, readFileSync} from 'node:fs';
import ts from '@typescript/typescript6';

const templateName = 'ink-kit';

const templateDescription =
  'GitHub template for an Ink 8, React 19 and TypeScript terminal application';

const warnings = [];
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function checkMetadata(metadata, path, prefix = '') {
  if (metadata?.name === templateName) {
    warnings.push(`${path}: ${prefix}name still uses "${templateName}".`);
  }

  if (Object.hasOwn(metadata?.bin ?? {}, templateName)) {
    warnings.push(`${path}: ${prefix}bin still defines the "${templateName}" command.`);
  }
}

const pkg = readJson('package.json');

checkMetadata(pkg, 'package.json');

if (pkg.description === templateDescription) {
  warnings.push('package.json: description still uses the template description.');
}

if (existsSync('package-lock.json')) {
  const lock = readJson('package-lock.json');
  checkMetadata(lock, 'package-lock.json');
  checkMetadata(lock.packages?.[''], 'package-lock.json', 'packages[""].');
}

for (const [path, name] of [
  ['src/lib/config.ts', 'APP_NAME'],
  ['src/config/store.ts', 'appName'],
]) {
  if (!existsSync(path)) continue;
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest);

  function visit(node) {
    if (
      (ts.isVariableDeclaration(node) || ts.isParameter(node)) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer &&
      (ts.isStringLiteral(node.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(node.initializer)) &&
      node.initializer.text === templateName
    ) {
      const {line} = source.getLineAndCharacterOfPosition(node.getStart(source));
      warnings.push(`${path}:${line + 1}: ${name} still defaults to "${templateName}".`);
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
}

for (const warning of warnings) console.warn(`warning: ${warning}`);

if (warnings.length) {
  console.warn(
    'Customize these values before publishing your application. See docs/template/customization.md. Template warnings do not fail this check.',
  );
}

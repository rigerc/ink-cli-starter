#!/usr/bin/env node
// Fails fast when npm publishing is switched on before the template was customized.
import {readFileSync} from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const publishToNpm = process.env.NPM_PUBLISH === 'true';
const errors = [];

if (publishToNpm) {
  if (pkg.private === true) {
    errors.push('package.json has "private": true. Remove it before publishing to npm.');
  }

  if (pkg.name === 'ink-kit') {
    errors.push('package.json still uses the template name "ink-kit". Rename the package first.');
  }

  if (!pkg.repository) {
    errors.push(
      'package.json needs a "repository" field (required for provenance and trusted publishing).',
    );
  }
} else {
  console.log(
    '::notice::NPM_PUBLISH is not "true": versioning, git tags and GitHub releases only.',
  );
}

for (const message of errors) console.error(`::error::${message}`);

if (errors.length) process.exit(1);

import {defineConfig} from 'vite-plus';

// Additional style and architecture restrictions are opt-in for downstream applications.
const strictLint = process.env.INK_STRICT_LINT === '1';
const opinionatedLintRules = {
  'anti-slop/no-array-filter-map': 'error',
  'anti-slop/no-conditional-empty-object-spread': 'error',
  'anti-slop/no-known-value-widening': 'error',
  'anti-slop/no-module-mocking': 'error',
  'anti-slop/no-object-parameters': 'error',
  'anti-slop/no-reflect-apply': 'error',
  'anti-slop/no-reflect-get': 'error',
  'anti-slop/no-runtime-typeof': 'error',
  'anti-slop/no-shape-in-symbol-names': 'error',
  'anti-slop/no-unknown-parameters': 'error',
  'anti-slop/no-unknown-returns': 'error',
  'anti-slop/no-unknown-type-aliases': 'error',
  'anti-slop/no-unsafe-dictionary-type': 'error',
  'anti-slop/require-readable-spacing': 'error',
  'anti-slop/require-safety-comment-for-type-assertion': 'error',
} as const;

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'build/**', 'dist/**', 'tttt/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'json-summary', 'lcov'],
      thresholds: {statements: 60, branches: 50, functions: 58, lines: 63},
    },
  },
  pack: {
    entry: ['src/cli.tsx'],
    format: ['esm'],
    target: 'node22',
    clean: true,
    sourcemap: true,
    // Keep the published entry at dist/cli.js (package.json bin/start):
    // derive the extension from `"type": "module"` instead of forcing .mjs.
    fixedExtension: false,
    // Keep runtime deps external; they are installed alongside the package.
    deps: {
      neverBundle: ['react', 'ink', 'commander', '@commander-js/extra-typings', 'zod'],
    },
    dts: false,
  },
  fmt: {
    // Keep the code style already used in this repository.
    singleQuote: true,
    bracketSpacing: false,
    // Generated output, scaffolded apps and tool state are not sources.
    ignorePatterns: [
      // AgentsMesh owns these projections; format .agentsmesh/rules instead.
      'AGENTS.md',
      'CLAUDE.md',
      'opencode.json',
      'build/**',
      'dist/**',
      'screenshots/**',
      'tttt/**',
      '.serena/**',
      '.claude/**',
      '.agent/**',
      '.agents/**',
      '.codex/**',
      '.continue/**',
      '.cursor/**',
      '.gemini/**',
      '.opencode/**',
      '.pi/**',
      '.roo/**',
      '.windsurf/**',
      'tools/oxlint/anti-slop/**',
    ],
  },
  lint: {
    jsPlugins: [
      {name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin'},
      {name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts'},
    ],
    rules: {
      // High-confidence correctness and costly patterns stay enabled by default.
      'vite-plus/prefer-vite-plus-imports': 'error',
      'oxc/no-accumulating-spread': 'error',
      'anti-slop/no-reduce-accumulator-copy': 'error',
      'anti-slop/no-chained-type-assertions': 'error',
      'anti-slop/no-widen-then-assert': 'error',
      // Set INK_STRICT_LINT=1 to enable additional opinionated conventions.
      ...(strictLint ? opinionatedLintRules : {}),
    },
    options: {typeAware: true, typeCheck: true},
    ignorePatterns: [
      'build/**',
      'dist/**',
      'screenshots/**',
      'tttt/**',
      '.serena/**',
      '.agent/**',
      '.agents/**',
      '.claude/**',
      '.codex/**',
      '.continue/**',
      '.cursor/**',
      '.gemini/**',
      '.opencode/**',
      '.pi/**',
      '.roo/**',
      '.windsurf/**',
      'tools/oxlint/anti-slop/**',
    ],
  },
});

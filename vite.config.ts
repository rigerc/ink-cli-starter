import {defineConfig} from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
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
      neverBundle: ['react', 'ink', 'meow', 'zod', 'string-width'],
    },
    dts: false,
  },
  fmt: {
    // Keep the code style already used in this repository.
    singleQuote: true,
    bracketSpacing: false,
  },
  lint: {
    jsPlugins: [{name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin'}],
    rules: {'vite-plus/prefer-vite-plus-imports': 'error'},
    options: {typeAware: true, typeCheck: true},
  },
});

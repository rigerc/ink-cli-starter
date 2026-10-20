import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
  // Keep runtime deps external; they are installed alongside the package.
  external: ['react', 'ink', 'meow', 'zod', 'string-width'],
});

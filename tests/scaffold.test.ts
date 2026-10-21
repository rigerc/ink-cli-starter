import {spawn, spawnSync} from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vite-plus/test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts/scaffold.mjs');

function run(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [script, ...args], {cwd, encoding: 'utf8'});
}

async function runInteractive(
  cwd: string,
  args: string[],
  steps: Array<{prompt: string; answer: string}>,
) {
  return await new Promise<{status: number | null; stdout: string; stderr: string}>(
    (resolve, reject) => {
      const child = spawn(process.execPath, [script, ...args], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      let cursor = 0;
      let next = 0;
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error(`Interactive scaffold timed out: ${stdout}\n${stderr}`));
      }, 4000);
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
        while (next < steps.length) {
          const step = steps[next]!;
          const position = stdout.indexOf(step.prompt, cursor);
          if (position < 0) break;
          cursor = position + step.prompt.length;
          next++;
          child.stdin.write(step.answer + '\n');
        }
      });
      child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on('close', (status) => {
        clearTimeout(timeout);
        resolve({status, stdout, stderr});
      });
    },
  );
}

function withTempDir(check: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'ink-scaffold-'));
  try {
    check(dir);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

function write(path: string, content: string) {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, content);
}

describe('app scaffolding', () => {
  it('creates a standalone app with targeted metadata and a minimal README', () => {
    withTempDir((dir) => {
      const result = run(dir, 'sample-cli');
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'sample-cli');
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      const lock = JSON.parse(readFileSync(join(target, 'package-lock.json'), 'utf8'));
      expect(pkg.name).toBe('sample-cli');
      expect(pkg.bin).toEqual({'sample-cli': './dist/cli.js'});
      expect(pkg.scripts.scaffold).toBeUndefined();
      expect(pkg.scripts['demo:inline']).toBeUndefined();
      expect(pkg.scripts['demo:ui']).toBeUndefined();
      expect(lock.name).toBe('sample-cli');
      expect(lock.packages[''].name).toBe('sample-cli');
      expect(lock.packages[''].bin).toEqual({'sample-cli': 'dist/cli.js'});
      expect(lock.packages[''].devDependencies['ink-testing-library']).toBe('^4.0.0');
      expect(readFileSync(join(target, 'src/lib/config.ts'), 'utf8')).toContain(
        "APP_NAME = 'sample-cli'",
      );
      expect(readFileSync(join(target, 'src/cli.tsx'), 'utf8')).toContain('APP_THEME_ENV');
      expect(readFileSync(join(target, 'src/app.tsx'), 'utf8')).toContain('title={pkg.name}');
      expect(existsSync(join(target, 'src/demos/InlineDemo.tsx'))).toBe(false);
      expect(existsSync(join(target, 'src/screens/Tasks.tsx'))).toBe(false);
      expect(existsSync(join(target, 'src/screens/UiDemo.tsx'))).toBe(false);
      expect(existsSync(join(target, 'tests/ui-demo.test.tsx'))).toBe(false);
      expect(existsSync(join(target, 'templates'))).toBe(false);
      expect(existsSync(join(target, 'src/commands/index.ts'))).toBe(true);
      expect(existsSync(join(target, 'src/commands/doctor.ts'))).toBe(true);
      expect(readFileSync(join(target, 'src/screens/index.ts'), 'utf8')).toContain(
        'showInNav: false',
      );
      expect(readFileSync(join(target, 'src/cli.tsx'), 'utf8')).not.toContain('InlineDemo');
      expect(readFileSync(join(target, 'scripts/screenshot.tsx'), 'utf8')).not.toContain(
        'InlineDemo',
      );
      expect(readFileSync(join(target, 'tests/stepper.test.tsx'), 'utf8')).not.toContain(
        'InlineDemo',
      );
      expect(readFileSync(join(target, 'scripts/screenshot.tsx'), 'utf8')).toContain('pkg.name');
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toMatch(/^# sample-cli\n/);
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('npm run dev');
      expect(pkg.scripts.record).toContain('--video');
      expect(pkg.devDependencies.playwright).toBeUndefined();
      expect(pkg.devDependencies['ansi-to-html']).toBeUndefined();
      expect(existsSync(join(target, 'scripts/tapes/workflow.tape'))).toBe(true);
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain(
        'docs/framework/recording.md',
      );
      expect(pkg.scripts['theme:token']).toBe('node scripts/theme.mjs token');
      expect(pkg.scripts['theme:default']).toBe('node scripts/theme.mjs default');
      expect(existsSync(join(target, 'scripts/theme.mjs'))).toBe(true);
      expect(existsSync(join(target, 'src/theme/palettes.json'))).toBe(true);
      expect(existsSync(join(target, 'src/theme/defaults.json'))).toBe(true);
      const changeDefault = spawnSync(
        process.execPath,
        [join(target, 'scripts/theme.mjs'), 'default', 'contrast'],
        {cwd: dir, encoding: 'utf8'},
      );
      expect(changeDefault.status, changeDefault.stderr).toBe(0);
      expect(
        JSON.parse(readFileSync(join(target, 'src/theme/defaults.json'), 'utf8')).defaultTheme,
      ).toBe('contrast');
      const changeToken = spawnSync(
        process.execPath,
        [join(target, 'scripts/theme.mjs'), 'token', 'dark', 'primary', '#112233'],
        {cwd: dir, encoding: 'utf8'},
      );
      expect(changeToken.status, changeToken.stderr).toBe(0);
      expect(
        JSON.parse(readFileSync(join(target, 'src/theme/palettes.json'), 'utf8')).dark.primary,
      ).toBe('#112233');
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('theme:default');
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain(
        'docs/framework/adding-a-feature.md',
      );
      expect(existsSync(join(target, 'docs/framework/architecture.md'))).toBe(true);
      expect(existsSync(join(target, 'docs/framework/adding-a-feature.md'))).toBe(true);
      for (const doc of ['architecture.md', 'adding-a-feature.md', 'ui-framework.md']) {
        expect(existsSync(join(target, 'docs', doc))).toBe(false);
      }
      expect(readFileSync(join(target, 'src/screens/Home.tsx'), 'utf8')).toContain(
        'docs/framework/adding-a-feature.md',
      );
      const uiGuide = readFileSync(join(target, 'docs/framework/ui-framework.md'), 'utf8');
      expect(uiGuide).toBe(readFileSync(join(repoRoot, 'docs/ui-framework.md'), 'utf8'));
      expect(uiGuide).toContain('## Keyboard routing and focus');
      expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain(
        '[UI framework guide](docs/framework/ui-framework.md)',
      );
      expect(readFileSync(join(target, 'docs/framework/architecture.md'), 'utf8')).toContain(
        '[the UI framework guide](ui-framework.md)',
      );
      const agents = readFileSync(join(target, 'AGENTS.md'), 'utf8');
      expect(agents).toContain('[UI framework guide](docs/framework/ui-framework.md)');
      expect(agents).toContain('Vite+');
      expect(agents).toContain('npm run typecheck');
      expect(agents).toContain('npm run test');
      expect(agents).not.toContain('<!-- SCAFFOLD_TOOLCHAIN_GUIDANCE -->');
      expect(existsSync(join(target, '.github/workflows/ci.yml'))).toBe(true);
      expect(existsSync(join(target, 'src/screens'))).toBe(true);
      expect(existsSync(join(target, 'tests/screens.test.tsx'))).toBe(true);
      expect(existsSync(join(target, 'scripts/screenshot.tsx'))).toBe(true);
      for (const excluded of [
        '.git',
        'node_modules',
        'scripts/scaffold.mjs',
        'tests/scaffold.test.ts',
      ]) {
        expect(existsSync(join(target, excluded))).toBe(false);
      }
    });
  });

  it('discovers new tracked files without copying untracked files or unrelated names', () => {
    withTempDir((dir) => {
      const source = join(dir, 'source');
      const scaffold = join(source, 'scripts/scaffold.mjs');
      mkdirSync(dirname(scaffold), {recursive: true});
      copyFileSync(script, scaffold);
      copyFileSync(
        join(repoRoot, 'scripts/scaffold-options.mjs'),
        join(source, 'scripts/scaffold-options.mjs'),
      );
      mkdirSync(join(source, 'docs'), {recursive: true});
      write(join(source, 'docs/architecture.md'), 'fixture');
      write(join(source, 'docs/ui-framework.md'), 'fixture UI guide');
      write(
        join(source, 'AGENTS.md'),
        '# Fixture agents\n\n<!-- SCAFFOLD_TOOLCHAIN_GUIDANCE -->\n',
      );
      write(join(source, 'src/cli.tsx'), '// fixture\n');
      write(join(source, 'src/screens/index.ts'), '// fixture\n');
      write(join(source, 'src/screens/Help.tsx'), '// fixture\n');
      write(
        join(source, 'package.json'),
        JSON.stringify({
          name: 'ink-kit',
          bin: {'ink-kit': './dist/cli.js'},
          scripts: {scaffold: 'node scripts/scaffold.mjs', dev: 'tsx src/cli.tsx'},
        }),
      );
      write(
        join(source, 'package-lock.json'),
        JSON.stringify({
          name: 'ink-kit',
          packages: {'': {name: 'ink-kit', bin: {'ink-kit': 'dist/cli.js'}}},
        }),
      );
      write(join(source, 'src/lib/config.ts'), "export const APP_NAME = 'ink-kit';\n");
      write(join(source, 'src/components/NewWidget.tsx'), '// ink-kit is mentioned in a comment\n');
      write(join(source, 'README.md'), 'Starter-only documentation');
      write(join(source, '.github/workflows/ci.yml'), 'CI should not be copied');
      write(join(source, 'tests/scaffold.test.ts'), 'Scaffolding-only tests');

      expect(spawnSync('git', ['init', '-q'], {cwd: source}).status).toBe(0);
      expect(spawnSync('git', ['add', '.'], {cwd: source}).status).toBe(0);
      write(join(source, 'src/untracked.ts'), 'Keep out');

      const result = spawnSync(process.execPath, [scaffold, 'new-app'], {
        cwd: dir,
        encoding: 'utf8',
      });
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'new-app');
      expect(readFileSync(join(target, 'src/components/NewWidget.tsx'), 'utf8')).toBe(
        '// ink-kit is mentioned in a comment\n',
      );
      expect(readFileSync(join(target, 'src/lib/config.ts'), 'utf8')).toContain(
        "APP_NAME = 'new-app'",
      );
      expect(existsSync(join(target, 'src/untracked.ts'))).toBe(false);
      expect(existsSync(join(target, '.github/workflows/screenshots.yml'))).toBe(false);
      expect(readFileSync(join(target, 'docs/framework/ui-framework.md'), 'utf8')).toBe(
        'fixture UI guide',
      );
      const agents = readFileSync(join(target, 'AGENTS.md'), 'utf8');
      expect(agents).toContain('npm run typecheck');
      expect(agents).not.toContain('SCAFFOLD_TOOLCHAIN_GUIDANCE');
      expect(existsSync(join(target, 'scripts/scaffold.mjs'))).toBe(false);
      expect(existsSync(join(target, 'tests/scaffold.test.ts'))).toBe(false);
    });
  });

  it('accepts an explicit destination path and creates missing parent directories', () => {
    withTempDir((dir) => {
      const destination = join(dir, 'nested folder', 'renamed-project');
      const result = run(dir, 'custom-cli', '--path', destination);
      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(join(destination, 'src/cli.tsx'))).toBe(true);
      const pkg = JSON.parse(readFileSync(join(destination, 'package.json'), 'utf8'));
      expect(pkg.name).toBe('custom-cli');
      expect(existsSync(join(dir, 'custom-cli'))).toBe(false);

      const existing = run(dir, 'custom-cli', '--path', destination);
      expect(existing.status).not.toBe(0);
      expect(pkg.name).toBe('custom-cli');
    });
  });

  it('accepts short -p and resolves relative destinations against the caller cwd', () => {
    withTempDir((dir) => {
      const result = run(dir, 'local-cli', '-p', 'apps/local-cli');
      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(join(dir, 'apps/local-cli/package.json'))).toBe(true);
    });
  });

  it('prompts for an app name, destination and confirmation in interactive mode', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ink-scaffold-interactive-'));
    try {
      const result = await runInteractive(
        dir,
        ['--interactive'],
        [
          {prompt: 'App name (lowercase kebab-case): ', answer: 'Bad_Name'},
          {prompt: 'App name (lowercase kebab-case): ', answer: 'prompted-cli'},
          {prompt: 'Destination path [prompted-cli]: ', answer: 'apps/new-location'},
          {prompt: 'Preset [standard]', answer: ''},
          {prompt: 'Package manager [npm]', answer: ''},
          {prompt: 'Toolchain [vite-plus]', answer: ''},
          {prompt: 'Features [', answer: ''},
          {prompt: 'Create "prompted-cli" at "', answer: 'yes'},
        ],
      );
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('Use lowercase letters');
      expect(existsSync(join(dir, 'apps/new-location/package.json'))).toBe(true);
      const pkg = JSON.parse(readFileSync(join(dir, 'apps/new-location/package.json'), 'utf8'));
      expect(pkg.name).toBe('prompted-cli');
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('allows cancelling interactive scaffolding without creating files', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ink-scaffold-cancel-'));
    try {
      const result = await runInteractive(
        dir,
        ['cancelled-cli', '--interactive', '--path', 'somewhere'],
        [
          {prompt: 'Preset [standard]', answer: ''},
          {prompt: 'Package manager [npm]', answer: ''},
          {prompt: 'Toolchain [vite-plus]', answer: ''},
          {prompt: 'Features [', answer: ''},
          {prompt: 'Create "cancelled-cli" at "', answer: 'n'},
        ],
      );
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('Cancelled.');
      expect(existsSync(join(dir, 'somewhere'))).toBe(false);
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('creates a minimal project without optional screens and commands', () => {
    withTempDir((dir) => {
      const result = run(dir, 'tiny-cli', '--preset', 'minimal');
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'tiny-cli');
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      expect(existsSync(join(target, 'src/screens/Settings.tsx'))).toBe(false);
      expect(existsSync(join(target, 'src/screens/Gallery.tsx'))).toBe(false);
      expect(existsSync(join(target, 'src/demos/ConfigSetup.tsx'))).toBe(false);
      expect(existsSync(join(target, 'src/commands/doctor.ts'))).toBe(false);
      expect(existsSync(join(target, 'scripts/screenshot.tsx'))).toBe(false);
      expect(existsSync(join(target, '.github/workflows/ci.yml'))).toBe(false);
      expect(pkg.scripts.gallery).toBeUndefined();
      expect(pkg.scripts.screenshot).toBeUndefined();
      expect(pkg.scripts.record).toBeUndefined();
      expect(existsSync(join(target, 'scripts/tapes'))).toBe(false);
      expect(existsSync(join(target, 'docs/framework/recording.md'))).toBe(false);
      expect(existsSync(join(target, 'tests/capture.test.ts'))).toBe(false);
      expect(pkg.scripts.test).toBeDefined();
      expect(readFileSync(join(target, 'src/cli.tsx'), 'utf8')).not.toContain('ConfigSetup');
      expect(readFileSync(join(target, 'src/screens/index.ts'), 'utf8')).not.toContain(
        'SettingsScreen',
      );
      expect(readFileSync(join(target, 'tests/screens.test.tsx'), 'utf8')).not.toContain(
        "render('gallery'",
      );
      expect(existsSync(join(target, 'docs/framework/ui-framework.md'))).toBe(true);
      expect(readFileSync(join(target, 'AGENTS.md'), 'utf8')).toContain('npm run test');
      expect(readFileSync(join(target, 'AGENTS.md'), 'utf8')).not.toContain('screenshot`');
    });
  });

  it('supports explicit features and no optional testing dependencies', () => {
    withTempDir((dir) => {
      const result = run(dir, 'lean-cli', '--features', 'doctor,ci');
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'lean-cli');
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      expect(existsSync(join(target, 'tests'))).toBe(false);
      expect(existsSync(join(target, 'src/commands/doctor.ts'))).toBe(true);
      expect(existsSync(join(target, '.github/workflows/ci.yml'))).toBe(true);
      expect(pkg.devDependencies['ink-testing-library']).toBeUndefined();
      expect(pkg.devDependencies.playwright).toBeUndefined();
      expect(pkg.scripts.test).toBeUndefined();
      expect(readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8')).not.toContain(
        'npm run test',
      );
      expect(existsSync(join(target, 'docs/framework/ui-framework.md'))).toBe(true);
      expect(readFileSync(join(target, 'AGENTS.md'), 'utf8')).toContain(
        'No test script is installed',
      );
    });
  });

  it('switches to tsdown and Vitest without Vite+ configuration', () => {
    withTempDir((dir) => {
      const result = run(dir, 'tsdown-cli', '--toolchain', 'tsdown', '--package-manager', 'pnpm');
      expect(result.status, result.stderr).toBe(0);
      const target = join(dir, 'tsdown-cli');
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      expect(pkg.scripts.build).toBe('tsdown');
      expect(pkg.scripts.test).toBe('vitest run');
      expect(pkg.devDependencies.tsdown).toBeDefined();
      expect(pkg.devDependencies['vite-plus']).toBeUndefined();
      expect(existsSync(join(target, 'tsdown.config.ts'))).toBe(true);
      expect(existsSync(join(target, 'vitest.config.ts'))).toBe(true);
      expect(existsSync(join(target, 'vite.config.ts'))).toBe(false);
      expect(existsSync(join(target, 'package-lock.json'))).toBe(false);
      expect(readFileSync(join(target, 'tests/theme.test.ts'), 'utf8')).toContain("from 'vitest'");
      expect(readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8')).toContain(
        'pnpm install',
      );
      const agents = readFileSync(join(target, 'AGENTS.md'), 'utf8');
      expect(agents).toContain('tsdown');
      expect(agents).toContain('pnpm run typecheck');
      expect(agents).toContain('pnpm run test');
      expect(agents).not.toContain('Vite+');
      expect(agents).not.toContain('SCAFFOLD_TOOLCHAIN_GUIDANCE');
      expect(existsSync(join(target, 'docs/framework/ui-framework.md'))).toBe(true);
    });
  });

  it('supports all package managers and rejects invalid options before writing files', () => {
    withTempDir((dir) => {
      for (const manager of ['npm', 'pnpm', 'yarn', 'bun']) {
        const name = manager + '-cli';
        const result = run(dir, name, '--package-manager', manager, '--features', 'none');
        expect(result.status, result.stderr).toBe(0);
        const target = join(dir, name);
        expect(existsSync(join(target, 'tests'))).toBe(false);
        if (manager !== 'npm') expect(existsSync(join(target, 'package-lock.json'))).toBe(false);
      }
      for (const args of [
        ['--preset', 'unknown'],
        ['--package-manager', 'nope'],
        ['--toolchain', 'nope'],
        ['--features', 'gallery,unknown'],
        ['--features', 'settings,settings,'],
      ]) {
        const name = 'bad-cli';
        const result = run(dir, name, ...args);
        expect(result.status).not.toBe(0);
        expect(existsSync(join(dir, name))).toBe(false);
      }
    });
  });

  it('never overwrites an existing directory', () => {
    withTempDir((dir) => {
      mkdirSync(join(dir, 'taken'));
      writeFileSync(join(dir, 'taken', 'keep.txt'), 'leave me alone');
      const result = run(dir, 'taken');
      expect(result.status).not.toBe(0);
      expect(readFileSync(join(dir, 'taken', 'keep.txt'), 'utf8')).toBe('leave me alone');
      expect(existsSync(join(dir, 'taken', 'package.json'))).toBe(false);
    });
  });

  it('rejects invalid names and prints help', () => {
    withTempDir((dir) => {
      expect(run(dir, '../outside').status).not.toBe(0);
      expect(run(dir, 'Bad_Name').status).not.toBe(0);
      expect(run(dir).status).not.toBe(0);
      expect(run(dir, 'valid-cli', '--path', '').status).not.toBe(0);
      expect(run(dir, 'valid-cli', '--path').status).not.toBe(0);
      const result = run(dir, '--help');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('npm run scaffold -- <app-name>');
    });
  });
});

import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

/** Bin key of the scaffolder, which never belongs to a generated app. */
const scaffolderBin = 'ink-cli-starter';

type BinMap = Record<string, string>;
type PackageJson = {name?: string; bin?: unknown; scripts?: Record<string, string>};
type PackageLock = {name?: string; packages?: Record<string, {name?: string; bin?: unknown}>};

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Rename the starter's own bin entry and drop the scaffolder entry, so a
 * generated app exposes exactly one command: its own.
 */
export function renameBins(bin: unknown, previous: string, next: string): BinMap {
  const renamed: BinMap = {};
  if (!bin || typeof bin !== 'object' || Array.isArray(bin)) return renamed;
  for (const [key, value] of Object.entries(bin as BinMap)) {
    if (typeof value !== 'string') continue;
    if (key === scaffolderBin || value.includes(scaffolderBin)) continue;
    renamed[key === previous ? next : key] = value;
  }
  return renamed;
}

const readme = (name: string) => `# ${name}

An Ink 8 / React CLI application. Requires Node.js 22+.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Commands

\`\`\`bash
npm run gallery       # Browse the component gallery
npm run demo:inline   # Run the interactive setup demo
npm test              # Test the application
npm run build         # Build the CLI
npm start             # Run the built CLI
\`\`\`

Edit \`src/screens\` to customize screens, \`src/lib/config.ts\` for configuration,
and \`src/theme\` for themes.
`;

/**
 * Point the copied starter at its new name. Only `package.json`, the root of
 * `package-lock.json` and the `APP_NAME` constant are touched; the CLI title,
 * help text and theme environment variable derive from them.
 */
export async function renameApp(destination: string, name: string): Promise<void> {
  const packagePath = join(destination, 'package.json');
  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as PackageJson;
  const previous = pkg.name;
  if (typeof previous !== 'string' || !previous) throw new Error('Missing starter package name.');

  pkg.name = name;
  pkg.bin = renameBins(pkg.bin, previous, name);
  if (pkg.scripts) delete pkg.scripts['scaffold'];
  await writeJson(packagePath, pkg);

  const lockPath = join(destination, 'package-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8')) as PackageLock;
  const rootPackage = lock.packages?.[''];
  if (!rootPackage) throw new Error('Unsupported package-lock.json: no root package.');
  lock.name = name;
  rootPackage.name = name;
  rootPackage.bin = renameBins(rootPackage.bin, previous, name);
  await writeJson(lockPath, lock);

  const configPath = join(destination, 'src/lib/config.ts');
  const config = await readFile(configPath, 'utf8');
  const match = config.match(/^export const APP_NAME\s*=\s*(['"])([^'"]+)\1;/m);
  if (!match || match[2] !== previous) {
    throw new Error('Could not locate the starter APP_NAME constant in src/lib/config.ts.');
  }
  await writeFile(configPath, config.replace(match[0], `export const APP_NAME = '${name}';`));

  await writeFile(join(destination, 'README.md'), readme(name));
}

import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {z} from 'zod';
import {configSchema} from '../src/config/schema';
import {itemsSchema} from '../src/features/example/items';
import {doctorReportSchema} from '../src/commands/doctor';

const definitions = [
  ['config.schema.json', configSchema],
  ['example-items.schema.json', itemsSchema],
  ['doctor-report.schema.json', doctorReportSchema],
] as const;

const outputDirectory = fileURLToPath(new URL('../contracts/', import.meta.url));
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--check') || args.length > 1) {
  console.error('Usage: npm run contracts:generate [-- --check]');
  process.exitCode = 2;
} else {
  const check = args.includes('--check');
  let stale = false;
  if (!check) mkdirSync(outputDirectory, {recursive: true});

  // Object property order is not meaningful in JSON Schema.
  const canonical = (value: unknown): string =>
    JSON.stringify(value, (_key, item: unknown) => {
      if (item !== null && !Array.isArray(item) && typeof item === 'object') {
        return Object.fromEntries(
          Object.entries(item).sort(([left], [right]) => left.localeCompare(right)),
        );
      }
      return item;
    });

  for (const [filename, schema] of definitions) {
    const target = join(outputDirectory, filename);
    const generated = z.toJSONSchema(schema, {target: 'draft-2020-12'});
    if (check) {
      let matches = false;
      try {
        matches = canonical(JSON.parse(readFileSync(target, 'utf8'))) === canonical(generated);
      } catch {
        // A missing or invalid JSON file is stale.
      }
      if (!matches) {
        stale = true;
        console.error(`Outdated contract: ${filename}`);
      }
    } else {
      writeFileSync(target, `${JSON.stringify(generated, null, 2)}\n`);
      console.log(`Generated contracts/${filename}`);
    }
  }
  if (stale) {
    console.error('Run npm run contracts:generate and commit the updated JSON Schemas.');
    process.exitCode = 1;
  }
}

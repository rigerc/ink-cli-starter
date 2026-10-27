import {z} from 'zod';
import {itemsSchema, itemStatus, listItems} from '../features/example/items';
import {readInput} from '../lib/input';
import {AppError} from '../lib/errors';
import {defineCommand} from './definition';

export const exampleCommand = defineCommand({
  name: 'example',
  description: 'List example work items, optionally from piped JSON',
  arguments: '[input]',
  options: [
    {flags: '--status <status>', description: 'Filter by status', choices: itemStatus.options},
  ],
  schema: z.object({status: itemStatus.optional()}),
  run: async ({args, options, context}) => {
    if (args[0] && args[0] !== '-')
      throw new AppError('Use - to read JSON from stdin', {exitCode: 2});
    const raw = args[0] === '-' || !process.stdin.isTTY ? await readInput(context.signal) : '';
    let items;
    try {
      items = raw.trim() ? itemsSchema.parse(JSON.parse(raw)) : undefined;
    } catch {
      throw new AppError('Input must be a JSON array of work items', {exitCode: 2});
    }
    if (args[0] === '-' && !raw.trim()) throw new AppError('No JSON input received', {exitCode: 2});
    const result = listItems(items, options.status ? [options.status] : undefined);
    context.output(
      context.flags.json
        ? JSON.stringify(result, null, 2)
        : result.map((item) => `${item.id}\t${item.status}\t${item.name}`).join('\n'),
    );
  },
});

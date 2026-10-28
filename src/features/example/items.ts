import {setTimeout as delay} from 'node:timers/promises';
import {z} from 'zod';

export const itemStatus = z.enum(['ready', 'running', 'blocked']);
export const itemsSchema = z.array(
  z.object({id: z.string(), name: z.string(), status: itemStatus, description: z.string()}),
);
export type ExampleItem = z.infer<typeof itemsSchema>[number];
export const exampleItems: readonly ExampleItem[] = [
  {
    id: 'build',
    name: 'Build package',
    status: 'ready',
    description: 'Compile the application and generate its executable.',
  },
  {
    id: 'test',
    name: 'Run tests',
    status: 'running',
    description: 'Verify the domain operations and keyboard interactions.',
  },
  {
    id: 'docs',
    name: 'Write docs',
    status: 'ready',
    description: 'Describe the public commands and extension points.',
  },
  {
    id: 'release',
    name: 'Publish release',
    status: 'blocked',
    description: 'Choose package metadata before publishing the application.',
  },
  {
    id: 'capture',
    name: 'Capture demo',
    status: 'ready',
    description: 'Record a reproducible terminal demonstration.',
  },
  {
    id: 'review',
    name: 'Review changes',
    status: 'running',
    description: 'Check the final behavior before sharing the change.',
  },
];

/** This pure operation is reusable from headless commands or Ink components. */
export function listItems(
  items: readonly ExampleItem[] = exampleItems,
  statuses: readonly string[] = itemStatus.options,
): ExampleItem[] {
  return items.filter((item) => statuses.includes(item.status));
}

/** Local, cancellable simulation makes all async states reproducible without networking. */
export async function refreshItems(signal: AbortSignal, mode: 'ready' | 'empty' | 'error') {
  await delay(150, undefined, {signal});
  if (mode === 'error') throw new Error('Example refresh failed. Press r to retry.');
  return mode === 'empty' ? [] : listItems();
}

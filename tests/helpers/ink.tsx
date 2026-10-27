import {setTimeout as delay} from 'node:timers/promises';
import {render} from 'ink-testing-library';
import type {ReactElement} from 'react';
import {afterEach} from 'vite-plus/test';

type MountedApp = ReturnType<typeof render>;
const mounted: MountedApp[] = [];

afterEach(() => {
  for (const app of mounted.splice(0)) {
    app.unmount();
    app.cleanup();
  }
});

/** Ink batches updates on its own render cadence. */
export async function flushFrame() {
  await delay(55);
}

export async function mount(node: ReactElement) {
  const app = render(node);
  mounted.push(app);
  await flushFrame();
  return app;
}

export async function sendKey(app: MountedApp, input: string) {
  app.stdin.write(input);
  await flushFrame();
}

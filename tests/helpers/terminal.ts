import {PassThrough, Writable} from 'node:stream';
import {setTimeout as tick} from 'node:timers/promises';
import {render, type Instance} from 'ink';
import type {ReactNode} from 'react';
import {afterEach, vi} from 'vitest';

const instances: Instance[] = [];
afterEach(() => { for (const instance of instances.splice(0)) instance.cleanup(); });

export async function mount(node: ReactNode) {
  let output = '';
  let frame = '';
  const stdout = Object.assign(new Writable({write(chunk, _encoding, done) {
    const text = chunk.toString();
    if (text.trim()) frame = text; // Ignore flush barriers and teardown newlines.
    output += text;
    done();
  }}), {columns: 80, rows: 24});
  const stdin = Object.assign(new PassThrough(), {isTTY: true, setRawMode: vi.fn(), ref() {}, unref() {}});
  const instance = render(node, {stdout, stdin, stderr: stdout, debug: true, patchConsole: false, exitOnCtrlC: false});
  instances.push(instance);
  const settle = async () => { await tick(10); await instance.waitUntilRenderFlush(); };
  await settle();
  return {instance, output: () => output, frame: () => frame, settle,
    key: async (key: string) => { stdin.write(key); await settle(); }};
}

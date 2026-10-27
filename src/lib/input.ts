import {AppError} from './errors';

/** Explicit stdin consumption for commands accepting `-`; never steals TUI input. */
export async function readInput(
  signal: AbortSignal,
  input = process.stdin,
  limit = 1024 * 1024,
): Promise<string> {
  if (input.isTTY) throw new AppError('Expected piped input for -', {exitCode: 2});
  signal.throwIfAborted();
  const chunks: Buffer[] = [];
  let size = 0;
  const abort = () => input.destroy(new Error('Input cancelled'));
  signal.addEventListener('abort', abort, {once: true});
  try {
    for await (const chunk of input) {
      signal.throwIfAborted();
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > limit) throw new AppError(`Input exceeds ${limit} bytes`, {exitCode: 2});
      chunks.push(buffer);
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

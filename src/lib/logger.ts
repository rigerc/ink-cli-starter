import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  renameSync,
  rmSync,
  statSync,
  writeSync,
} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, join} from 'node:path';
import {inspect} from 'node:util';
import {APP_NAME} from './identity';

export const logPath = (): string =>
  join(
    process.env.XDG_STATE_HOME ?? join(homedir(), '.local', 'state'),
    APP_NAME,
    `${APP_NAME}.log`,
  );
const levels = {debug: 0, info: 1, warn: 2, error: 3, off: 4} as const;
export type LogLevel = keyof typeof levels;
const sensitive = /password|passwd|secret|token|authorization|cookie|api[-_]?key/i;

/** Redact before formatting, including Error causes; circular objects remain safe. */
export function redact(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (typeof value === 'string')
    return value
      .replace(/(Bearer\s+)[\w.-]+/gi, '$1[REDACTED]')
      .replace(/((?:password|secret|token|api[_-]?key)=)[^\s&]+/gi, '$1[REDACTED]')
      .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@');
  if (!(value instanceof Object)) return value;
  if (seen.has(value) || depth > 8) return '[Circular or truncated]';
  seen.add(value);
  if (value instanceof Error)
    return {
      name: value.name,
      message: redact(value.message, seen, depth + 1),
      stack: redact(value.stack, seen, depth + 1),
      cause: redact(value.cause, seen, depth + 1),
    };
  if (Array.isArray(value)) return value.map((entry) => redact(entry, seen, depth + 1));
  if (value instanceof Map)
    return new Map(
      [...value.entries()].map(([key, entry]) => [
        redact(key, seen, depth + 1),
        sensitive.test(String(key)) ? '[REDACTED]' : redact(entry, seen, depth + 1),
      ]),
    );
  if (value instanceof Set)
    return new Set([...value].map((entry) => redact(entry, seen, depth + 1)));
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitive.test(key) ? '[REDACTED]' : redact(entry, seen, depth + 1),
    ]),
  );
}

/** Cut a buffer below limit bytes without splitting a UTF-8 sequence. */
function utf8SafeSlice(buffer: Buffer, limit: number) {
  if (buffer.length <= limit) return buffer;
  let end = limit;
  // A cut can land inside a multi-byte sequence: back off to its lead byte.
  for (let back = 1; back <= 4 && back <= end; back++) {
    const byte = buffer[end - back]!;
    if ((byte & 0xc0) === 0x80) continue;
    if (back <= (byte >= 0xf0 ? 3 : byte >= 0xe0 ? 2 : byte >= 0xc0 ? 1 : 0)) end -= back;
    break;
  }
  return buffer.subarray(0, end);
}

/** One open descriptor, one rotated backup, and a strict byte cap per file. */
export function createLogger(
  options: {path?: () => string; maxBytes?: number; level?: LogLevel} = {},
) {
  let level: LogLevel = options.level ?? 'error';
  let descriptor: number | undefined;
  let path: string | undefined;
  let size = 0;
  const maxBytes = Math.max(256, options.maxBytes ?? 1024 * 1024);
  const close = () => {
    if (descriptor !== undefined) {
      closeSync(descriptor);
      descriptor = undefined;
    }
  };
  const write = (severity: Exclude<LogLevel, 'off'>, args: unknown[]) => {
    if (levels[severity] < levels[level]) return;
    try {
      const target = (options.path ?? logPath)();
      if (path !== target) {
        close();
        path = target;
      }
      if (descriptor === undefined) {
        mkdirSync(dirname(target), {recursive: true});
        size = existsSync(target) ? statSync(target).size : 0;
        descriptor = openSync(target, 'a', 0o600);
      }
      const content = args
        .map((value) => inspect(redact(value), {depth: 8, breakLength: Infinity}))
        .join(' ');
      const line = Buffer.from(
        `${new Date().toISOString()} ${severity.toUpperCase()} ${content}\n`,
      );
      const bounded =
        line.length > maxBytes
          ? Buffer.concat([utf8SafeSlice(line, maxBytes - 1), Buffer.from('\n')])
          : line;
      if (size + bounded.length > maxBytes) {
        close();
        rmSync(`${target}.1`, {force: true});
        renameSync(target, `${target}.1`);
        descriptor = openSync(target, 'a', 0o600);
        size = 0;
      }
      size += writeSync(descriptor, bounded);
    } catch {
      // Diagnostics must never break the application.
      try {
        close();
      } catch {
        descriptor = undefined;
      }
    }
  };
  return {
    setLevel(next: LogLevel) {
      level = next;
    },
    setDebug(enabled: boolean) {
      level = enabled ? 'debug' : 'error';
    },
    debug: (...args: unknown[]) => write('debug', args),
    info: (...args: unknown[]) => write('info', args),
    warn: (...args: unknown[]) => write('warn', args),
    error: (...args: unknown[]) => write('error', args),
    close,
  };
}
export const logger = createLogger();

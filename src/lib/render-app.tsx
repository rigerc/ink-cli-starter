import pkg from '../../package.json' with {type: 'json'};
import {render, renderToString} from 'ink';
import {App, PlainView} from '../app';
import {appConfig, resolveConfig} from '../config';
import {APP_ENV_PREFIX} from './identity';
import {getUpdateNotice} from './updates';
import {loadConfig} from './config';
import {AppError} from './errors';
import {logger} from './logger';
import {isInteractive} from './terminal';
import type {createProgram} from './program';

/** Run the same native Ink view interactively or render a single static frame. */
export async function runApp(
  flags: ReturnType<ReturnType<typeof createProgram>['opts']>,
  signal: AbortSignal,
) {
  if (flags.json)
    throw new AppError('--json requires a headless subcommand (e.g. doctor)', {exitCode: 2});

  const {config, error} = loadConfig(flags.config);
  if (error) logger.error('config:', error);
  const label = resolveConfig(appConfig.fields, config).values.label ?? pkg.name;

  if (flags.plain || !isInteractive()) {
    console.log(
      renderToString(<PlainView label={label} />, {columns: process.stdout.columns || 80}),
    );
    return;
  }
  if (!process.stdin.isTTY)
    throw new AppError('Interactive mode requires terminal input', {
      exitCode: 2,
      hint: 'Use --plain or a headless command for piped input.',
    });

  const notice = await getUpdateNotice({
    enabled: process.env[`${APP_ENV_PREFIX}_UPDATE_NOTIFIER`] === '1' && !flags.quiet,
    privatePackage: pkg.private,
    packageName: pkg.name,
    currentVersion: pkg.version,
    signal,
  });
  if (notice) process.stderr.write(`${notice}\n`);
  signal.throwIfAborted();

  const instance = render(<App label={label} />, {
    interactive: true,
    exitOnCtrlC: false,
    isScreenReaderEnabled: flags.screenReader || process.env.INK_SCREEN_READER === 'true',
    alternateScreen: flags.alternateScreen,
  });
  const abort = () => instance.unmount();
  signal.addEventListener('abort', abort, {once: true});
  try {
    await instance.waitUntilExit();
  } finally {
    signal.removeEventListener('abort', abort);
    instance.unmount();
  }
}

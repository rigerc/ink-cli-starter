import pkg from '../../package.json' with {type: 'json'};
import {APP_ENV_PREFIX} from './identity';
import {getUpdateNotice} from './updates';
import {render, renderToString, useInput} from 'ink';
import {App, PlainView, defaultApp, type AppOptions} from '../app';
import {appConfig, resolveConfig, type Config} from '../config';
import {ConfigSetup} from '../demos/ConfigSetup';
import {APP_NAME, APP_THEME_ENV, loadConfig} from './config';
import {AppError} from './errors';
import {logger} from './logger';
import {isInteractive, noColor, supportsUnicode} from './terminal';
import {isThemeName, resolveThemeName} from '../theme/resolve';
import type {createProgram} from './program';

/** Ctrl-C remains available even while a custom editor captures normal shortcuts. */
function TerminalInterrupt({onInterrupt}: {onInterrupt: () => void}) {
  useInput((_input, key) => {
    if (key.ctrl && _input === 'c') onInterrupt();
  });
  return null;
}

export async function runApp(
  flags: ReturnType<ReturnType<typeof createProgram>['opts']>,
  signal: AbortSignal,
  onInterrupt: () => void,
) {
  if (flags.json)
    throw new AppError('--json requires a headless subcommand (e.g. doctor)', {exitCode: 2});
  const screen = flags.screen ?? defaultApp.initialScreen;
  if (!defaultApp.findScreen(screen))
    throw new AppError(`Unknown screen "${screen}"`, {
      exitCode: 2,
      hint: `Try one of: ${defaultApp.screens.map((item) => item.id).join(', ')}`,
    });
  const {config, error} = loadConfig(flags.config);
  if (error) logger.error('config:', error);
  if (flags.setup && error)
    throw new AppError('Cannot edit invalid configuration', {hint: error, exitCode: 2});
  const configFlags: Partial<Config> = {
    theme: flags.theme === 'auto' || isThemeName(flags.theme) ? flags.theme : undefined,
    ascii: flags.ascii ? true : undefined,
  };
  const resolved = resolveConfig(appConfig.fields, config, {flags: configFlags});
  const options: AppOptions = {
    theme: resolveThemeName({
      flag: flags.theme,
      env: process.env[APP_THEME_ENV],
      config: config.theme,
      noColor: noColor(),
    }),
    ascii: resolved.values.ascii ?? !supportsUnicode(),
    debug: Boolean(flags.debug),
    screen,
    configFile: flags.config,
    configFlags,
  };
  logger.debug('options', options);
  if (flags.setup && (flags.plain || !isInteractive()))
    throw new AppError('Configuration wizard requires an interactive terminal', {
      exitCode: 2,
      hint: `Run ${APP_NAME} --setup in a TTY, or use ${APP_NAME} config.`,
    });
  const screenReader = flags.screenReader || process.env.INK_SCREEN_READER === 'true';
  if (flags.plain || !isInteractive()) {
    console.log(
      renderToString(<PlainView options={options} />, {columns: process.stdout.columns || 80}),
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
  const instance = render(
    <>
      <TerminalInterrupt onInterrupt={onInterrupt} />
      {flags.setup ? <ConfigSetup options={options} /> : <App options={options} />}
    </>,
    {
      interactive: true,
      exitOnCtrlC: false,
      isScreenReaderEnabled: screenReader,
      alternateScreen: flags.alternateScreen,
    },
  );
  const abort = () => instance.unmount();
  signal.addEventListener('abort', abort, {once: true});
  try {
    await instance.waitUntilExit();
  } finally {
    signal.removeEventListener('abort', abort);
    instance.unmount();
  }
}

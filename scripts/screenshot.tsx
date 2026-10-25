import {spawnSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import pkg from '../package.json';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const formats = ['gif', 'mp4', 'webm'];

// VHS strings are delimited, without JavaScript-style backslash escaping.
export function tapeQuote(value: string): string {
  const delimiter = ['"', "'", '`'].find((quote) => !value.includes(quote));
  if (!delimiter || /[\r\n]/.test(value))
    throw new Error('Path cannot be represented in a VHS tape');
  return delimiter + value + delimiter;
}
export const shellQuote = (value: string): string => "'" + value.replaceAll("'", "'\"'\"'") + "'";

export function captureTape(options: {
  columns: number;
  rows: number;
  theme: string;
  command: string;
  screenshot: string;
  outputs: string[];
  workflow?: string;
  ready?: string;
}): string {
  return [
    ...options.outputs.map((output) => 'Output ' + tapeQuote(output)),
    'Require node',
    'Set Shell "bash"',
    'Set FontFamily "DejaVu Sans Mono"',
    'Set FontSize 14',
    `Set Columns ${options.columns}`,
    `Set Rows ${options.rows}`,
    'Set Padding 24',
    'Set Framerate 15',
    'Set TypingSpeed 0',
    'Set CursorBlink false',
    `Set Theme "${options.theme === 'light' ? 'Github' : 'TokyoNight'}"`,
    'Env PS1 ""',
    'Hide',
    'Type ' + tapeQuote(options.command),
    'Enter',
    // Wait for app content rather than recording an empty terminal on slow hosts.
    `Wait+Screen@15s /${options.ready ?? '[╭┌+]'}/`,
    'Sleep 500ms',
    'Show',
    'Screenshot ' + tapeQuote(options.screenshot),
    ...(options.workflow ? [options.workflow] : ['Sleep 100ms']),
    'Hide',
    'Ctrl+C',
    '',
  ].join('\n');
}

export async function main(args = process.argv.slice(2)) {
  const {values} = parseArgs({
    args,
    options: {
      screen: {type: 'string', multiple: true},
      theme: {type: 'string', multiple: true},
      columns: {type: 'string', multiple: true},
      rows: {type: 'string', default: '40'},
      'output-dir': {type: 'string', default: 'screenshots'},
      ascii: {type: 'boolean', default: false},
      video: {type: 'boolean', default: false},
      format: {type: 'string', multiple: true},
      tape: {type: 'string'},
      'dry-run': {type: 'boolean', default: false},
      help: {type: 'boolean', short: 'h'},
    },
  });
  if (values.help) {
    console.log(`Usage: npm run screenshot -- [options]
  --screen <id>       Screen ID or inline (repeat; default: all; video: home)
  --theme <name>      dark | light | contrast | mono (repeat; default: all; video: dark)
  --columns <n>       Terminal width, 40–240 (repeat; default: 80 and 120; video: 100)
  --rows <n>          Terminal height, 20–200 (default: 40)
  --output-dir <dir>  Destination directory (default: screenshots)
  --ascii            Use ASCII glyphs and borders
  --video            Record keyboard interactions as well as the initial PNG
  --format <format>  gif | mp4 | webm (repeat; video only; default: gif and mp4)
  --tape <file>       Interaction tape (video only; default: scripts/tapes/workflow.tape)
  --dry-run          Write replayable tapes and ANSI fixtures without running VHS
  -h, --help         Show this help

Requires VHS 0.12.1+, ttyd, FFmpeg and Chromium. See docs/recording.md.`);
    return;
  }
  if (!values.video && (values.format || values.tape))
    throw new Error('--format and --tape require --video');
  const selectedFormats = [...new Set(values.format ?? ['gif', 'mp4'])];
  if (selectedFormats.some((format) => !formats.includes(format)))
    throw new Error('Unknown format. Choose: ' + formats.join(', '));

  delete process.env.NO_COLOR;
  process.env.FORCE_COLOR = '3';
  process.env.CI = '1';
  process.env.XDG_CONFIG_HOME = path.join(tmpdir(), `${pkg.name}-screenshots`);
  const [{renderToString}, {App}, {screenIds}, {themeNames}] = await Promise.all([
    import('ink'),
    import('../src/app'),
    import('../src/screens'),
    import('../src/theme/tokens'),
  ]);
  const availableScreens = screenIds;
  const selectedScreens = [
    ...new Set(values.screen ?? (values.video ? ['home'] : availableScreens)),
  ];
  const selectedThemes = [...new Set(values.theme ?? (values.video ? ['dark'] : themeNames))];
  const widths = [...new Set(values.columns ?? (values.video ? ['100'] : ['80', '120']))];
  for (const screen of selectedScreens) {
    if (!availableScreens.includes(screen))
      throw new Error(`Unknown screen "${screen}". Choose: ${availableScreens.join(', ')}`);
  }
  for (const theme of selectedThemes) {
    if (!themeNames.some((name) => name === theme))
      throw new Error(`Unknown theme "${theme}". Choose: ${themeNames.join(', ')}`);
  }
  for (const width of widths) {
    if (!/^\d+$/.test(width) || Number(width) < 40 || Number(width) > 240)
      throw new Error('--columns must be an integer between 40 and 240');
  }
  if (!/^\d+$/.test(values.rows) || Number(values.rows) < 20 || Number(values.rows) > 200)
    throw new Error('--rows must be an integer between 20 and 200');
  const workflow = values.video
    ? await readFile(
        path.resolve(values.tape ?? path.join(root, 'scripts/tapes/workflow.tape')),
        'utf8',
      )
    : undefined;
  const outputDir = path.resolve(values['output-dir']);
  const tapeDir = path.join(outputDir, 'tapes');
  await mkdir(tapeDir, {recursive: true});
  const configDir = await mkdtemp(path.join(tmpdir(), 'ink-capture-'));
  try {
    for (const screen of selectedScreens)
      for (const theme of selectedThemes)
        for (const width of widths) {
          const columns = Number(width);
          const rows = Number(values.rows);
          const name = `${screen}-${theme}-${columns}${values.ascii ? '-ascii' : ''}${values.video ? '-video' : ''}`;
          const screenshot = path.join(outputDir, name + '.png');
          const outputs = values.video
            ? selectedFormats.map((format) => path.join(outputDir, name + '.' + format))
            : [];
          let command: string;
          if (values.video) {
            // Ink treats CI as noninteractive even in a PTY. Explicit flags and an
            // isolated config prevent the recording from reading/writing user settings.
            command =
              `stty cols ${columns} rows ${rows}; printf '\\033[2J\\033[H'; exec env -u CI -u NO_COLOR -u CLI_ASCII FORCE_COLOR=3 TERM=xterm-256color ` +
              [
                process.execPath,
                '--import',
                'tsx',
                'src/cli.tsx',
                '--screen',
                screen,
                '--theme',
                theme,
                '--config',
                path.join(configDir, 'config.json'),
                ...(values.ascii ? ['--ascii'] : []),
              ]
                .map(shellQuote)
                .join(' ');
          } else {
            Object.defineProperty(process.stdout, 'columns', {value: columns, configurable: true});
            Object.defineProperty(process.stdout, 'rows', {value: rows, configurable: true});
            const options = {
              theme: theme as (typeof themeNames)[number],
              ascii: values.ascii,
              debug: false,
              screen,
            };
            const ansi = renderToString(
              <App options={options} />,
              {columns},
            );
            if (!ansi.trim()) throw new Error(`Empty render: ${screen}/${theme}/${columns}`);
            const frame = path.join(tapeDir, name + '.ansi');
            await writeFile(frame, ansi);
            command = "printf '\\033[2J\\033[H\\033[?25l'; cat " + shellQuote(frame);
          }
          const tape = path.join(tapeDir, name + '.tape');
          await writeFile(
            tape,
            captureTape({
              columns,
              rows,
              theme,
              command,
              screenshot,
              outputs,
              workflow,
            }),
          );
          if (values['dry-run']) {
            console.log(tape);
            continue;
          }
          const result = spawnSync('vhs', [tape], {cwd: root, stdio: 'inherit', timeout: 180_000});
          if (result.error)
            throw new Error(
              `Unable to run VHS: ${result.error.message}. Install VHS, ttyd, FFmpeg and Chromium; see docs/recording.md.`,
            );
          if (result.status !== 0)
            throw new Error(
              `VHS failed for ${name} (exit ${result.status}, signal ${result.signal ?? 'none'})`,
            );
          for (const file of [screenshot, ...outputs]) {
            if (!(await stat(file)).size) throw new Error('Empty capture: ' + file);
            console.log(file);
          }
        }
  } finally {
    await rm(configDir, {recursive: true, force: true});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

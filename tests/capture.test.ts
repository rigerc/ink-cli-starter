import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {captureTape, shellQuote, tapeQuote} from '../scripts/screenshot';
import {screenIds} from '../src/screens';

const run = (...args: string[]) =>
  spawnSync(process.execPath, ['--import', 'tsx', 'scripts/screenshot.tsx', ...args], {
    encoding: 'utf8',
  });

describe('VHS capture workflow', () => {
  it('quotes shell paths literally and respects VHS delimiters', () => {
    const value = `a space ' $(touch nope) "quoted"`;
    const result = spawnSync('bash', ['-c', 'printf %s ' + shellQuote(value)], {encoding: 'utf8'});
    expect(result.stdout).toBe(value);
    expect(tapeQuote('two words')).toBe('"two words"');
    expect(tapeQuote('a "quote"')).toBe(`'a "quote"'`);
    expect(() => tapeQuote('bad\nType evil')).toThrow();
    expect(() => tapeQuote('"\'`')).toThrow();
  });

  it('sets exact cell dimensions and waits for rendered output before capturing', () => {
    const tape = captureTape({
      columns: 80,
      rows: 60,
      theme: 'light',
      command: 'node demo',
      screenshot: 'out.png',
      outputs: ['out.gif', 'out.webm'],
      workflow: 'Ctrl+K\nSleep 1s',
    });

    expect(tape).toContain('Set Columns 80\nSet Rows 60');
    expect(tape).toContain('Set Theme "Github"');
    expect(tape.indexOf('Wait+Screen')).toBeLessThan(tape.indexOf('Screenshot'));
    expect(tape).toContain('Output "out.webm"');
    expect(tape.indexOf('Screenshot')).toBeLessThan(tape.indexOf('Ctrl+K'));
  });

  it('generates static fixtures and video tapes without needing VHS', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'capture test '));

    try {
      const common = [
        '--screen',
        'home',
        '--theme',
        'mono',
        '--columns',
        '80',
        '--ascii',
        '--dry-run',
        '--output-dir',
        dir,
      ];

      const image = run(...common);
      expect(image.status, image.stderr).toBe(0);
      expect(readFileSync(path.join(dir, 'tapes/home-mono-80-ascii.ansi'), 'utf8')).toContain(
        'Home',
      );
      const recording = run(...common, '--video', '--format', 'webm');
      expect(recording.status, recording.stderr).toBe(0);
      const tape = readFileSync(path.join(dir, 'tapes/home-mono-80-ascii-video.tape'), 'utf8');
      expect(tape).toContain('Ctrl+K');
      expect(tape).toContain('env -u CI -u NO_COLOR -u CLI_ASCII');
      expect(tape).toContain("'--config'");
      expect(tape).toContain('.webm"');
      expect(tape).not.toContain('.gif"');
      const customTape = path.join(dir, 'custom.tape');
      writeFileSync(customTape, 'Type "?"\nWait+Screen@10s /Help/\n');
      const custom = run(...common, '--video', '--tape', customTape, '--format', 'mp4');
      expect(custom.status, custom.stderr).toBe(0);

      const customOutput = readFileSync(
        path.join(dir, 'tapes/home-mono-80-ascii-video.tape'),
        'utf8',
      );

      expect(customOutput).toContain('Wait+Screen@10s /Help/');
      expect(customOutput).not.toContain('Ctrl+K');
      expect(readdirSync(dir)).toContain('tapes');
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('covers every registered screen by default', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'capture all screens '));

    try {
      const result = run('--dry-run', '--theme', 'dark', '--columns', '100', '--output-dir', dir);
      expect(result.status, result.stderr).toBe(0);
      const expected = screenIds.map((id) => `${id}-dark-100.tape`).sort();

      const actual = readdirSync(path.join(dir, 'tapes'))
        .filter((file) => file.endsWith('.tape'))
        .sort();

      expect(actual).toEqual(expected);
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('rejects invalid capture choices before generating artifacts', () => {
    for (const args of [
      ['--columns', '39'],
      ['--rows', '201'],
      ['--screen', '../nope'],
      ['--theme', 'missing'],
      ['--format', 'gif'],
      ['--video', '--format', 'png'],
    ]) {
      const result = run('--dry-run', ...args);
      expect(result.status).not.toBe(0);
    }
  });
});

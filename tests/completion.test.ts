import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {createProgram} from '../src/lib/program';
import {generateCompletion} from '../src/lib/completion';

const program = () => createProgram(new AbortController().signal);
for (const shell of ['bash', 'zsh', 'fish'] as const) {
  const available = process.platform !== 'win32' && spawnSync(shell, ['--version']).status === 0;
  describe(`${shell} completions`, () => {
    it('includes nested commands, inherited flags, and choices', () => {
      const script = generateCompletion(program(), shell);
      expect(script).toContain('doctor');
      expect(script).toContain('config');
      expect(script).toContain('reset');
      expect(script).toContain('label');
      expect(script).toContain('status');
    });
    it.skipIf(!available)('passes the shell syntax checker', () => {
      const directory = mkdtempSync(join(tmpdir(), 'ink-syntax-'));
      try {
        const path = join(directory, `completion.${shell}`);
        writeFileSync(path, generateCompletion(program(), shell));
        const result = spawnSync(shell, ['-n', path], {encoding: 'utf8'});
        expect(result.status, result.stderr).toBe(0);
      } finally {
        rmSync(directory, {recursive: true, force: true});
      }
    });
  });
}

it.skipIf(process.platform === 'win32')('completes nested Bash commands and option values', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ink-completion-'));
  try {
    const path = join(directory, 'completion.bash');
    writeFileSync(path, generateCompletion(program(), 'bash'));
    const result = spawnSync(
      'bash',
      [
        '-c',
        'source "$1"; COMP_WORDS=(ink-kit config ""); COMP_CWORD=2; _ink_kit_completion; printf "%s\\n" "${COMPREPLY[@]}"; COMP_WORDS=(ink-kit example --status r); COMP_CWORD=3; _ink_kit_completion; printf "%s\\n" "${COMPREPLY[@]}"',
        'bash',
        path,
      ],
      {encoding: 'utf8'},
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('reset');
    expect(result.stdout).toContain('ready');
    expect(result.stdout).toContain('running');
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

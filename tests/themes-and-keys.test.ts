import {describe, expect, it, vi} from 'vite-plus/test';
import {getGlobalBindings, getGlobalKeys} from '../src/keys';
import {listIndex, listSize, listWindow} from '../src/lib/list';
import {resolveThemeName} from '../src/theme/resolve';
import {applyGlyphs, themes} from '../src/theme/themes';

describe('terminal fallback and global key registry', () => {
  it('prioritizes NO_COLOR over flags, env, and saved config', () => {
    expect(resolveThemeName({flag: 'light', env: 'dark', config: 'contrast', noColor: true})).toBe(
      'mono',
    );
    expect(resolveThemeName({flag: 'light', env: 'dark', config: 'contrast', noColor: false})).toBe(
      'light',
    );
    expect(resolveThemeName({env: 'dark', config: 'contrast', noColor: false})).toBe('dark');
    expect(resolveThemeName({config: 'contrast', noColor: false})).toBe('contrast');
  });

  it('switches glyphs and borders without mutating the palette', () => {
    const ascii = applyGlyphs(themes.dark, true);
    expect(ascii.symbols.pointer).toBe('>');
    expect(ascii.border.base).toBe('classic');
    expect(themes.dark.symbols.pointer).not.toBe('>');
    expect(applyGlyphs(themes.mono, false)).toBe(themes.mono);
    expect(Object.values(themes.mono.color).every((color) => color === undefined)).toBe(true);
  });

  it('generates shortcuts only for visible screens and omits unavailable help', () => {
    expect(getGlobalKeys(2).find((hint) => hint.label === 'jump to screen')?.key).toBe('1-2');
    expect(getGlobalKeys(15).find((hint) => hint.label === 'jump to screen')?.key).toBe('1-9');
    expect(getGlobalKeys(0).some((hint) => hint.label === 'jump to screen')).toBe(false);
    expect(getGlobalKeys(2, {help: false}).some((hint) => hint.key === '?')).toBe(false);

    const called = vi.fn();
    const handlers = {
      next: called,
      previous: called,
      commands: called,
      theme: called,
      help: called,
      quit: called,
    };
    const jumps = vi.fn();
    const bindings = getGlobalBindings(3, handlers, jumps, {help: false});
    expect(bindings.filter((binding) => /^\d$/.test(binding.key))).toHaveLength(3);
    expect(bindings.some((binding) => binding.key === '?')).toBe(false);
    bindings.find((binding) => binding.key === '3')?.run();
    expect(jumps).toHaveBeenCalledWith(2);
  });

  it('clamps list sizes, indices, and visible windows', () => {
    expect(listSize(0, 6)).toBe(1);
    expect(listSize(Number.NaN, 6)).toBe(6);
    expect(listIndex(100, 3)).toBe(2);
    expect(listIndex(-5, 3)).toBe(0);
    expect(listWindow(8, 10, 3)).toEqual({start: 6, end: 9});
  });
});

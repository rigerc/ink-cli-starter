import {renderToString} from 'ink';
import stringWidth from 'string-width';
import {describe, expect, it} from 'vite-plus/test';
import {AppProviders} from '../src/app';
import {isScreenId, screenIds, screens} from '../src/screens';
import {themeNames} from '../src/theme/tokens';

const render = (
  id: string,
  theme: (typeof themeNames)[number],
  columns: number,
  ascii: boolean,
) => {
  const {Component} = screens.find((s) => s.id === id)!;

  return renderToString(
    <AppProviders options={{theme, ascii, debug: false, screen: id}}>
      <Component />
    </AppProviders>,
    {columns},
  );
};

describe('every screen × theme × width', () => {
  it('includes the built-in screens', () => {
    expect(screenIds).toEqual(expect.arrayContaining(['home', 'settings', 'help']));
    expect(isScreenId('unknown-screen')).toBe(false);
  });

  it('keeps registered screens within terminal widths', () => {
    for (const {id} of screens) {
      for (const columns of [60, 120]) {
        const out = render(id, 'mono', columns, true);
        expect(out).not.toBe('');

        for (const line of out.split('\n')) {
          expect(stringWidth(line)).toBeLessThanOrEqual(columns);
        }
      }
    }
  });

  it('renders every theme', () => {
    for (const theme of themeNames) {
      expect(render('home', theme, 80, false)).toContain('Home');
    }
  });

  it('ascii mode uses no unicode symbols', () => {
    const out = render('home', 'mono', 80, true);
    expect(out).not.toMatch(/[✔✖⚠ℹ❯█░─╭╮╰╯│]/);
  });

  it('mono output contains no color escape codes', () => {
    const out = render('home', 'mono', 80, false);
    // eslint-disable-next-line no-control-regex
    expect(out).not.toMatch(/\u001B\[(3|4|9)\d/);
  });
});

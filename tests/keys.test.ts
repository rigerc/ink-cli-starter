import {describe, expect, it} from 'vite-plus/test';
import {getGlobalBindings, getGlobalKeys, type GlobalHandlers} from '../src/keys';

describe('global navigation shortcuts', () => {
  it('advertises only numeric shortcuts that work', () => {
    expect(getGlobalKeys(12).find((hint) => hint.label === 'jump to screen')?.key).toBe('1-9');
    expect(getGlobalKeys(3).find((hint) => hint.label === 'jump to screen')?.key).toBe('1-3');
    expect(getGlobalKeys(0).some((hint) => hint.label === 'jump to screen')).toBe(false);
  });

  it('omits help when an app does not register a help screen', () => {
    expect(getGlobalKeys(1, {help: false}).some((hint) => hint.key === '?')).toBe(false);
    const noop = () => {};
    const handlers: GlobalHandlers = {
      next: noop,
      previous: noop,
      commands: noop,
      theme: noop,
      help: noop,
      quit: noop,
    };
    expect(
      getGlobalBindings(1, handlers, noop, {help: false}).some((binding) => binding.key === '?'),
    ).toBe(false);
  });

  it('binds at most nine jump shortcuts with more visible screens', () => {
    const visited: number[] = [];
    const noop = () => {};
    const handlers: GlobalHandlers = {
      next: noop,
      previous: noop,
      commands: noop,
      theme: noop,
      help: noop,
      quit: noop,
    };
    const bindings = getGlobalBindings(12, handlers, (index) => visited.push(index));

    for (let digit = 1; digit <= 9; digit++) {
      bindings.find((binding) => binding.key === String(digit))?.run();
    }

    expect(visited).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(bindings.some((binding) => binding.key === '10')).toBe(false);
  });
});

import {useInput, type Key} from 'ink';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';
import {useHasInputCapture} from './useInputCapture';

export interface Binding {
  /** "q", "tab", "shift+tab", "ctrl+r", "enter", "esc", "up", "down", "space"… */
  key: string;
  run: () => void;
}

/** Return false to let the next eligible input listener handle the event. */
export type InputHandler = (input: string, key: Key) => boolean | void;

export type KeymapScope = 'global' | 'screen' | 'control';

export interface KeymapOptions {
  isActive?: boolean;
  /** When bindings overlap, controls win over screens, then global shortcuts. */
  scope?: KeymapScope;
  /** Only for controls explicitly owned by a capturing editor. */
  allowWhenCaptured?: boolean;
}

function matches(spec: string, input: string, key: Key): boolean {
  const parts = spec.split('+');
  const name = parts.pop()!;
  const mods = new Set(parts.map((p) => p.toLowerCase()));

  const named = {
    tab: key.tab,
    esc: key.escape,
    escape: key.escape,
    enter: key.return,
    return: key.return,
    up: key.upArrow,
    down: key.downArrow,
    home: key.home,
    end: key.end,
    pageup: key.pageUp,
    pagedown: key.pageDown,
    left: key.leftArrow,
    right: key.rightArrow,
    backspace: key.backspace,
    delete: key.delete,
    space: input === ' ',
  };

  const lower = name.toLowerCase();

  const match = Object.entries(named).find(([keyName]) => keyName === lower);

  if (match) {
    if (lower === 'tab' && mods.has('shift') !== key.shift) return false;

    return mods.has('ctrl') === key.ctrl && match[1];
  }

  return mods.has('ctrl') === key.ctrl && !key.meta && input === name;
}

interface Listener {
  id: number;
  getBindings: () => Binding[];
  getOptions: () => KeymapOptions;
  getInputHandler?: () => InputHandler;
}

type Register = (listener: Omit<Listener, 'id'>) => () => void;

const KeymapContext = createContext<Register | null>(null);
const priority: Record<KeymapScope, number> = {global: 0, screen: 1, control: 2};

/**
 * Dispatch registered keymaps once per keypress, with explicit scope priority.
 * Captured text input suspends shortcuts except controls explicitly owned by
 * the capturing editor.
 * Standalone components can still use useKeymap without this provider.
 */
export function KeymapProvider({children}: {children: ReactNode}) {
  const listeners = useRef(new Map<number, Listener>());
  const nextId = useRef(0);
  const captured = useHasInputCapture();

  const register = useCallback<Register>((listener) => {
    const id = ++nextId.current;
    listeners.current.set(id, {...listener, id});

    return () => {
      listeners.current.delete(id);
    };
  }, []);

  useInput((input, key) => {
    const ordered = [...listeners.current.values()].sort((a, b) => {
      const scopeA = priority[a.getOptions().scope ?? 'control'];
      const scopeB = priority[b.getOptions().scope ?? 'control'];

      return scopeB - scopeA || b.id - a.id;
    });

    for (const listener of ordered) {
      if (listener.getOptions().isActive === false) continue;

      if (captured && !listener.getOptions().allowWhenCaptured) continue;

      for (const binding of listener.getBindings()) {
        if (matches(binding.key, input, key)) {
          binding.run();

          return;
        }
      }

      // Raw input from managed controls participates in the same arbitration
      // as named bindings instead of creating competing Ink listeners.
      const onInput = listener.getInputHandler?.();

      if (onInput && onInput(input, key) !== false) return;
    }
  });

  return createElement(KeymapContext.Provider, {value: register}, children);
}

/**
 * Declarative bindings. In KeymapProvider, only the highest-priority matching
 * callback runs. Without it, standalone controls retain their original behavior.
 * In both modes, text input capture pauses non-owner shortcuts.
 */
export function useKeymap(bindings: Binding[], options: KeymapOptions = {}) {
  const register = useContext(KeymapContext);
  const captured = useHasInputCapture();
  const latest = useRef({bindings, options});
  latest.current = {bindings, options};

  useLayoutEffect(() => {
    if (!register) return;

    return register({
      getBindings: () => latest.current.bindings,
      getOptions: () => latest.current.options,
    });
  }, [register]);

  useInput(
    (input, key) => {
      if (register || (captured && !options.allowWhenCaptured) || options.isActive === false)
        return;

      for (const binding of bindings) {
        if (matches(binding.key, input, key)) {
          binding.run();

          return;
        }
      }
    },
    {
      isActive:
        !register &&
        (!captured || options.allowWhenCaptured === true) &&
        (options.isActive ?? true),
    },
  );
}

/**
 * Managed raw input for text editors and composite controls. Shares the
 * KeymapProvider dispatcher with useKeymap; standalone controls retain
 * Ink's native useInput behavior when no provider is installed.
 */
export function useManagedInput(handler: InputHandler, options: KeymapOptions = {}) {
  const register = useContext(KeymapContext);
  const captured = useHasInputCapture();
  const latest = useRef({handler, options});
  latest.current = {handler, options};

  useLayoutEffect(() => {
    if (!register) return;

    return register({
      getBindings: () => [],
      getOptions: () => latest.current.options,
      getInputHandler: () => latest.current.handler,
    });
  }, [register]);

  useInput(
    (input, key) => {
      if (register || (captured && !options.allowWhenCaptured) || options.isActive === false)
        return;

      handler(input, key);
    },
    {
      isActive:
        !register &&
        (!captured || options.allowWhenCaptured === true) &&
        (options.isActive ?? true),
    },
  );
}

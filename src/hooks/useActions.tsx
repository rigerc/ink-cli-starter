import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {KeyHint} from '../keys';
import {useKeymap, type KeymapScope} from './useKeymap';

export interface UIAction {
  id: string;
  label: string;
  key: string;
  run: () => void;
  scope?: KeymapScope;
  enabled?: boolean;
  /** Display a shortcut hint in the shared footer when active. */
  showInFooter?: boolean;
}

type RegisterAction = (get: () => UIAction) => () => void;

const RegisterContext = createContext<RegisterAction | null>(null);
const ActionsContext = createContext<readonly UIAction[]>([]);

/** Action metadata and keyboard bindings share one source of truth. */
export function ActionProvider({children}: {children: ReactNode}) {
  const listeners = useRef(new Map<number, () => UIAction>());
  const nextId = useRef(0);
  const [, notify] = useState(0);

  const register = useCallback<RegisterAction>((get) => {
    const id = ++nextId.current;
    listeners.current.set(id, get);
    notify((revision) => revision + 1);

    return () => {
      listeners.current.delete(id);
      notify((revision) => revision + 1);
    };
  }, []);

  const actions = [...listeners.current.values()].map((get) => get());

  return (
    <RegisterContext.Provider value={register}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </RegisterContext.Provider>
  );
}

/**
 * Register one contextual action and its shortcut. Works without ActionProvider,
 * in which case the shortcut remains usable but no footer metadata is collected.
 */
export function useAction(action: UIAction): KeyHint {
  const register = useContext(RegisterContext);
  const latest = useRef(action);
  latest.current = action;

  useKeymap([{key: action.key, run: action.run}], {
    scope: action.scope ?? 'screen',
    isActive: action.enabled,
  });

  useLayoutEffect(() => {
    if (!register) return;

    return register(() => latest.current);
  }, [
    register,
    action.id,
    action.label,
    action.key,
    action.enabled,
    action.scope,
    action.showInFooter,
  ]);

  return {key: action.key, label: action.label};
}

/** Contextual hints are derived from registered active actions, not duplicated strings. */
export function useActionHints(): KeyHint[] {
  const actions = useContext(ActionsContext);

  return actions
    .filter(
      (action) =>
        action.enabled !== false &&
        action.showInFooter !== false &&
        (action.scope ?? 'screen') === 'screen',
    )
    .map(({key, label}) => ({key, label}));
}

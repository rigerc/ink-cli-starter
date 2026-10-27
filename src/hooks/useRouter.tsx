import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type RouteMap = Record<string, object | undefined>;
type RouteArgs<R extends RouteMap, K extends keyof R & string> = undefined extends R[K]
  ? [id: K, params?: R[K]]
  : [id: K, params: R[K]];
interface Entry {
  id: string;
  params?: object;
}
/** Returning false defers the transition; resume performs that transition once. */
export type LeaveGuard = (resume: () => void) => boolean;
interface RouterState {
  current: string;
  params?: object;
  push: (id: string, params?: object) => void;
  replace: (id: string, params?: object) => void;
  pop: () => void;
  canGoBack: boolean;
  requestLeave: (action: () => void) => void;
  setGuard: (guard: LeaveGuard) => () => void;
}
const RouterContext = createContext<RouterState | null>(null);

/** History entries carry params. One active screen owns the optional leave guard. */
export function RouterProvider({initial, children}: {initial: string; children: ReactNode}) {
  const [stack, setStack] = useState<Entry[]>([{id: initial}]);
  const guard = useRef<LeaveGuard | undefined>(undefined);
  const requestLeave = useCallback((action: () => void) => {
    let resumed = false;
    const resume = () => {
      if (resumed) return;
      resumed = true;
      action();
    };
    if (!guard.current || guard.current(resume)) resume();
  }, []);
  const setGuard = useCallback((handler: LeaveGuard) => {
    guard.current = handler;
    return () => {
      if (guard.current === handler) guard.current = undefined;
    };
  }, []);
  const push = useCallback(
    (id: string, params?: object) => requestLeave(() => setStack((s) => [...s, {id, params}])),
    [requestLeave],
  );
  const replace = useCallback(
    (id: string, params?: object) =>
      requestLeave(() => setStack((s) => [...s.slice(0, -1), {id, params}])),
    [requestLeave],
  );
  const pop = useCallback(
    () => requestLeave(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))),
    [requestLeave],
  );
  const entry = stack.at(-1)!;
  const value = useMemo(
    () => ({
      current: entry.id,
      params: entry.params,
      push,
      replace,
      pop,
      canGoBack: stack.length > 1,
      requestLeave,
      setGuard,
    }),
    [entry, stack.length, push, replace, pop, requestLeave, setGuard],
  );
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter<R extends RouteMap = Record<string, object | undefined>>() {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useRouter must be used inside <RouterProvider>');
  const {current, params, push, replace} = router;
  // The typed wrappers are memoized so consumers can use them directly in effect
  // dependencies; navigation still re-creates the returned object itself.
  const typedPush = useMemo(
    () =>
      <K extends keyof R & string>(...args: RouteArgs<R, K>) =>
        push(args[0], args[1]),
    [push],
  );
  const typedReplace = useMemo(
    () =>
      <K extends keyof R & string>(...args: RouteArgs<R, K>) =>
        replace(args[0], args[1]),
    [replace],
  );
  const paramsFor = useMemo(
    () =>
      <K extends keyof R & string>(id: K): R[K] | undefined => {
        // SAFETY: navigation methods constrain params to the application's declared route map.
        return current === id ? (params as R[K]) : undefined;
      },
    [current, params],
  );
  return useMemo(
    () => ({...router, push: typedPush, replace: typedReplace, paramsFor}),
    [router, typedPush, typedReplace, paramsFor],
  );
}

export function useLeaveGuard(guard: LeaveGuard, enabled = true) {
  const {setGuard} = useRouter();
  const latest = useRef(guard);
  latest.current = guard;
  useEffect(() => {
    if (!enabled) return;
    return setGuard((resume) => latest.current(resume));
  }, [enabled, setGuard]);
}

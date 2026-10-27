import {useCallback, useEffect, useRef, useState} from 'react';
import {toAppError, type AppError} from '../lib/errors';

type State<T> =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'success'; data: T}
  | {status: 'error'; error: AppError};

/** Cancellable work, latest-result ownership, and explicit retry of the last arguments. */
export function useAsync<T, A extends unknown[]>(
  fn: (signal: AbortSignal, ...args: A) => Promise<T>,
) {
  const [state, setState] = useState<State<T>>({status: 'idle'});
  const alive = useRef(true);
  const controller = useRef<AbortController | undefined>(undefined);
  const lastArgs = useRef<A | undefined>(undefined);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = undefined;
    if (alive.current) setState({status: 'idle'});
  }, []);
  const run = useCallback(async (...args: A): Promise<T | undefined> => {
    controller.current?.abort();
    if (!alive.current) return undefined;
    const request = new AbortController();
    controller.current = request;
    lastArgs.current = args;
    const current = () =>
      alive.current && controller.current === request && !request.signal.aborted;
    setState({status: 'loading'});
    try {
      const data = await fnRef.current(request.signal, ...args);
      if (!current()) return undefined;
      setState({status: 'success', data});
      return data;
    } catch (error) {
      if (current()) setState({status: 'error', error: toAppError(error)});
      return undefined;
    }
  }, []);
  const refetch = useCallback(
    () => (lastArgs.current ? run(...lastArgs.current) : Promise.resolve(undefined)),
    [run],
  );
  return {...state, run, cancel, refetch};
}

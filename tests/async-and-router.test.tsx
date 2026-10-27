import {Text} from 'ink';
import {useState} from 'react';
import {describe, expect, it} from 'vite-plus/test';
import {useAsync} from '../src/hooks/useAsync';
import {RouterProvider, useRouter, useLeaveGuard} from '../src/hooks/useRouter';
import {InputCaptureProvider, KeymapProvider, useKeymap} from '../src/hooks';
import {flushFrame, mount, sendKey} from './helpers/ink';

interface Request {
  signal: AbortSignal;
  arg: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}
describe('cancellable async requests', () => {
  it('aborts superseded requests, ignores stale completion, refetches, and aborts on unmount', async () => {
    const requests: Request[] = [];
    let api: ReturnType<typeof useAsync<string, [string]>> | undefined;
    function Probe() {
      api = useAsync(
        (signal: AbortSignal, arg: string) =>
          new Promise<string>((resolve, reject) => requests.push({signal, arg, resolve, reject})),
      );
      return <Text>{api.status === 'success' ? api.data : api.status}</Text>;
    }
    const app = await mount(<Probe />);
    const first = api!.run('first');
    const second = api!.run('second');
    expect(requests[0]!.signal.aborted).toBe(true);
    requests[1]!.resolve('newest');
    expect(await second).toBe('newest');
    requests[0]!.resolve('stale');
    expect(await first).toBeUndefined();
    await flushFrame();
    expect(app.lastFrame()).toBe('newest');
    const retry = api!.refetch();
    expect(requests[2]!.arg).toBe('second');
    requests[2]!.reject(new Error('failure'));
    await retry;
    await flushFrame();
    expect(app.lastFrame()).toBe('error');
    const pending = api!.refetch();
    app.unmount();
    expect(requests[3]!.signal.aborted).toBe(true);
    requests[3]!.resolve('after unmount');
    expect(await pending).toBeUndefined();
  });

  it('cancels without exposing cancellation as an error', async () => {
    let api: ReturnType<typeof useAsync<string, []>> | undefined;
    let resolve: (value: string) => void = () => {};
    function Probe() {
      api = useAsync(
        () =>
          new Promise<string>((done) => {
            resolve = done;
          }),
      );
      return <Text>{api.status}</Text>;
    }
    const app = await mount(<Probe />);
    expect(await api!.refetch()).toBeUndefined();
    const pending = api!.run();
    api!.cancel();
    resolve('ignored');
    await pending;
    await flushFrame();
    expect(app.lastFrame()).toBe('idle');
  });
});

describe('route params and leave guards', () => {
  it('defers push, replace, back, and quit until explicitly resumed', async () => {
    type Routes = {list: undefined; detail: {id: string}};
    let router: ReturnType<typeof useRouter<Routes>> | undefined;
    let resume: (() => void) | undefined;
    let quit = false;
    function Probe() {
      router = useRouter<Routes>();
      const [dirty, setDirty] = useState(true);
      useLeaveGuard((next) => {
        resume = next;
        return false;
      }, dirty);
      useKeymap([{key: 'd', run: () => setDirty(false)}]);
      return (
        <Text>
          {router.current}:{router.paramsFor('detail')?.id ?? 'none'}
        </Text>
      );
    }
    const app = await mount(
      <RouterProvider initial="list">
        <InputCaptureProvider>
          <KeymapProvider>
            <Probe />
          </KeymapProvider>
        </InputCaptureProvider>
      </RouterProvider>,
    );
    router!.push('detail', {id: '42'});
    expect(router!.current).toBe('list');
    resume!();
    resume!();
    await flushFrame();
    expect(app.lastFrame()).toBe('detail:42');
    router!.pop();
    await flushFrame();
    expect(router!.current).toBe('detail');
    resume!();
    await flushFrame();
    expect(app.lastFrame()).toBe('list:none');
    router!.replace('detail', {id: 'replacement'});
    resume!();
    await flushFrame();
    expect(app.lastFrame()).toBe('detail:replacement');
    router!.requestLeave(() => {
      quit = true;
    });
    expect(quit).toBe(false);
    resume!();
    expect(quit).toBe(true);
    await sendKey(app, 'd');
    router!.replace('list');
    await flushFrame();
    expect(app.lastFrame()).toBe('list:none');
  });
});

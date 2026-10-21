import {Text} from 'ink';
import {useState} from 'react';
import {describe, expect, it, vi} from 'vite-plus/test';
import {SearchSelect} from '../src/components';
import {InputCaptureProvider} from '../src/hooks/useInputCapture';
import {KeymapProvider, useKeymap} from '../src/hooks/useKeymap';
import {mount, press, settle} from './helpers/terminal';

function RoutingFixture({
  calls,
  controlActive = true,
}: {
  calls: string[];
  controlActive?: boolean;
}) {
  useKeymap([{key: 'x', run: () => calls.push('global')}], {scope: 'global'});
  useKeymap([{key: 'x', run: () => calls.push('screen')}], {scope: 'screen'});
  useKeymap([{key: 'x', run: () => calls.push('control')}], {
    scope: 'control',
    isActive: controlActive,
  });
  return <Text>Router active</Text>;
}

function CaptureFixture({onShortcut}: {onShortcut: () => void}) {
  const [searching, setSearching] = useState(false);
  useKeymap([{key: '/', run: () => setSearching(true)}], {scope: 'screen'});
  useKeymap([{key: 'q', run: onShortcut}], {scope: 'global'});
  useKeymap([{key: 't', run: onShortcut}], {scope: 'control'});
  return (
    <SearchSelect
      items={[{value: 'one', label: 'One'}]}
      isActive={searching}
      onSelect={() => setSearching(false)}
      onCancel={() => setSearching(false)}
    />
  );
}

const withProviders = (node: React.ReactNode) => (
  <InputCaptureProvider>
    <KeymapProvider>{node}</KeymapProvider>
  </InputCaptureProvider>
);

describe('shared keyboard routing', () => {
  it('dispatches one shortcut to the highest-priority active scope', async () => {
    const calls: string[] = [];
    const app = await mount(withProviders(<RoutingFixture calls={calls} />));
    await press(app, 'x');
    expect(calls).toEqual(['control']);

    app.rerender(withProviders(<RoutingFixture calls={calls} controlActive={false} />));
    await settle();
    await press(app, 'x');
    expect(calls).toEqual(['control', 'screen']);
  });

  it('pauses every registered shortcut while text input is captured, then restores them', async () => {
    const shortcut = vi.fn();
    const app = await mount(withProviders(<CaptureFixture onShortcut={shortcut} />));
    await press(app, '/');
    expect(app.lastFrame()).toContain('Search:');
    await press(app, 'q');
    await press(app, 't');
    expect(app.lastFrame()).toContain('Search: qt');
    expect(shortcut).not.toHaveBeenCalled();
    await press(app, '\u001b');
    await settle();
    await press(app, 't');
    expect(shortcut).toHaveBeenCalledOnce();
    await press(app, 'q');
    expect(shortcut).toHaveBeenCalledTimes(2);
  });

  it('preserves keymaps for standalone controls without a router provider', async () => {
    const calls: string[] = [];
    const app = await mount(<RoutingFixture calls={calls} />);
    await press(app, 'x');
    // Standalone mode preserves the preexisting direct-listener behavior.
    expect(calls).toEqual(['global', 'screen', 'control']);
  });
});

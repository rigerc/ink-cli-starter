import {Text} from 'ink';
import {useState} from 'react';
import {describe, expect, it, vi} from 'vite-plus/test';
import {SearchSelect, Select, Step, Stepper} from '../src/components';
import {InputCaptureProvider} from '../src/hooks/useInputCapture';
import {KeymapProvider, useKeymap, useManagedInput} from '../src/hooks/useKeymap';
import {ThemeProvider} from '../src/theme/context';
import {mount, sendKey} from './helpers/ink';

function Providers({children}: {children: React.ReactNode}) {
  return (
    <ThemeProvider name="mono" ascii>
      <InputCaptureProvider>
        <KeymapProvider>{children}</KeymapProvider>
      </InputCaptureProvider>
    </ThemeProvider>
  );
}

function Priority({called, control}: {called: string[]; control: boolean}) {
  useKeymap([{key: 'x', run: () => called.push('global')}], {scope: 'global'});
  useKeymap([{key: 'x', run: () => called.push('screen')}], {scope: 'screen'});
  useKeymap([{key: 'x', run: () => called.push('control')}], {
    scope: 'control',
    isActive: control,
  });
  return <Text>Ready</Text>;
}

describe('keyboard arbitration', () => {
  it('dispatches one matching binding to the highest-priority active scope', async () => {
    const called: string[] = [];
    const instance = await mount(
      <Providers>
        <Priority called={called} control />
      </Providers>,
    );
    await sendKey(instance, 'x');
    expect(called).toEqual(['control']);
    instance.rerender(
      <Providers>
        <Priority called={called} control={false} />
      </Providers>,
    );
    await sendKey(instance, 'x');
    expect(called).toEqual(['control', 'screen']);
  });

  it('lets a managed control consume input before a global shortcut', async () => {
    const called: string[] = [];
    function Control() {
      useKeymap([{key: 'x', run: () => called.push('global')}], {scope: 'global'});
      useManagedInput(
        (input) => {
          if (input !== 'x') return false;
          called.push('control');
          return true;
        },
        {scope: 'control'},
      );
      return <Text>Input</Text>;
    }
    const instance = await mount(
      <Providers>
        <Control />
      </Providers>,
    );
    await sendKey(instance, 'x');
    expect(called).toEqual(['control']);
  });

  it('captures search text instead of triggering global shortcuts', async () => {
    const globalShortcut = vi.fn();
    const selected = vi.fn();
    function Search() {
      const [active, setActive] = useState(true);
      useKeymap([{key: 'q', run: globalShortcut}], {scope: 'global'});
      return (
        <SearchSelect
          items={[
            {value: 'alpha', label: 'Alpha'},
            {value: 'beta', label: 'Beta'},
          ]}
          isActive={active}
          onSelect={(value) => {
            selected(value);
            setActive(false);
          }}
        />
      );
    }
    const instance = await mount(
      <Providers>
        <Search />
      </Providers>,
    );
    await sendKey(instance, 'q');
    expect(instance.lastFrame()).toContain('Search: q');
    expect(globalShortcut).not.toHaveBeenCalled();
    await sendKey(instance, '\u0015');
    await sendKey(instance, 'bet');
    await sendKey(instance, '\r');
    expect(selected).toHaveBeenCalledWith('beta');
  });
});

describe('input components', () => {
  it('selects an item using a keyboard shortcut', async () => {
    const selected = vi.fn();
    const instance = await mount(
      <Providers>
        <Select
          items={[
            {value: 'one', label: 'One'},
            {value: 'two', label: 'Two'},
          ]}
          onSelect={selected}
        />
      </Providers>,
    );
    await sendKey(instance, 'j');
    await sendKey(instance, '\r');
    expect(selected).toHaveBeenCalledWith('two');
  });

  it('advances steps and completes a two-step flow', async () => {
    const complete = vi.fn();
    const instance = await mount(
      <Providers>
        <Stepper onComplete={complete}>
          <Step name="First">
            <Text>First content</Text>
          </Step>
          <Step name="Second">
            <Text>Second content</Text>
          </Step>
        </Stepper>
      </Providers>,
    );
    expect(instance.lastFrame()).toContain('First content');
    await sendKey(instance, '\r');
    expect(instance.lastFrame()).toContain('Second content');
    await sendKey(instance, '\r');
    expect(complete).toHaveBeenCalledOnce();
  });

  it('does not advance when the active step rejects validation', async () => {
    const complete = vi.fn();
    const instance = await mount(
      <Providers>
        <Stepper onComplete={complete}>
          <Step name="Blocked" canProceed={false}>
            <Text>Cannot continue</Text>
          </Step>
          <Step name="Next">
            <Text>Never reached</Text>
          </Step>
        </Stepper>
      </Providers>,
    );
    await sendKey(instance, '\r');
    expect(instance.lastFrame()).toContain('Cannot continue');
    expect(instance.lastFrame()).not.toContain('Never reached');
    expect(complete).not.toHaveBeenCalled();
  });
});

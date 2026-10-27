import {describe, expect, it} from 'vite-plus/test';
import {InputCaptureProvider, KeymapProvider} from '../src/hooks';
import {HelpScreen} from '../src/screens/Help';
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

describe('help topics', () => {
  it('shows global keys first and keeps every topic listed', async () => {
    const app = await mount(
      <Providers>
        <HelpScreen />
      </Providers>,
    );
    const frame = app.lastFrame() ?? '';
    expect(frame).toContain('Global keys');
    expect(frame).toContain('next screen');
    expect(frame).toContain('CLI / output');
  });

  it('switches topics with arrows and j/k, wrapping at both ends', async () => {
    const app = await mount(
      <Providers>
        <HelpScreen />
      </Providers>,
    );
    await sendKey(app, '\u001b[B');
    expect(app.lastFrame()).toContain('Tabs, numeric shortcuts and the command menu');

    await sendKey(app, 'j');
    expect(app.lastFrame()).toContain('Drafts survive tab changes');

    await sendKey(app, 'k');
    await sendKey(app, 'k');
    await sendKey(app, 'k');
    expect(app.lastFrame()).toContain('--theme dark|light|contrast|mono|auto');

    await sendKey(app, '\u001b[B');
    expect(app.lastFrame()).toContain('next screen');
  });
});

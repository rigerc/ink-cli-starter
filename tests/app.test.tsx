import {renderToString} from 'ink';
import {describe, expect, it} from 'vite-plus/test';
import {App, PlainView} from '../src/app';
import {mount, sendKey} from './helpers/ink';

describe('native Ink application', () => {
  it('renders the supplied label and starter message', () => {
    const output = renderToString(<PlainView label="Example" />, {columns: 40});
    expect(output).toContain('Example');
    expect(output).toContain('Edit src/app.tsx');
  });

  it('accepts q to quit', async () => {
    const app = await mount(<App label="Interactive" />);
    expect(app.lastFrame()).toContain('Interactive');
    await sendKey(app, 'q');
  });
});

import {useApp} from 'ink';
import {useEffect, useState} from 'react';
import type {AppOptions} from '../app';
import {Heading, InlineLayout, Muted} from '../components';
import {APP_NAME} from '../lib/config';
import {ThemeProvider} from '../theme/context';
import {SetupWizard} from './SetupWizard';

function DemoContent({interactive}: {interactive: boolean}) {
  const {exit} = useApp();
  const [finished, setFinished] = useState(false);
  // Exit after the final result has committed so it remains visible in scrollback.
  useEffect(() => {
    if (finished && interactive) exit();
  }, [finished, interactive, exit]);
  return (
    <InlineLayout
      title={<Heading>{APP_NAME} / inline setup demo</Heading>}
      footer={
        <Muted>
          {finished
            ? 'Back to your shell.'
            : interactive
              ? 'ctrl+c quit'
              : 'Preview only. Run npm run demo:inline in a terminal to interact.'}
        </Muted>
      }
    >
      <SetupWizard isActive={interactive} onFinish={() => setFinished(true)} />
    </InlineLayout>
  );
}

export function InlineDemo({
  options,
  interactive = false,
}: {
  options: AppOptions;
  interactive?: boolean;
}) {
  return (
    <ThemeProvider name={options.theme} ascii={options.ascii}>
      <DemoContent interactive={interactive} />
    </ThemeProvider>
  );
}

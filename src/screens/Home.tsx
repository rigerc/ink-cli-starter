import {Box, Text} from 'ink';
import {Icon, KeyValue, Panel, ScreenLayout, Stack} from '../components';
import {useTerminalSize} from '../hooks';
import {configPath} from '../lib/config';
import {isInteractive} from '../lib/terminal';
import {useTheme} from '../theme/context';

export function HomeScreen() {
  const t = useTheme();
  const {columns, rows} = useTerminalSize();
  return (
    <ScreenLayout title="Home" description="Overview and terminal diagnostics">
      <Stack gap={1}>
        <Panel title="Welcome" tone="accent">
          <Text>A skeleton for polished terminal apps built on Ink 8.</Text>
          <Box marginTop={1}>
            <KeyValue
              items={[
                {label: 'Theme', value: t.name},
                {label: 'Terminal', value: `${columns}×${rows}`},
                {label: 'Mode', value: isInteractive() ? 'interactive' : 'plain'},
                {label: 'Config', value: configPath()},
              ]}
            />
          </Box>
        </Panel>
        <Panel title="Try this">
          {[
            'Press 2 to watch the task runner (x forces a failure)',
            'Press 3 for the component gallery',
            'Press t to cycle themes, or 4 to save one',
          ].map((line) => (
            <Box key={line} gap={1}>
              <Icon name="pointer" />
              <Text wrap="truncate-end">{line}</Text>
            </Box>
          ))}
        </Panel>
      </Stack>
    </ScreenLayout>
  );
}

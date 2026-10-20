import {Box, Text} from 'ink';
import {Icon, KeyValue, Panel, Stack} from '../components';
import {useTasks} from '../features/tasks/context';
import {useTerminalSize} from '../hooks';
import {configPath} from '../lib/config';
import {isInteractive} from '../lib/terminal';
import {useTheme} from '../theme/context';

export function HomeScreen() {
  const t = useTheme();
  const {columns, rows} = useTerminalSize();
  const stats = useTasks().stats();
  return (
    <Stack gap={1}>
      <Panel title="Dashboard" tone="accent">
        <Text>Local-first CLI application built on Ink 8.</Text>
        <Box marginTop={1}>
          <KeyValue items={[
            {label: 'Total tasks', value: String(stats.total)},
            {label: 'Pending', value: String(stats.pending)},
            {label: 'Completed', value: String(stats.done)},
          ]} />
        </Box>
      </Panel>
      <Panel title="Environment">
        <KeyValue items={[
          {label: 'Theme', value: t.name},
          {label: 'Terminal', value: `${columns}×${rows}`},
          {label: 'Mode', value: isInteractive() ? 'interactive' : 'plain'},
          {label: 'Config', value: configPath()},
        ]} />
      </Panel>
      <Panel title="Get started">
        {[
          'Press 2 to manage persistent tasks',
          'Press 3 to browse the component gallery',
          'Press 4 to configure the application',
        ].map((line) => (
          <Box key={line} gap={1}>
            <Icon name="pointer" />
            <Text wrap="truncate-end">{line}</Text>
          </Box>
        ))}
      </Panel>
    </Stack>
  );
}

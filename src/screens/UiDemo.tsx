import {Box, Text} from 'ink';
import {useState} from 'react';
import {
  Badge,
  Card,
  KeyValue,
  Panel,
  ProgressBar,
  ScreenLayout,
  ScreenState,
  Stack,
  StatusMessage,
  Table,
  type ScreenStatus,
} from '../components';
import {useKeymap, useTerminalSize, useToast} from '../hooks';

const states: readonly ScreenStatus[] = ['success', 'loading', 'empty', 'error'];

/**
 * Interactive showcase of the application's actual shell.
 * Header, tabs, command palette, theme and footer come from src/app.tsx.
 * All data is illustrative; no I/O or background jobs are performed.
 */
export function UiDemoScreen() {
  const {columns} = useTerminalSize();
  const toast = useToast();
  const [status, setStatus] = useState<ScreenStatus>('success');

  useKeymap([
    {
      key: 's',
      run: () => setStatus((current) => states[(states.indexOf(current) + 1) % states.length]!),
    },
    {key: 'r', run: () => setStatus('success')},
    {key: 'm', run: () => toast.push('This is a sample notification.', 'info')},
  ]);

  return (
    <ScreenLayout
      title="UI Demo"
      description="A complete screen using the shared terminal UI"
      actions={<Badge tone="accent" variant="outline">sample data</Badge>}
    >
      <Stack gap={1}>
        <Box flexDirection={columns >= 96 ? 'row' : 'column'} gap={1}>
          <Box flexDirection="column" flexGrow={1} flexBasis={0}>
            <Panel title="Workspace" tone="accent">
              <KeyValue
                items={[
                  {label: 'Project', value: 'ink-kit'},
                  {label: 'Mode', value: 'Local preview'},
                  {label: 'Layout', value: columns >= 96 ? 'Two columns' : 'Stacked'},
                ]}
              />
            </Panel>
          </Box>
          <Box flexDirection="column" flexGrow={1} flexBasis={0}>
            <Panel title="Pipeline">
              <StatusMessage tone="success">Build passed</StatusMessage>
              <StatusMessage tone="info">Review pending</StatusMessage>
              <ProgressBar value={0.75} width={columns < 50 ? 12 : 18} />
            </Panel>
          </Box>
        </Box>

        <Panel title="Result states" footer="s next state · r reset · m message">
          <ScreenState
            status={status}
            title={status === 'success' ? 'All checks complete' : 'Nothing queued'}
            message={
              status === 'loading'
                ? 'Loading sample results...'
                : status === 'empty'
                  ? 'There are no pending checks.'
                  : status === 'error'
                    ? 'Demo failure — nothing was changed.'
                    : undefined
            }
          />
        </Panel>

        <Panel title="Recent activity">
          <Table
            columns={[
              {key: 'event', header: 'Event'},
              {key: 'result', header: 'Result'},
            ]}
            rows={[
              {event: 'Theme tokens', result: {text: 'Ready', tone: 'success'}},
              {event: 'Screen layout', result: {text: 'Ready', tone: 'success'}},
              {event: 'Keyboard menu', result: {text: 'Available', tone: 'info'}},
            ]}
          />
        </Panel>

        <Card tone="info">
          <Text wrap="wrap">Ctrl+K opens the global command menu. Tab changes screens; t cycles themes.</Text>
        </Card>
      </Stack>
    </ScreenLayout>
  );
}

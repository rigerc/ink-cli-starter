import {Box, Text} from 'ink';
import type {Task} from '../../features/tasks/schema';
import {KeyValue} from '../KeyValue';
import {Panel} from '../Panel';

export function TaskDetails({task}: {task: Task}) {
  return (
    <Panel title="Task details" footer="space toggle status  e rename  d delete  esc back">
      <Box flexDirection="column">
        <Text bold wrap="truncate-end">{task.title}</Text>
        <KeyValue items={[
          {label: 'Status', value: task.status},
          {label: 'ID', value: task.id},
          {label: 'Created', value: task.createdAt},
          {label: 'Updated', value: task.updatedAt},
        ]} />
      </Box>
    </Panel>
  );
}

import {Box, Text} from 'ink';
import {useState} from 'react';
import {Confirm, EmptyState, Panel, Stack} from '../components';
import {TaskDetails} from '../components/tasks/TaskDetails';
import {TaskForm} from '../components/tasks/TaskForm';
import type {Task} from '../features/tasks/schema';
import {useTasks} from '../features/tasks/context';
import {useInputCapture, useKeymap, useToast} from '../hooks';
import {toAppError} from '../lib/errors';
import {useTheme} from '../theme/context';

type Mode = 'list' | 'detail' | 'create' | 'edit' | 'delete';

/** Persistent CRUD example: all changes are delegated to the shared TaskService. */
export function TasksScreen() {
  const service = useTasks();
  const toast = useToast();
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [, refresh] = useState(0);
  const tasks = service.list();
  const index = Math.min(cursor, Math.max(0, tasks.length - 1));
  const selected = tasks[index];
  const detail = tasks.find((task) => task.id === selectedId);

  useInputCapture(mode === 'create' || mode === 'edit' || mode === 'delete');

  const mutate = (operation: () => void, message: string, next: Mode = 'list') => {
    try {
      operation();
      toast.push(message, 'success');
      setMode(next);
      refresh((revision) => revision + 1);
    } catch (error) {
      toast.push(toAppError(error).message, 'danger');
    }
  };

  useKeymap([
    {key: 'up', run: () => setCursor((value) => Math.max(value - 1, 0))},
    {key: 'k', run: () => setCursor((value) => Math.max(value - 1, 0))},
    {key: 'down', run: () => setCursor((value) => Math.min(value + 1, tasks.length - 1))},
    {key: 'j', run: () => setCursor((value) => Math.min(value + 1, tasks.length - 1))},
    {key: 'enter', run: () => {if (selected) {setSelectedId(selected.id); setMode('detail');}}},
    {key: 'n', run: () => setMode('create')},
    {key: 'r', run: () => refresh((value) => value + 1)},
  ], {isActive: mode === 'list'});

  useKeymap([
    {key: 'esc', run: () => setMode('list')},
    {key: 'space', run: () => {
      if (detail) mutate(() => service.setDone(detail.id, detail.status !== 'done'), 'Task updated', 'detail');
    }},
    {key: 'e', run: () => setMode('edit')},
    {key: 'd', run: () => setMode('delete')},
  ], {isActive: mode === 'detail'});

  const create = (title: string) => mutate(() => {
    const task = service.add(title);
    setSelectedId(task.id);
    setCursor(0);
  }, 'Task created');

  const rename = (title: string) => {
    if (detail) mutate(() => service.rename(detail.id, title), 'Task renamed', 'detail');
  };

  return (
    <Stack gap={1}>
      {mode === 'list' && (
        <Panel title={`Tasks (${tasks.length})`} footer="↑/↓ select  enter details  n new  r refresh">
          {tasks.length === 0 ? (
            <EmptyState title="No tasks yet" hint="Press n to create the first task." />
          ) : tasks.slice(Math.max(0, index - 4), Math.max(0, index - 4) + 8).map((task: Task) => (
            <Box key={task.id} gap={1}>
              <Text color={index === tasks.indexOf(task) ? theme.color.primary : theme.color.muted}>
                {index === tasks.indexOf(task) ? theme.symbols.pointer : ' '}
              </Text>
              <Text color={task.status === 'done' ? theme.color.muted : theme.color.text} wrap="truncate-end">
                [{task.status === 'done' ? 'x' : ' '}] {task.title}
              </Text>
            </Box>
          ))}
        </Panel>
      )}
      {mode === 'detail' && detail && <TaskDetails task={detail} />}
      {(mode === 'create' || mode === 'edit') && (
        <Panel title={mode === 'create' ? 'Create task' : 'Rename task'}>
          <TaskForm
            key={mode + (detail?.id ?? '')}
            initial={mode === 'edit' ? detail?.title : ''}
            onSubmit={mode === 'create' ? create : rename}
            onCancel={() => setMode(mode === 'create' ? 'list' : 'detail')}
          />
        </Panel>
      )}
      {mode === 'delete' && detail && (
        <Panel title="Delete task">
          <Confirm message={`Delete "${detail.title}" permanently?`} onConfirm={(yes) => {
            if (yes) mutate(() => service.remove(detail.id), 'Task deleted');
            else setMode('detail');
          }} />
        </Panel>
      )}
    </Stack>
  );
}

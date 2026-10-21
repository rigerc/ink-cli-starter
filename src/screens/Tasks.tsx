import {useEffect, useState} from 'react';
import {Alert, Panel, ProgressBar, ScreenLayout, Stack, TaskList, type Task} from '../components';
import {useAsync, useKeymap, useToast} from '../hooks';
import {AppError} from '../lib/errors';
import {sleep} from '../lib/format';

const blueprint: Task[] = [
  {id: 'deps', label: 'Resolve dependencies', status: 'pending'},
  {id: 'build', label: 'Compile sources', status: 'pending'},
  {id: 'test', label: 'Run test suite', status: 'pending'},
  {id: 'ship', label: 'Publish package', status: 'pending'},
];

/** Demo of useAsync + TaskList + Toast. Replace the sleeps with real work. */
export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>(blueprint);
  const toast = useToast();

  const patch = (id: string, change: Partial<Task>) =>
    setTasks((all) => all.map((t) => (t.id === id ? {...t, ...change} : t)));

  const runner = useAsync(async (failAtStep: number | null) => {
    setTasks(blueprint);
    for (const [i, task] of blueprint.entries()) {
      patch(task.id, {status: 'running', startedAt: Date.now()});
      await sleep(700);
      if (i === failAtStep) {
        patch(task.id, {status: 'failed', endedAt: Date.now(), detail: 'exit code 1'});
        throw new AppError(`${task.label} failed`, {
          hint: 'Fix the error above and press r to retry.',
        });
      }
      patch(task.id, {status: 'done', endedAt: Date.now()});
    }
    toast.push('All tasks finished', 'success');
  });

  useEffect(() => {
    void runner.run(null);
  }, []);

  useKeymap([
    {key: 'r', run: () => void runner.run(null)},
    {key: 'x', run: () => void runner.run(2)},
  ]);

  const done = tasks.filter((t) => t.status === 'done').length;
  return (
    <ScreenLayout title="Tasks" description="Monitor and rerun the sample task pipeline">
      <Stack gap={1}>
        <Panel title="Tasks">
          <TaskList tasks={tasks} />
          <ProgressBar
            value={done / tasks.length}
            tone={runner.status === 'error' ? 'danger' : 'primary'}
          />
        </Panel>
        {runner.status === 'error' && (
          <Alert tone="danger" title={runner.error.message}>
            {runner.error.hint}
          </Alert>
        )}
      </Stack>
    </ScreenLayout>
  );
}

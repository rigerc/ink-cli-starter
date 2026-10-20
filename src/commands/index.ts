import {configPath} from '../lib/config';
import {AppError} from '../lib/errors';
import {createTaskRepository} from '../features/tasks/repository';
import {createTaskService} from '../features/tasks/service';
import {dataFilePath} from '../storage/paths';

export interface CommandOptions {
  json?: boolean;
  dataFile?: string;
  write?: (text: string) => void;
}

/** Execute headlessly: no React render, stdin reads, or interactive prompts. */
export function executeCommand(args: string[], options: CommandOptions = {}): void {
  const write = options.write ?? ((text: string) => console.log(text));
  const output = (value: unknown, text: string) =>
    write(options.json ? JSON.stringify(value, null, 2) : text);
  const [command, action, ...rest] = args;
  const fail = (message: string): never => {
    throw new AppError(message, {exitCode: 2});
  };
  if (command === 'config' && action === 'path' && rest.length === 0) {
    const path = configPath();
    output({path}, path);
    return;
  }
  if (command === 'doctor' && action === undefined) {
    const service = createTaskService(createTaskRepository(options.dataFile));
    const status = {
      node: process.versions.node,
      config: configPath(),
      data: dataFilePath(options.dataFile),
      tasks: service.stats(),
    };
    output(status, `Node: ${status.node}\nConfig: ${status.config}\nData: ${status.data}\nTasks: ${status.tasks.total}`);
    return;
  }
  if (command !== 'tasks') return fail(`Unknown command: ${args.join(' ')}`);
  const service = createTaskService(createTaskRepository(options.dataFile));
  if (action === 'list' && rest.length === 0) {
    const tasks = service.list();
    output(tasks, tasks.length ? tasks.map((task) =>
      `${task.id}  [${task.status === 'done' ? 'x' : ' '}] ${task.title}`).join('\n') : 'No tasks.');
    return;
  }
  if (action === 'show' && rest.length === 1) {
    const task = service.get(rest[0]!);
    output(task, `${task.id}\nTitle: ${task.title}\nStatus: ${task.status}`);
    return;
  }
  if (action === 'add' && rest.length > 0) {
    const task = service.add(rest.join(' '));
    output(task, `Created ${task.id}: ${task.title}`);
    return;
  }
  if (action === 'rename' && rest.length > 1) {
    const task = service.rename(rest[0]!, rest.slice(1).join(' '));
    output(task, `Renamed ${task.id}: ${task.title}`);
    return;
  }
  if ((action === 'complete' || action === 'reopen') && rest.length === 1) {
    const task = service.setDone(rest[0]!, action === 'complete');
    output(task, `${action === 'complete' ? 'Completed' : 'Reopened'} ${task.id}`);
    return;
  }
  if (action === 'remove' && rest.length === 1) {
    service.remove(rest[0]!);
    output({removed: rest[0]}, `Removed ${rest[0]}`);
    return;
  }
  return fail('Usage: tasks list | show ID | add TITLE | rename ID TITLE | complete ID | reopen ID | remove ID');
}

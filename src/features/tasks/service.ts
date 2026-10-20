import {randomUUID} from 'node:crypto';
import {AppError} from '../../lib/errors';
import {createTaskRepository, type TaskRepository} from './repository';
import {taskTitleSchema, type Task} from './schema';

function titleOf(raw: string): string {
  const parsed = taskTitleSchema.safeParse(raw);
  if (!parsed.success)
    throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid task title', {exitCode: 2});
  return parsed.data;
}

function requireTask(tasks: Task[], id: string): Task {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new AppError(`Task not found: ${id}`, {exitCode: 3});
  return task;
}

/** Business rules, shared by both Ink screens and noninteractive commands. */
export function createTaskService(repository: TaskRepository = createTaskRepository()) {
  return {
    path: repository.path,
    list(): Task[] {
      return [...repository.list()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    get(id: string): Task {
      return requireTask(repository.list(), id);
    },
    add(rawTitle: string): Task {
      const title = titleOf(rawTitle);
      const now = new Date().toISOString();
      const task: Task = {id: randomUUID(), title, status: 'pending', createdAt: now, updatedAt: now};
      repository.update((tasks) => [...tasks, task]);
      return task;
    },
    rename(id: string, rawTitle: string): Task {
      const title = titleOf(rawTitle);
      let result: Task | undefined;
      repository.update((tasks) => {
        requireTask(tasks, id);
        return tasks.map((task) => {
          if (task.id !== id) return task;
          result = {...task, title, updatedAt: new Date().toISOString()};
          return result;
        });
      });
      return result!;
    },
    setDone(id: string, done: boolean): Task {
      let result: Task | undefined;
      repository.update((tasks) => {
        requireTask(tasks, id);
        return tasks.map((task) => {
          if (task.id !== id) return task;
          result = {...task, status: done ? 'done' : 'pending', updatedAt: new Date().toISOString()};
          return result;
        });
      });
      return result!;
    },
    remove(id: string): void {
      repository.update((tasks) => {
        requireTask(tasks, id);
        return tasks.filter((task) => task.id !== id);
      });
    },
    stats(): {total: number; pending: number; done: number} {
      const tasks = repository.list();
      return {
        total: tasks.length,
        pending: tasks.filter((task) => task.status === 'pending').length,
        done: tasks.filter((task) => task.status === 'done').length,
      };
    },
  };
}
export type TaskService = ReturnType<typeof createTaskService>;

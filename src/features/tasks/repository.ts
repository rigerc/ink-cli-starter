import {createJsonStore} from '../../storage/json-store';
import {dataFilePath} from '../../storage/paths';
import {taskDocumentSchema, type Task} from './schema';

export function createTaskRepository(path?: string) {
  const store = createJsonStore({
    path: dataFilePath(path),
    version: 1,
    schema: taskDocumentSchema,
    empty: () => ({version: 1 as const, tasks: [] as Task[]}),
  });

  return {
    path: store.path,
    list(): Task[] {
      return store.read().tasks;
    },
    update(transform: (tasks: Task[]) => Task[]): Task[] {
      return store.update((document) => ({
        version: 1,
        tasks: transform(document.tasks),
      })).tasks;
    },
  };
}

export type TaskRepository = ReturnType<typeof createTaskRepository>;

import {createContext, useContext, useMemo, type ReactNode} from 'react';
import {createTaskRepository} from './repository';
import {createTaskService, type TaskService} from './service';

const Context = createContext<TaskService | null>(null);

export function TaskProvider({dataFile, children}: {dataFile?: string; children: ReactNode}) {
  const service = useMemo(() => createTaskService(createTaskRepository(dataFile)), [dataFile]);
  return <Context.Provider value={service}>{children}</Context.Provider>;
}

export function useTasks(): TaskService {
  const service = useContext(Context);
  if (!service) throw new Error('useTasks must be used inside TaskProvider');
  return service;
}

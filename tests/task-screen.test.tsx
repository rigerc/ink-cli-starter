import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vite-plus/test';
import {App} from '../src/app';
import {createTaskRepository} from '../src/features/tasks/repository';
import {createTaskService} from '../src/features/tasks/service';
import {mount, press} from './helpers/terminal';

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, {recursive: true, force: true})));

describe('tasks screen', () => {
  it('creates, completes and removes persisted tasks through keyboard controls', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'ink-ui-tasks-'));
    dirs.push(directory);
    const dataFile = join(directory, 'tasks.json');
    const service = createTaskService(createTaskRepository(dataFile));
    const app = await mount(<App options={{
      theme: 'mono', ascii: true, debug: false, screen: 'tasks', dataFile,
    }} />);
    expect(app.lastFrame()).toContain('No tasks yet');
    await press(app, 'n');
    expect(app.lastFrame()).toContain('Create task');
    await press(app, 'First task');
    await press(app, '\r');
    expect(service.list()).toHaveLength(1);
    expect(app.lastFrame()).toContain('First task');
    await press(app, '\r');
    expect(app.lastFrame()).toContain('Task details');
    await press(app, ' ');
    expect(service.list()[0]?.status).toBe('done');
    await press(app, 'd');
    expect(app.lastFrame()).toContain('Delete task');
    await press(app, 'y');
    await press(app, '\r');
    expect(service.list()).toHaveLength(0);
  });
});

import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vite-plus/test';
import {executeCommand} from '../src/commands';
import {createTaskRepository} from '../src/features/tasks/repository';
import {createTaskService} from '../src/features/tasks/service';
import {AppError} from '../src/lib/errors';

const dirs: string[] = [];
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'ink-tasks-'));
  dirs.push(dir);
  const path = join(dir, 'tasks.json');
  return {path, service: createTaskService(createTaskRepository(path))};
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, {recursive: true, force: true});
});

describe('persistent task service', () => {
  it('supports the full task lifecycle and reloads from disk', () => {
    const {path, service} = fixture();
    expect(service.list()).toEqual([]);
    expect(service.stats()).toEqual({total: 0, pending: 0, done: 0});
    const created = service.add('  Write documentation  ');
    expect(created.title).toBe('Write documentation');
    expect(service.get(created.id)).toEqual(created);
    expect(service.rename(created.id, 'Update docs').title).toBe('Update docs');
    expect(service.setDone(created.id, true).status).toBe('done');
    expect(createTaskService(createTaskRepository(path)).stats()).toEqual({total: 1, pending: 0, done: 1});
    expect(service.setDone(created.id, false).status).toBe('pending');
    service.remove(created.id);
    expect(service.list()).toEqual([]);
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({version: 1, tasks: []});
  });

  it('validates titles and missing identifiers', () => {
    const {service} = fixture();
    expect(() => service.add(' ')).toThrow(AppError);
    expect(() => service.add('x'.repeat(161))).toThrow();
    expect(() => service.get('missing')).toThrow('Task not found');
    expect(() => service.remove('missing')).toThrow('Task not found');
  });

  it('refuses to overwrite malformed or unsupported files', () => {
    const {path, service} = fixture();
    writeFileSync(path, '{broken');
    expect(() => service.add('Unsafe')).toThrow('Cannot read application data');
    expect(readFileSync(path, 'utf8')).toBe('{broken');
    writeFileSync(path, JSON.stringify({version: 99, tasks: []}));
    expect(() => service.add('Unsafe')).toThrow('newer version');
    expect(JSON.parse(readFileSync(path, 'utf8')).version).toBe(99);
  });
});

describe('headless commands', () => {
  it('creates, lists, updates and deletes in JSON mode', () => {
    const {path} = fixture();
    const outputs: string[] = [];
    const run = (...args: string[]) =>
      executeCommand(args, {dataFile: path, json: true, write: (text) => outputs.push(text)});
    run('tasks', 'add', 'Ship', 'release');
    const task = JSON.parse(outputs.at(-1)!);
    run('tasks', 'list');
    expect(JSON.parse(outputs.at(-1)!)[0].id).toBe(task.id);
    run('tasks', 'complete', task.id);
    expect(JSON.parse(outputs.at(-1)!).status).toBe('done');
    run('tasks', 'rename', task.id, 'Ship', 'v2');
    expect(JSON.parse(outputs.at(-1)!).title).toBe('Ship v2');
    run('tasks', 'reopen', task.id);
    run('tasks', 'remove', task.id);
    run('doctor');
    expect(JSON.parse(outputs.at(-1)!).tasks.total).toBe(0);
  });

  it('returns predictable errors for invalid syntax', () => {
    const {path} = fixture();
    expect(() => executeCommand(['tasks', 'add'], {dataFile: path})).toThrow('Usage:');
    expect(() => executeCommand(['invalid'], {dataFile: path})).toThrow('Unknown command');
  });
});

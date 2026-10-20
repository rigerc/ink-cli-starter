import {z} from 'zod';

export const taskTitleSchema = z.string().trim().min(1, 'Task title is required').max(160);
export const taskSchema = z.object({
  id: z.string().uuid(),
  title: taskTitleSchema,
  status: z.enum(['pending', 'done']),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const taskDocumentSchema = z.object({
  version: z.literal(1),
  tasks: z.array(taskSchema),
});
export type Task = z.infer<typeof taskSchema>;
export type TaskDocument = z.infer<typeof taskDocumentSchema>;

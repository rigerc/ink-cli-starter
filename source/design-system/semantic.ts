import type {BadgeVariant} from "../components/ui/badge.js";
export type TaskStatus = "ready" | "running" | "blocked";
export const taskStatusVariants: Record<TaskStatus, BadgeVariant> = {
  ready: "success",
  running: "info",
  blocked: "error",
};
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

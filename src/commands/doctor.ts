import {existsSync} from 'node:fs';
import {z} from 'zod';
import {configPath, loadConfig} from '../lib/config';

/** Machine-readable contract for `doctor --json`. */
export const doctorCheckSchema = z.object({
  name: z.string(),
  ok: z.boolean(),
  detail: z.string(),
});

export const doctorReportSchema = z.object({
  ok: z.boolean(),
  checks: z.array(doctorCheckSchema),
});

export type DoctorCheck = z.infer<typeof doctorCheckSchema>;
export type DoctorReport = z.infer<typeof doctorReportSchema>;

/** Headless diagnostics without Ink, prompts, or external I/O. */
export function inspectEnvironment(configFile?: string): DoctorReport {
  const path = configPath(configFile);
  const {error} = loadConfig(configFile);
  const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
  const supportedNode = (nodeMajor ?? 0) > 22 || (nodeMajor === 22 && (nodeMinor ?? 0) >= 12);

  const checks: DoctorCheck[] = [
    {
      name: 'node',
      ok: supportedNode,
      detail: `Node.js ${process.versions.node} (requires 22.12+)`,
    },
    {
      name: 'configuration',
      ok: !error,
      detail: error
        ? `${path}: ${error}`
        : existsSync(path)
          ? `${path}: valid`
          : `${path}: not created (defaults in use)`,
    },
  ];

  return {ok: checks.every((check) => check.ok), checks};
}

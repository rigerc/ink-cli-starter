import {existsSync} from 'node:fs';
import {configPath, loadConfig} from '../lib/config';

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
}

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
          : `${path}: no saved overrides (node-config files/defaults in use)`,
    },
  ];

  return {ok: checks.every((check) => check.ok), checks};
}

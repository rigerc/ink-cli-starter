#!/usr/bin/env node
import {readdir, readFile, stat} from "node:fs/promises";
import {dirname, extname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const counts = {
  "source/components/ui": 123,
  "source/hooks": 10,
  "source/providers": 3,
  "source/lib/terminal-themes": 41,
};
const errors = [];

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

for (const [directory, expected] of Object.entries(counts)) {
  const all = await walk(resolve(root, directory));
  const actual = all.filter(path => [".ts", ".tsx"].includes(extname(path))).length;
  if (actual !== expected) errors.push(directory + ": expected " + expected + " files; got " + actual);
}

const sourceFiles = (await walk(resolve(root, "source")))
  .filter(path => [".ts", ".tsx"].includes(extname(path)));

for (const file of sourceFiles) {
  const body = await readFile(file, "utf8");
  if (body.includes("@/registry/bases")) {
    errors.push(file + ": unresolved upstream registry alias");
  }
  for (const match of body.matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.[^"']+)["']/g)) {
    const specifier = match[1];
    const base = resolve(dirname(file), specifier);
    const possible = specifier.endsWith(".js")
      ? [base.slice(0, -3) + ".ts", base.slice(0, -3) + ".tsx"]
      : [base, base + ".ts", base + ".tsx"];
    let found = false;
    for (const candidate of possible) {
      try {
        if ((await stat(candidate)).isFile()) { found = true; break; }
      } catch { /* candidate missing */ }
    }
    if (!found) errors.push(file + ": unresolved local import " + specifier);
  }
}

if (errors.length > 0) {
  console.error("Vendor integrity check failed:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Vendor integrity OK: 123 Ink UI files, 10 hooks, 3 providers, 40 themes + index");
  console.log("All source relative imports resolve to TypeScript modules.");
}

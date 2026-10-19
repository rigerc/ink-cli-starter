#!/usr/bin/env node
import Pastel from "pastel";

const app = new Pastel({
  importMeta: import.meta,
  name: "ink-starter",
  description: "Ink 8, Pastel and termcn terminal starter",
});
await app.run();

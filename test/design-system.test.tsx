import assert from "node:assert/strict";
import {test} from "node:test";
import {clampPercent, taskStatusVariants} from "../source/design-system/semantic.js";
import {monoTheme, oceanTheme} from "../source/design-system/themes.js";
test("theme overrides preserve required tokens", () => {
  for (const theme of [oceanTheme, monoTheme]) {
    assert.ok(theme.name);
    assert.ok(theme.colors.primary);
    assert.ok(theme.colors.error);
    assert.ok(theme.colors.foreground);
    assert.ok(theme.border.style);
    assert.ok(theme.spacing[2] > 0);
  }
});
test("status variants have semantic states", () => {
  assert.deepEqual(Object.keys(taskStatusVariants).sort(), ["blocked", "ready", "running"]);
  assert.equal(taskStatusVariants.blocked, "error");
});
test("progress values are clamped", () => {
  assert.equal(clampPercent(-2), 0);
  assert.equal(clampPercent(42.6), 43);
  assert.equal(clampPercent(999), 100);
  assert.equal(clampPercent(Number.NaN), 0);
});

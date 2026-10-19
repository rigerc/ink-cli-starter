import assert from "node:assert/strict";
import {test} from "node:test";
import {renderToString} from "ink";
import {Card} from "../source/components/ui/card.js";
import {Badge} from "../source/components/ui/badge.js";
import {ProgressBar} from "../source/components/ui/progress-bar.js";
import {ThemeProvider} from "../source/providers/theme-provider.js";
import {monoTheme} from "../source/design-system/themes.js";
test("copy-owned termcn components render at 40 columns", () => {
  const output = renderToString(
    <ThemeProvider theme={monoTheme}>
      <Card title="Pipeline">
        <Badge variant="success" bordered={false}>Ready</Badge>
        <ProgressBar value={30} width={10} label="Deploy" />
      </Card>
    </ThemeProvider>,
    {columns: 40},
  );
  assert.match(output, /Pipeline/);
  assert.match(output, /Ready/);
  assert.match(output, /30%/);
  assert.match(output, /Deploy/);
});

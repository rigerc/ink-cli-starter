import {useState} from "react";
import {Box, Text, useApp, useInput} from "ink";
import {z} from "zod";
import {AppShell} from "../components/app-shell.js";
import {Badge} from "../components/ui/badge.js";
import {Card} from "../components/ui/card.js";
import {Heading} from "../components/ui/heading.js";
import {ProgressBar} from "../components/ui/progress-bar.js";
import {Spinner} from "../components/ui/spinner.js";
import {StatusMessage} from "../components/ui/status-message.js";
import {themes} from "../design-system/themes.js";
import {clampPercent, taskStatusVariants} from "../design-system/semantic.js";
import {sections, showcaseTasks} from "../demo/catalog.js";
import {ThemeProvider} from "../providers/theme-provider.js";
import {useTheme} from "../hooks/use-theme.js";

export const options = z.object({
  theme: z.enum(["ocean", "mono"]).default("ocean").describe("Theme: ocean or mono"),
});
type Props = {options: z.infer<typeof options>};

function Overview() {
  return (
    <Card title="Project snapshot" subtitle="Representative CLI dashboard">
      <StatusMessage variant="success">CLI scaffolded</StatusMessage>
      <StatusMessage variant="info">Copy-owned termcn components</StatusMessage>
      <Box marginTop={1}>
        <ProgressBar value={clampPercent(72)} width={18} label="Starter completeness" />
      </Box>
    </Card>
  );
}

function ComponentGallery() {
  return (
    <Box flexDirection="column" gap={1}>
      <Heading level={2}>States and feedback</Heading>
      <Box gap={1}>
        <Badge variant="success">Ready</Badge>
        <Badge variant="warning">Review</Badge>
        <Badge variant="error">Blocked</Badge>
      </Box>
      <Card title="Build pipeline">
        {showcaseTasks.map((task) => (
          <Box key={task.name} gap={1}>
            <Badge bordered={false} variant={taskStatusVariants[task.status]}>
              {task.status.toUpperCase()}
            </Badge>
            <Text>{task.name}</Text>
          </Box>
        ))}
        <Spinner label="Animation paused" isActive={false} />
      </Card>
    </Box>
  );
}

function TokenGallery() {
  const {colors, border} = useTheme();
  const swatches = [
    ["Primary", colors.primary],
    ["Accent", colors.accent],
    ["Success", colors.success],
    ["Warning", colors.warning],
    ["Error", colors.error],
    ["Border", colors.border],
  ] as const;
  return (
    <Card title="Semantic tokens" subtitle="Theme values">
      {swatches.map(([name, color]) => (
        <Box key={name} gap={2}>
          <Text color={color} bold>*</Text>
          <Text>{name.padEnd(8)} {color}</Text>
        </Box>
      ))}
      <Text dimColor>Border style: {border.style}</Text>
    </Card>
  );
}

function DemoScreen() {
  const [active, setActive] = useState(0);
  const {exit} = useApp();
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    } else if (key.rightArrow || input === "l") {
      setActive((index) => (index + 1) % sections.length);
    } else if (key.leftArrow || input === "h") {
      setActive((index) => (index + sections.length - 1) % sections.length);
    } else if (["1", "2", "3"].includes(input)) {
      setActive(Number(input) - 1);
    }
  }, {isActive: interactive});

  return (
    <AppShell title="Component playground">
      <Box gap={2}>
        {sections.map((section, index) => (
          <Text key={section} bold={active === index} inverse={active === index}>
            {String(index + 1) + " " + section}
          </Text>
        ))}
      </Box>
      {active === 0 ? <Overview /> : active === 1 ? <ComponentGallery /> : <TokenGallery />}
      <Text dimColor>
        {interactive
          ? "Keys: left/right or h/l · 1/2/3 jump · q/Esc quit"
          : "Static preview · Open in a TTY to switch sections"}
      </Text>
    </AppShell>
  );
}

export default function Demo({options: {theme}}: Props) {
  return <ThemeProvider theme={themes[theme]}><DemoScreen /></ThemeProvider>;
}

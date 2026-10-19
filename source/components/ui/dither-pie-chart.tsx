// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import * as React from "react";

import type {
  AreaVariant,
  ChartConfig,
  ChartMargins,
  ChartRow,
} from "../../lib/dither-chart-utils.js";
import { renderDitherPieChart } from "../../lib/dither-pie-chart-utils.js";

import { DitherChart } from "./dither-chart.js";
import type {
  InteractionOptions,
  MotionOptions,
  TerminalChartOptions,
} from "./dither-chart.js";

export { Legend, Tooltip } from "./dither-chart.js";
export type {
  AreaVariant,
  BloomBlend,
  BloomConfig,
  BloomInput,
  ChartConfig,
  LegendProps,
  Margins,
  TooltipProps,
  TooltipVariant,
} from "./dither-chart.js";

export interface PieProps {
  variant?: AreaVariant;
}

export type PieChartProps<TData extends object> = TerminalChartOptions &
  InteractionOptions &
  MotionOptions & {
    children: React.ReactNode;
    config: ChartConfig;
    data: TData[];
    dataKey: string;
    innerRadius?: number;
    margins?: Partial<ChartMargins>;
    nameKey: string;
  };

export function Pie(_props: PieProps): null {
  return null;
}
Pie.chartRole = "pie" as const;

export function PieChart<TData extends object>(props: PieChartProps<TData>) {
  return (
    <DitherChart
      {...props}
      data={props.data as unknown as ChartRow[]}
      innerRadius={props.innerRadius}
      kind="pie"
      margins={props.margins}
      renderChart={renderDitherPieChart}
    />
  );
}

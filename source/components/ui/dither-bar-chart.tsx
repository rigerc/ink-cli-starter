// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import * as React from "react";

import { renderDitherBarChart } from "../../lib/dither-bar-chart-utils.js";
import type { ChartRow } from "../../lib/dither-chart-utils.js";

import { DitherChart } from "./dither-chart.js";
import type { CartesianChartProps, SeriesProps } from "./dither-chart.js";

export {
  ActiveDot,
  Dot,
  Grid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "./dither-chart.js";
export type {
  AreaVariant,
  BloomBlend,
  BloomConfig,
  BloomInput,
  ChartConfig,
  DotProps,
  DotVariant,
  GridProps,
  LegendProps,
  Margins,
  StackType,
  StrokeVariant,
  TooltipProps,
  TooltipVariant,
  XAxisProps,
  YAxisProps,
} from "./dither-chart.js";

export type BarProps = SeriesProps;
export type BarChartProps<TData extends object> = CartesianChartProps<TData>;

export function Bar(_props: BarProps): null {
  return null;
}
Bar.chartRole = "bar" as const;

export function BarChart<TData extends object>(props: BarChartProps<TData>) {
  return (
    <DitherChart
      {...props}
      data={props.data as unknown as ChartRow[]}
      kind="bar"
      renderChart={renderDitherBarChart}
    />
  );
}

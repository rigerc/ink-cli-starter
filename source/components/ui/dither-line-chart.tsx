// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import * as React from "react";

import type { ChartRow } from "../../lib/dither-chart-utils.js";
import { renderDitherLineChart } from "../../lib/dither-line-chart-utils.js";

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

export type LineProps = SeriesProps;
export type LineChartProps<TData extends object> = CartesianChartProps<TData>;

export function Line(_props: LineProps): null {
  return null;
}
Line.chartRole = "line" as const;

export function LineChart<TData extends object>(props: LineChartProps<TData>) {
  return (
    <DitherChart
      {...props}
      data={props.data as unknown as ChartRow[]}
      kind="line"
      renderChart={renderDitherLineChart}
    />
  );
}

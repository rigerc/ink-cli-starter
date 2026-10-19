// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import * as React from "react";

import { renderDitherAreaChart } from "../../lib/dither-area-chart-utils.js";
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

export type AreaProps = SeriesProps;
export type AreaChartProps<TData extends object> = CartesianChartProps<TData>;

export function Area(_props: AreaProps): null {
  return null;
}
Area.chartRole = "area" as const;

export function AreaChart<TData extends object>(props: AreaChartProps<TData>) {
  return (
    <DitherChart
      {...props}
      data={props.data as unknown as ChartRow[]}
      kind="area"
      renderChart={renderDitherAreaChart}
    />
  );
}

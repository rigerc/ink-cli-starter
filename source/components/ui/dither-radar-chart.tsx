// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import * as React from "react";

import type {
  AreaVariant,
  ChartConfig,
  ChartMargins,
  ChartRow,
} from "../../lib/dither-chart-utils.js";
import { renderDitherRadarChart } from "../../lib/dither-radar-chart-utils.js";

import { DitherChart } from "./dither-chart.js";
import type {
  InteractionOptions,
  MotionOptions,
  TerminalChartOptions,
} from "./dither-chart.js";

export { Grid, Legend, Tooltip } from "./dither-chart.js";
export type {
  AreaVariant,
  BloomBlend,
  BloomConfig,
  BloomInput,
  ChartConfig,
  GridProps,
  LegendProps,
  Margins,
  TooltipProps,
  TooltipVariant,
} from "./dither-chart.js";

export interface RadarProps {
  dataKey: string;
  variant?: AreaVariant;
}

export type RadarChartProps<TData extends object> = TerminalChartOptions &
  InteractionOptions &
  MotionOptions & {
    children: React.ReactNode;
    config: ChartConfig;
    data: TData[];
    margins?: Partial<ChartMargins>;
    nameKey: string;
  };

export function Radar(_props: RadarProps): null {
  return null;
}
Radar.chartRole = "radar" as const;

export function RadarChart<TData extends object>(
  props: RadarChartProps<TData>
) {
  return (
    <DitherChart
      {...props}
      data={props.data as unknown as ChartRow[]}
      kind="radar"
      margins={props.margins}
      renderChart={renderDitherRadarChart}
    />
  );
}

"use client";

import React from "react";
import dynamic from "next/dynamic";

import type { Config, Data, Layout } from "plotly.js";

/* ============================================================
   PLOTLY
   ============================================================ */

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,

  loading: () => (
    <div
      className="
          flex
          min-h-160
          w-full
          items-center
          justify-center

          rounded-md

          border
          border-dashed
          border-border-default

          bg-surface-02

          text-sm
          font-medium
          text-text-secondary
        "
    >
      Carregando gráfico científico...
    </div>
  ),
});

/* ============================================================
   PROPS
   ============================================================ */

interface DrxPlotProps {
  data: Data[];

  layout: Partial<Layout>;

  config: Partial<Config>;

  onInitialized?: (figure: unknown, graphDiv: HTMLElement) => void;

  onUpdate?: (figure: unknown, graphDiv: HTMLElement) => void;
}

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function DrxPlot({ data, layout, config, onInitialized, onUpdate }: DrxPlotProps) {
  return (
    <div
      className="
        w-full
        min-w-0
        overflow-hidden
      "
    >
      <Plot
        data={data}
        layout={layout}
        config={config}
        useResizeHandler
        style={{
          width: "100%",
          height: "100%",
          minWidth: 0,
        }}
        onInitialized={onInitialized}
        onUpdate={onUpdate}
      />
    </div>
  );
}

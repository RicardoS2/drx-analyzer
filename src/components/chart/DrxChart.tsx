"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { Config, Data, Layout, PlotlyHTMLElement } from "plotly.js";

import type { AppState, CorrelatedPhase, PhaseStyleConfig } from "@/types";

import { DEFAULT_PHASE_MARKER_HEIGHT, DEFAULT_PHASE_MARKER_SIZE } from "@/types";

import { chemicalFormulaLegend, chemicalFormulaText } from "@/lib/chemicalFormula";

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
   PALETA CIENTÍFICA
   ============================================================ */

const CHART_PHASE_COLORS = [
  "#059669",
  "#D97706",
  "#7C3AED",
  "#DB2777",
  "#92400E",
  "#4B5563",
  "#65A30D",
  "#C2410C",
  "#86198F",
  "#BE123C",
  "#57534E",
  "#15803D",
];

/* ============================================================
   FASE PRINCIPAL
   ============================================================ */

const MAIN_PHASE_COLOR = "#198038";

/* ============================================================
   SÍMBOLOS
   ============================================================ */

const SYMBOLS = [
  "circle",
  "circle-open",
  "square",
  "square-open",
  "diamond",
  "diamond-open",
  "triangle-up",
  "triangle-up-open",
  "triangle-down",
  "triangle-down-open",
  "triangle-left",
  "triangle-left-open",
  "triangle-right",
  "triangle-right-open",
  "pentagon",
  "pentagon-open",
  "hexagon",
  "hexagon-open",
  "hexagram",
  "hexagram-open",
  "star",
  "star-open",
  "cross",
  "x",
];

/* ============================================================
   APARÊNCIA INTERNA DO GRÁFICO
   ============================================================ */

const CHART_TEXT = "#353638";

const CHART_GRID = "#E2DED6";

const CHART_AXIS = "#6F6A61";

const CHART_BORDER = "#C9C5BC";

const CHART_BACKGROUND = "#FFFFFF";

const CHART_HOVER = "#FFFFFF";

const DRX_TRACE_COLOR = "#2563EB";

/* ============================================================
   PROPS
   ============================================================ */

interface Props {
  state: AppState;

  phaseVisibility?: Record<string, boolean>;

  phaseStyles?: Record<string, PhaseStyleConfig>;

  onPlotReady?: (plotElement: PlotlyHTMLElement) => void;
}

/* ============================================================
   ESTRUTURAS
   ============================================================ */

interface PhaseMarker {
  id: string;
  code: string;
  name: string;
  formula: string;
  x: number;
  peakY: number;
  size: number;
  height: number;
  order: number;
  isMain: boolean;
}

interface PositionedMarker extends PhaseMarker {
  lane: number;
  collisionScale: number;
  offset: number;
  finalSize: number;
}

interface PhaseGroup {
  markers: PositionedMarker[];
}

interface MappedPhase {
  code: string;
  name: string;
  formula: string;
  symbol: string;
  color: string;
  enabled: boolean;
  symbolSize: number;
  symbolHeight: number;
  isMain: boolean;
  order: number;
}

/* ============================================================
   ORDEM DAS FASES
   ============================================================ */

function getPhaseOrder(
  correlations: AppState["correlations"],
  phases: AppState["phases"],
): string[] {
  const result: string[] = [];

  const seen = new Set<string>();

  for (const correlation of correlations) {
    for (const phase of correlation.phases) {
      if (seen.has(phase.code)) {
        continue;
      }

      seen.add(phase.code);

      result.push(phase.code);
    }
  }

  for (const phase of phases) {
    if (seen.has(phase.code)) {
      continue;
    }

    seen.add(phase.code);

    result.push(phase.code);
  }

  return result;
}

/* ============================================================
   SÍMBOLO PADRÃO
   ============================================================ */

function getDefaultSymbol(index: number, isMain: boolean): string {
  if (isMain) {
    return "star";
  }

  return SYMBOLS[index % SYMBOLS.length] ?? "circle";
}

/* ============================================================
   COR PADRÃO
   ============================================================ */

function getDefaultColor(index: number, isMain: boolean): string {
  if (isMain) {
    return MAIN_PHASE_COLOR;
  }

  return CHART_PHASE_COLORS[index % CHART_PHASE_COLORS.length] ?? "#059669";
}

/* ============================================================
   CLAMP
   ============================================================ */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ============================================================
   ESCALA DE COLISÃO
   ============================================================ */

function getCollisionScale(rank: number): number {
  const scales = [1.0, 0.88, 0.78, 0.7, 0.63, 0.57, 0.52, 0.48];

  return scales[Math.min(rank, scales.length - 1)] ?? 0.45;
}

/* ============================================================
   FATOR DE LANE
   ============================================================ */

function getLaneFactor(lane: number): number {
  const factors = [1.0, 0.72, 1.28, 0.48, 1.55, 0.34, 1.78, 0.24];

  return factors[Math.min(lane, factors.length - 1)] ?? 0.2;
}

/* ============================================================
   CLUSTERS
   ============================================================ */

function buildClusters(markers: PhaseMarker[], distance: number): PhaseMarker[][] {
  if (markers.length === 0) {
    return [];
  }

  const sorted = [...markers].sort((a, b) => {
    if (a.x !== b.x) {
      return a.x - b.x;
    }

    if (a.isMain !== b.isMain) {
      return a.isMain ? -1 : 1;
    }

    return a.order - b.order;
  });

  const clusters: PhaseMarker[][] = [];

  let current: PhaseMarker[] = [];

  let previousX = Number.NaN;

  for (const marker of sorted) {
    if (current.length === 0) {
      current = [marker];

      previousX = marker.x;

      continue;
    }

    const close = Math.abs(marker.x - previousX) <= distance;

    if (close) {
      current.push(marker);
    } else {
      clusters.push(current);

      current = [marker];
    }

    previousX = marker.x;
  }

  if (current.length > 0) {
    clusters.push(current);
  }

  return clusters;
}

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function DrxChart({
  state,
  phaseVisibility = {},
  phaseStyles = {},
  onPlotReady,
}: Props) {
  const { diffractogram, correlations, mainPhaseCode, config } = state;

  /* ==========================================================
     CORES
     ========================================================== */

  const chartColors = useMemo(
    () => ({
      text: CHART_TEXT,

      grid: CHART_GRID,

      axis: CHART_AXIS,

      background: config.background === "transparent" ? "rgba(0,0,0,0)" : CHART_BACKGROUND,

      paper: config.background === "transparent" ? "rgba(0,0,0,0)" : CHART_BACKGROUND,

      legend: config.background === "transparent" ? "rgba(255,255,255,0.97)" : CHART_BACKGROUND,

      hover: CHART_HOVER,

      border: CHART_BORDER,
    }),
    [config.background],
  );

  /* ==========================================================
     ORDEM
     ========================================================== */

  const phaseOrder = useMemo(
    () => getPhaseOrder(correlations, state.phases),
    [correlations, state.phases],
  );

  /* ==========================================================
     MAPA
     ========================================================== */

  const phaseMap = useMemo(() => {
    const map = new Map<string, MappedPhase>();

    for (const phase of state.phases) {
      const isMain = phase.code === mainPhaseCode;

      const phaseIndex = Math.max(0, phaseOrder.indexOf(phase.code));

      let secondaryIndex = 0;

      for (let index = 0; index < phaseIndex; index += 1) {
        if (phaseOrder[index] !== mainPhaseCode) {
          secondaryIndex += 1;
        }
      }

      const style = phaseStyles[phase.code] ?? {};

      map.set(phase.code, {
        code: phase.code,

        name: phase.name || phase.code,

        formula: chemicalFormulaText(phase.formula),

        symbol: style.symbol ?? getDefaultSymbol(secondaryIndex, isMain),

        color: style.color ?? getDefaultColor(secondaryIndex, isMain),

        enabled: phaseVisibility[phase.code] !== false,

        symbolSize: Math.max(2, style.symbolSize ?? DEFAULT_PHASE_MARKER_SIZE),

        symbolHeight: clamp(
          style.symbolHeight ?? config.lines.peakHeight ?? DEFAULT_PHASE_MARKER_HEIGHT,
          10,
          100,
        ),

        isMain,

        order: phaseIndex,
      });
    }

    return map;
  }, [
    state.phases,
    mainPhaseCode,
    phaseOrder,
    phaseStyles,
    phaseVisibility,
    config.lines.peakHeight,
  ]);

  /* ==========================================================
     EIXO X
     ========================================================== */

  const xRange = useMemo<[number, number] | null>(() => {
    const values = diffractogram.map((point) => Number(point.twoTheta)).filter(Number.isFinite);

    if (values.length === 0) {
      return null;
    }

    const first = values[0]!;

    const last = values[values.length - 1]!;

    if (first === last) {
      return [first - 0.1, last + 0.1];
    }

    return [first, last];
  }, [diffractogram]);

  /* ==========================================================
     EIXO Y
     ========================================================== */

  const yRange = useMemo<[number, number] | null>(() => {
    const values = diffractogram.map((point) => Number(point.intensity)).filter(Number.isFinite);

    if (values.length === 0) {
      return null;
    }

    const min = Math.min(...values);

    const max = Math.max(...values);

    const span = Math.max(max - min, Math.abs(max) * 0.1, 1);

    return [min - span * 0.015, max + span * 0.52];
  }, [diffractogram]);

  /* ==========================================================
     DATA
     ========================================================== */

  const data = useMemo<Data[]>(() => {
    const traces: Data[] = [];

    /* ====================================================
           DRX
           ==================================================== */

    if (diffractogram.length > 0) {
      traces.push({
        x: diffractogram.map((point) => Number(point.twoTheta)),

        y: diffractogram.map((point) => Number(point.intensity)),

        type: "scatter",

        mode: "lines",

        name: "DRX",

        connectgaps: false,

        line: {
          color: DRX_TRACE_COLOR,

          width: config.lines.curveThickness,

          shape: "linear",

          simplify: false,
        },

        hovertemplate:
          "<b>Difratograma</b><br>" +
          "2θ: %{x:.4f}°<br>" +
          "Intensidade: %{y:.2f}" +
          "<extra></extra>",

        hoverinfo: "x+y",

        hoverlabel: {
          bgcolor: chartColors.hover,

          bordercolor: chartColors.border,

          font: {
            family: config.typography.fontFamily,

            size: 12,

            color: chartColors.text,
          },

          namelength: -1,
        },

        showlegend: config.showLegend,
      });
    }

    /* ====================================================
           FASES
           ==================================================== */

    if (!config.showPhases || correlations.length === 0) {
      return traces;
    }

    const intensityValues = diffractogram
      .map((point) => Number(point.intensity))
      .filter(Number.isFinite);

    const maxIntensity = intensityValues.length > 0 ? Math.max(...intensityValues) : 1000;

    const minIntensity = intensityValues.length > 0 ? Math.min(...intensityValues) : 0;

    const usefulRange = Math.max(maxIntensity - minIntensity, Math.abs(maxIntensity) * 0.1, 1);

    const maxOffset = usefulRange * 0.3;

    const rawMarkers: PhaseMarker[] = [];

    let sequence = 0;

    correlations.forEach((correlation) => {
      if (!correlation.phases || correlation.phases.length === 0) {
        return;
      }

      correlation.phases.forEach((phase: CorrelatedPhase) => {
        const phaseConfig = phaseMap.get(phase.code);

        if (!phaseConfig || !phaseConfig.enabled) {
          return;
        }

        const x = Number(correlation.twoThetaReal);

        const peakY = Number(correlation.intensityReal);

        if (!Number.isFinite(x) || !Number.isFinite(peakY)) {
          return;
        }

        sequence += 1;

        rawMarkers.push({
          id: `${phase.code}-${sequence}`,

          code: phase.code,

          name: phaseConfig.name,

          formula: phaseConfig.formula,

          x,

          peakY,

          size: phaseConfig.symbolSize,

          height: phaseConfig.symbolHeight,

          order: phaseConfig.order,

          isMain: phaseConfig.isMain,
        });
      });
    });

    if (rawMarkers.length === 0) {
      return traces;
    }

    /* ====================================================
           POSICIONAMENTO
           ==================================================== */

    const xMin = xRange?.[0] ?? 0;

    const xMax = xRange?.[1] ?? 1;

    const xSpan = Math.max(Math.abs(xMax - xMin), 0.01);

    const collisionDistance = Math.max(xSpan * 0.0035, 0.018);

    const clusters = buildClusters(rawMarkers, collisionDistance);

    const positionedMarkers: PositionedMarker[] = [];

    clusters.forEach((cluster) => {
      const ordered = [...cluster].sort((a, b) => {
        if (a.isMain !== b.isMain) {
          return a.isMain ? -1 : 1;
        }

        if (a.order !== b.order) {
          return a.order - b.order;
        }

        return a.x - b.x;
      });

      ordered.forEach((marker, rank) => {
        const collisionScale = getCollisionScale(rank);

        const laneFactor = getLaneFactor(rank);

        const heightFactor = marker.height / 100;

        const offset = maxOffset * heightFactor * laneFactor;

        const finalSize = clamp(
          marker.size * collisionScale + (marker.isMain ? 4 : 0),

          2,

          42,
        );

        positionedMarkers.push({
          ...marker,

          lane: rank,

          collisionScale,

          offset,

          finalSize,
        });
      });
    });

    /* ====================================================
           AGRUPAMENTO
           ==================================================== */

    const phaseGroups = new Map<string, PhaseGroup>();

    positionedMarkers.forEach((marker) => {
      if (!phaseGroups.has(marker.code)) {
        phaseGroups.set(marker.code, {
          markers: [],
        });
      }

      phaseGroups.get(marker.code)!.markers.push(marker);
    });

    /* ====================================================
           TRACES
           ==================================================== */

    phaseGroups.forEach((group, code) => {
      const phaseConfig = phaseMap.get(code);

      if (!phaseConfig || group.markers.length === 0) {
        return;
      }

      const markers = [...group.markers].sort((a, b) => a.x - b.x);

      /*
       * customdata simples.
       *
       * Nada de objetos ou HTML.
       */
      const customdata = markers.map((marker) => [
        marker.name,
        marker.formula,
        marker.code,
        marker.peakY,
      ]);

      const markerSizes = markers.map((marker) => marker.finalSize);

      const markerOffsets = markers.map((marker) => marker.offset);

      /*
       * IMPORTANTE:
       *
       * O nome da trace NÃO recebe HTML.
       *
       * Isso elimina uma fonte de conflito
       * entre legenda e hover.
       */

      const plainLegendName =
        config.labelType === "formula"
          ? chemicalFormulaLegend(phaseConfig.formula) || phaseConfig.name
          : phaseConfig.name;

      traces.push({
        x: markers.map((marker) => marker.x),

        y: markers.map((marker) => marker.peakY + marker.offset),

        mode: "markers",

        type: "scatter",

        name: plainLegendName,

        marker: {
          symbol: phaseConfig.symbol,

          color: phaseConfig.color,

          size: markerSizes,

          opacity: 1,

          line: {
            color: phaseConfig.isMain ? CHART_TEXT : "#FFFFFF",

            width: phaseConfig.isMain ? 1.5 : 1,
          },
        },

        error_y: {
          type: "data",

          symmetric: false,

          array: markers.map(() => 0),

          arrayminus: markerOffsets,

          visible: config.showPeaks,

          color: phaseConfig.color,

          thickness: config.lines.peakConnectorThickness,

          width: 0,
        },

        customdata,

        /*
         * Tooltip totalmente independente
         * da legenda.
         */
        hovertemplate:
          "<b>%{customdata[0]}</b><br>" +
          "Fórmula: %{customdata[1]}<br>" +
          "Código: %{customdata[2]}<br>" +
          "2θ: %{x:.4f}°<br>" +
          "Intensidade: %{customdata[3]:.2f}" +
          "<extra></extra>",

        /*
         * Impede o Plotly de adicionar automaticamente
         * informações de trace.
         */
        hoverinfo: "none",

        hoverlabel: {
          bgcolor: "#FFFFFF",

          bordercolor: "#C9C5BC",

          font: {
            family: config.typography.fontFamily,

            size: 12,

            color: "#353638",
          },

          align: "left",

          namelength: -1,
        },

        showlegend: config.showLegend,
      });
    });

    return traces;
  }, [diffractogram, correlations, config, phaseMap, xRange, chartColors]);

  /* ==========================================================
     LAYOUT
     ========================================================== */

  const layout = useMemo<Partial<Layout>>(() => {
    const fontFamily = config.typography.fontFamily;

    return {
      autosize: true,

      height: 640,

      margin: {
        l: 92,
        r: 36,
        t: 72,
        b: 92,
      },

      paper_bgcolor: chartColors.paper,

      plot_bgcolor: chartColors.background,

      font: {
        family: fontFamily,

        color: chartColors.text,

        size: 13,
      },

      title: {
        text: config.typography.titleText,

        x: 0.5,

        xanchor: "center",

        y: 0.96,

        yanchor: "top",

        font: {
          family: fontFamily,

          size: config.typography.titleFontSize,

          color: chartColors.text,
        },
      },

      /* ====================================================
           X
           ==================================================== */

      xaxis: {
        ...(xRange
          ? {
              range: [xRange[0], xRange[1]],

              autorange: false,

              rangemode: "normal",
            }
          : {
              autorange: true,
            }),

        title: {
          text: config.typography.xAxisTitle,

          standoff: 18,

          font: {
            family: fontFamily,

            size: config.typography.xAxisTitleFontSize,

            color: chartColors.text,
          },
        },

        showgrid: config.showGrid,

        gridcolor: chartColors.grid,

        gridwidth: 1,

        zeroline: false,

        mirror: true,

        ticks: "outside",

        ticklen: 6,

        tickwidth: 1,

        linecolor: chartColors.axis,

        tickcolor: chartColors.axis,

        linewidth: 1.4,

        tickfont: {
          family: fontFamily,

          size: 12,

          color: chartColors.text,
        },

        automargin: true,

        exponentformat: "none",

        showexponent: "none",

        separatethousands: false,

        nticks: 12,
      },

      /* ====================================================
           Y
           ==================================================== */

      yaxis: {
        ...(yRange
          ? {
              range: [yRange[0], yRange[1]],

              autorange: false,
            }
          : {
              autorange: true,
            }),

        title: {
          text: config.typography.yAxisTitle,

          standoff: 18,

          font: {
            family: fontFamily,

            size: config.typography.yAxisTitleFontSize,

            color: chartColors.text,
          },
        },

        showgrid: config.showGrid,

        gridcolor: chartColors.grid,

        gridwidth: 1,

        zeroline: false,

        mirror: true,

        ticks: "outside",

        ticklen: 6,

        tickwidth: 1,

        linecolor: chartColors.axis,

        tickcolor: chartColors.axis,

        linewidth: 1.4,

        tickfont: {
          family: fontFamily,

          size: 12,

          color: chartColors.text,
        },

        automargin: true,

        tickformat: ".0f",

        exponentformat: "none",

        showexponent: "none",

        separatethousands: false,

        nticks: 10,
      },

      /* ====================================================
           LEGENDA
           ==================================================== */

      legend: {
        x: 0.995,

        y: 0.995,

        xanchor: "right",

        yanchor: "top",

        bgcolor: chartColors.legend,

        bordercolor: chartColors.border,

        borderwidth: 1,

        font: {
          family: fontFamily,

          size: config.typography.legendFontSize,

          color: chartColors.text,
        },

        orientation: "v",

        visible: config.showLegend,

        itemclick: "toggle",

        itemdoubleclick: "toggleothers",
      },

      /* ====================================================
           HOVER
           ==================================================== */

      hovermode: "closest",

      hoverdistance: 20,

      spikedistance: -1,

      hoverlabel: {
        bgcolor: CHART_HOVER,

        bordercolor: CHART_BORDER,

        font: {
          family: fontFamily,

          size: 12,

          color: CHART_TEXT,
        },

        align: "left",

        namelength: -1,
      },

      /* ====================================================
           ZOOM
           ==================================================== */

      dragmode: "zoom",
    };
  }, [config, chartColors, xRange, yRange]);

  /* ==========================================================
     CONFIG
     ========================================================== */

  const plotConfig = useMemo<Partial<Config>>(
    () => ({
      responsive: true,

      displaylogo: false,

      displayModeBar: false,

      scrollZoom: false,

      doubleClick: "reset",

      editable: false,

      staticPlot: false,

      modeBarButtonsToRemove: ["toImage", "lasso2d", "select2d", "autoScale2d"],
    }),
    [],
  );

  /* ==========================================================
     READY
     ========================================================== */

  const handlePlotReady = (graphDiv: HTMLElement) => {
    onPlotReady?.(graphDiv as PlotlyHTMLElement);
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className="
        flex
        min-w-0
        w-full
        flex-col

        overflow-visible

        rounded-md

        border
        border-border-subtle

        bg-surface

        shadow-sm
      "
    >
      <div
        className="
          min-h-160
          w-full
          min-w-0
          overflow-visible
          bg-surface
        "
      >
        <Plot
          data={data}
          layout={layout}
          useResizeHandler
          style={{
            width: "100%",

            height: "100%",

            minWidth: 0,
          }}
          config={plotConfig}
          onInitialized={(_figure, graphDiv) => {
            handlePlotReady(graphDiv);
          }}
          onUpdate={(_figure, graphDiv) => {
            handlePlotReady(graphDiv);
          }}
        />
      </div>
    </div>
  );
}

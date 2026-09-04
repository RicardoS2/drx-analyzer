"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

import { AppState, CorrelatedPhase } from "@/types";

import type { Config, Data, Layout } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="h-150 w-full flex items-center justify-center bg-white border border-[#C9C5BC] rounded-xl text-[#8C8478]">
      Carregando gráfico científico...
    </div>
  ),
});

const SYMBOLS: NonNullable<NonNullable<Data>[number]["marker"]>["symbol"][] = [
  "square",
  "triangle-up",
  "diamond",
  "cross",
  "x",
  "triangle-down",
  "pentagon",
  "hexagon",
  "circle-open",
];

const COLORS = [
  "#2563EB",
  "#059669",
  "#D97706",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#4B5563",
  "#9333EA",
];

const ARTICLE_COLORS = [
  "#222222",
  "#444444",
  "#666666",
  "#888888",
  "#555555",
  "#777777",
  "#999999",
];

interface Props {
  state: AppState;
}

interface PhaseGroup {
  x: number[];
  y: number[];
  drop: number[];
  peakY: number[];
  names: string[];
  formulas: string[];
  codes: string[];
}

interface PhaseCustomData {
  name: string;
  formula: string;
  code: string;
  peakY: number;
}

export default function DrxChart({ state }: Props) {
  const { diffractogram, correlations, mainPhaseCode, config } = state;

  const { articleMode, hideAxes, smoothLine, labelType } = config;

  const colors = {
    text: articleMode ? "#000000" : "#353638",
    grid: articleMode ? "#E5E5E5" : "#E8E6E1",
    axis: articleMode ? "#000000" : "#8C8478",
    bg: articleMode ? "#FFFFFF" : "#F8F7F4",
    paperBg: articleMode ? "#FFFFFF" : "#F8F7F4",
    legendBg: articleMode ? "rgba(255,255,255,0.97)" : "rgba(248,247,244,0.97)",
    tooltipBg: articleMode ? "#FFFFFF" : "#F8F7F4",
    tooltipBorder: articleMode ? "#000000" : "#C9C5BC",
  };

  const data = useMemo<Data[]>(() => {
    const traces: Data[] = [];

    /*
     * ============================================================
     * DIFRATOGRAMA PRINCIPAL
     * ============================================================
     */

    if (diffractogram.length > 0) {
      traces.push({
        x: diffractogram.map((point) => point.twoTheta),
        y: diffractogram.map((point) => point.intensity),
        type: "scattergl",
        mode: "lines",
        name: "DRX",
        line: {
          color: articleMode ? "#000000" : "#353638",
          width: config.curveThickness ?? 1.5,
          shape: smoothLine ? "spline" : "linear",
        },
        hovertemplate:
          "<b>Difratograma</b><br>" +
          "2θ: %{x:.3f}°<br>" +
          "Intensidade: %{y:.2f}" +
          "<extra></extra>",
        showlegend: config.showLegend,
      });
    }

    /*
     * ============================================================
     * MARCADORES DAS FASES
     * ============================================================
     */

    if (!config.showPhases || !correlations || correlations.length === 0) {
      return traces;
    }

    const phaseGroups = new Map<string, PhaseGroup>();

    const maxIntensity =
      diffractogram.length > 0
        ? Math.max(
            ...diffractogram.map((point) =>
              Number.isFinite(point.intensity) ? point.intensity : 0,
            ),
          )
        : 1000;

    const safeMaxIntensity =
      Number.isFinite(maxIntensity) && maxIntensity > 0 ? maxIntensity : 1000;

    /*
     * Pequeno deslocamento vertical somente para que os
     * marcadores não fiquem exatamente sobre a curva.
     */
    const yOffsetStep = safeMaxIntensity * 0.05;

    /*
     * ============================================================
     * ORGANIZA TODAS AS CORRELAÇÕES POR FASE
     * ============================================================
     */

    correlations.forEach((corr) => {
      if (!corr || !corr.phases) {
        return;
      }

      corr.phases.forEach((phase: CorrelatedPhase, index: number) => {
        if (!phase || !phase.code) {
          return;
        }

        if (!phaseGroups.has(phase.code)) {
          phaseGroups.set(phase.code, {
            x: [],
            y: [],
            drop: [],
            peakY: [],
            names: [],
            formulas: [],
            codes: [],
          });
        }

        const group = phaseGroups.get(phase.code);

        if (!group) {
          return;
        }

        const intensityReal = Number(corr.intensityReal);
        const twoThetaReal = Number(corr.twoThetaReal);

        if (!Number.isFinite(twoThetaReal) || !Number.isFinite(intensityReal)) {
          return;
        }

        const verticalDrop = yOffsetStep * (index + 1);

        group.x.push(twoThetaReal);
        group.y.push(intensityReal + verticalDrop);
        group.drop.push(verticalDrop);
        group.peakY.push(intensityReal);
        group.names.push(phase.name || phase.code);
        group.formulas.push(phase.formula || "");
        group.codes.push(phase.code);
      });
    });

    /*
     * ============================================================
     * DESENHA AS FASES
     * ============================================================
     */

    let colorIdx = 0;
    let symbolIdx = 0;

    phaseGroups.forEach((group, code) => {
      if (group.x.length === 0) {
        return;
      }

      const isMain = code === mainPhaseCode;

      /*
       * Fase principal:
       * - estrela
       * - maior
       * - preto no artigo
       *
       * Fases secundárias:
       * - símbolos diferentes
       * - cores diferentes
       */

      const color = isMain
        ? articleMode
          ? "#000000"
          : "#B91C1C"
        : articleMode
          ? ARTICLE_COLORS[colorIdx % ARTICLE_COLORS.length]
          : COLORS[colorIdx % COLORS.length];

      const symbol = isMain ? "star" : SYMBOLS[symbolIdx % SYMBOLS.length];

      const markerSize = config.markerSize ?? 8;
      const size = isMain ? markerSize + 4 : markerSize;

      const markerBorder = articleMode
        ? "#FFFFFF"
        : isMain
          ? "#353638"
          : "#F8F7F4";

      /*
       * Nome exibido na legenda.
       */

      const traceName =
        labelType === "formula" && group.formulas[0]
          ? group.formulas[0]
          : group.names[0];

      const customdata: PhaseCustomData[] = group.names.map((name, index) => ({
        name,
        formula: group.formulas[index],
        code: group.codes[index],
        peakY: group.peakY[index],
      }));

      traces.push({
        x: group.x,
        y: group.y,
        mode: "markers",
        type: "scatter",
        name: traceName,
        marker: {
          symbol,
          color,
          size,
          line: {
            color: markerBorder,
            width: 1.5,
          },
        },

        /*
         * Linha vertical ligando o marcador ao pico.
         */

        error_y: {
          type: "data",
          symmetric: false,
          array: group.drop.map(() => 0),
          arrayminus: group.drop,
          visible: true,
          color,
          thickness: isMain ? 1.5 : 1,
          width: 0,
        },

        customdata,

        hovertemplate:
          "<b>%{customdata.name}</b><br>" +
          "Fórmula: %{customdata.formula}<br>" +
          "Ref.: %{customdata.code}<br>" +
          "2θ: %{x:.3f}°<br>" +
          "Intensidade do pico: %{customdata.peakY:.2f}" +
          "<extra></extra>",

        showlegend: config.showLegend,
      });

      if (!isMain) {
        colorIdx++;
        symbolIdx++;
      }
    });

    return traces;
  }, [
    diffractogram,
    correlations,
    mainPhaseCode,
    config,
    articleMode,
    smoothLine,
    labelType,
  ]);

  /*
   * ============================================================
   * LAYOUT DO GRÁFICO
   * ============================================================
   */

  const layout: Partial<Layout> = {
    autosize: true,

    height: 600,

    margin: {
      l: hideAxes ? 40 : 80,
      r: 30,
      t: 40,
      b: hideAxes ? 40 : 70,
    },

    paper_bgcolor: colors.paperBg,
    plot_bgcolor: colors.bg,

    font: {
      family: "Arial, Helvetica, sans-serif",
      size: 13,
      color: colors.text,
    },

    /*
     * ==========================================================
     * EIXO X
     * ==========================================================
     */

    xaxis: {
      title: {
        text: hideAxes ? "" : "2θ (°)",
        font: {
          family: "Arial, Helvetica, sans-serif",
          size: 15,
        },
      },

      showgrid: config.showGrid,
      gridcolor: colors.grid,
      gridwidth: 1,

      zeroline: false,

      mirror: "ticks",
      ticklen: 6,
      ticks: "outside",

      showticklabels: !hideAxes,

      linecolor: colors.axis,
      tickcolor: colors.axis,
      linewidth: 1.5,

      tickfont: {
        family: "Arial, Helvetica, sans-serif",
        size: 12,
      },
    },

    yaxis: {
      title: {
        text: hideAxes ? "" : "Intensidade (counts)",
        font: {
          family: "Arial, Helvetica, sans-serif",
          size: 15,
        },
      },

      showgrid: config.showGrid,
      gridcolor: colors.grid,
      gridwidth: 1,

      zeroline: false,

      mirror: "ticks",
      ticklen: 6,
      ticks: "outside",

      showticklabels: !hideAxes,

      linecolor: colors.axis,
      tickcolor: colors.axis,
      linewidth: 1.5,

      tickfont: {
        family: "Arial, Helvetica, sans-serif",
        size: 12,
      },
    },

    /*
     * ==========================================================
     * LEGENDA
     * ==========================================================
     */

    legend: {
      x: 0.99,
      y: 0.99,
      xanchor: "right",
      yanchor: "top",

      bgcolor: colors.legendBg,

      bordercolor: colors.axis,
      borderwidth: 1,

      font: {
        family: "Arial, Helvetica, sans-serif",
        size: 12,
        color: colors.text,
      },
    },

    hovermode: "closest",

    /*
     * ==========================================================
     * TOOLTIP
     * ==========================================================
     */

    hoverlabel: {
      bgcolor: colors.tooltipBg,

      font: {
        family: "Arial, Helvetica, sans-serif",
        size: 12,
        color: colors.text,
      },

      bordercolor: colors.tooltipBorder,
    },

    /*
     * ==========================================================
     * ACESSIBILIDADE / INTERAÇÃO
     * ==========================================================
     */

    dragmode: "zoom",
  };

  /*
   * ============================================================
   * CONFIGURAÇÃO DO PLOTLY
   * ============================================================
   */

  const plotConfig: Partial<Config> = {
    responsive: true,
    displaylogo: false,

    /*
     * Exportação para figura científica.
     */

    toImageButtonOptions: {
      format: "png",
      filename: "difratograma_DRX_artigo",
      width: 1600,
      height: 1000,
      scale: 2,
    },

    modeBarButtonsToRemove: ["lasso2d", "select2d"],
  };

  /*
   * ============================================================
   * COMPONENTE
   * ============================================================
   */

  return (
    <div
      className="
        w-full
        rounded-xl
        overflow-hidden
        border
        border-[#C9C5BC]
        bg-[#F8F7F4]
        mb-8
        shadow-xs
      "
    >
      <Plot
        data={data}
        layout={layout}
        useResizeHandler={true}
        style={{
          width: "100%",
          height: "100%",
        }}
        config={plotConfig}
      />
    </div>
  );
}

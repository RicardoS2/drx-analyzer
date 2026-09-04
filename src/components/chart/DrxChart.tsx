"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { AppState, CorrelatedPhase } from "@/types";

import type { Config, Data, Layout, PlotlyHTMLElement } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="h-150 w-full flex items-center justify-center bg-white border border-[#C9C5BC] rounded-xl text-[#8C8478]">
      Carregando gráfico científico...
    </div>
  ),
});

/* ============================================================
   SÍMBOLOS DAS FASES
   ============================================================ */

const SYMBOLS: NonNullable<NonNullable<Data[number]["marker"]>["symbol"]>[] = [
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

/* ============================================================
   CORES DAS FASES
   ============================================================ */

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

/* ============================================================
   PROPS
   ============================================================ */

interface Props {
  state: AppState;
}

/* ============================================================
   GRUPO DE FASE
   ============================================================ */

interface PhaseGroup {
  x: number[];
  y: number[];
  drop: number[];
  peakY: number[];
  names: string[];
  formulas: string[];
  codes: string[];
}

/* ============================================================
   CUSTOM DATA
   ============================================================ */

interface PhaseCustomData {
  name: string;
  formula: string;
  code: string;
  peakY: number;
}

/* ============================================================
   PRESETS DE EXPORTAÇÃO
   ============================================================ */

interface ExportPreset {
  label: string;
  width: number;
  height: number;
}

const EXPORT_PRESETS: ExportPreset[] = [
  {
    label: "1200 × 800",
    width: 1200,
    height: 800,
  },
  {
    label: "1600 × 1000",
    width: 1600,
    height: 1000,
  },
  {
    label: "1800 × 1200",
    width: 1800,
    height: 1200,
  },
  {
    label: "2000 × 1200",
    width: 2000,
    height: 1200,
  },
];

const SCALE_OPTIONS = [1, 2, 3, 4];

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function DrxChart({ state }: Props) {
  const { diffractogram, correlations, mainPhaseCode, config } = state;

  const { articleMode, hideAxes, smoothLine, labelType } = config;

  /* ==========================================================
     ESTADOS DA EXPORTAÇÃO
     ========================================================== */

  const [exportWidth, setExportWidth] = useState<number>(2000);

  const [exportHeight, setExportHeight] = useState<number>(1200);

  const [exportScale, setExportScale] = useState<number>(2);

  const [exporting, setExporting] = useState<boolean>(false);

  const [plotElement, setPlotElement] = useState<PlotlyHTMLElement | null>(
    null,
  );

  /* ==========================================================
     CORES
     ========================================================== */

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

  /* ==========================================================
     DADOS DO GRÁFICO
     ========================================================== */

  const data = useMemo<Data[]>(() => {
    const traces: Data[] = [];

    /* ========================================================
       DIFRATOGRAMA
       ======================================================== */

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

    /* ========================================================
       FASES
       ======================================================== */

    if (!config.showPhases || !correlations || correlations.length === 0) {
      return traces;
    }

    const phaseGroups = new Map<string, PhaseGroup>();

    /* ========================================================
       INTENSIDADE MÁXIMA
       ======================================================== */

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

    const yOffsetStep = safeMaxIntensity * 0.05;

    /* ========================================================
       CORRELAÇÕES

       IMPORTANTE:
       TODAS as ocorrências são preservadas.
       Não existe slice().
       Não existe limite artificial.
       ======================================================== */

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

    /* ========================================================
       DESENHO DAS FASES
       ======================================================== */

    let colorIdx = 0;

    let symbolIdx = 0;

    phaseGroups.forEach((group, code) => {
      if (group.x.length === 0) {
        return;
      }

      const isMain = code === mainPhaseCode;

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

      /* ======================================================
           TRACE DOS MARCADORES
           ====================================================== */

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

        /* ====================================================
             LINHA VERTICAL DO MARCADOR ATÉ O PICO
             ==================================================== */

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

  /* ==========================================================
     LAYOUT
     ========================================================== */

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

    /* ========================================================
       EIXO X
       ======================================================== */

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

    /* ========================================================
       EIXO Y
       ======================================================== */

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

    /* ========================================================
       LEGENDA
       ======================================================== */

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

    /* ========================================================
       TOOLTIP
       ======================================================== */

    hoverlabel: {
      bgcolor: colors.tooltipBg,

      font: {
        family: "Arial, Helvetica, sans-serif",

        size: 12,

        color: colors.text,
      },

      bordercolor: colors.tooltipBorder,
    },

    /* ========================================================
       INTERAÇÃO
       ======================================================== */

    dragmode: "zoom",
  };

  /* ==========================================================
     CONFIGURAÇÃO PLOTLY
     ========================================================== */

  const plotConfig: Partial<Config> = {
    responsive: true,

    displaylogo: false,

    /*
     * Esconde completamente a barra nativa.
     */

    displayModeBar: false,

    modeBarButtonsToRemove: ["toImage", "lasso2d", "select2d"],
  };

  /* ==========================================================
     PRESET
     ========================================================== */

  const applyPreset = (preset: ExportPreset) => {
    setExportWidth(preset.width);

    setExportHeight(preset.height);
  };

  /* ==========================================================
     EXPORTAÇÃO
     ========================================================== */

  const exportImage = async (format: "png" | "svg") => {
    if (!plotElement) {
      window.alert("O gráfico ainda não está pronto para exportação.");

      return;
    }

    const width = Math.max(300, Number(exportWidth) || 2000);

    const height = Math.max(200, Number(exportHeight) || 1200);

    const scale = Math.max(1, Number(exportScale) || 1);

    setExporting(true);

    try {
      const PlotlyModule = await import("plotly.js-dist-min");

      const Plotly = PlotlyModule.default || PlotlyModule;

      await Plotly.downloadImage(plotElement, {
        format,

        filename: `difratograma_DRX_${width}x${height}`,

        width,

        height,

        scale,
      });
    } catch (error) {
      console.error("Erro ao exportar gráfico:", error);

      window.alert("Erro ao exportar o gráfico.");
    } finally {
      setExporting(false);
    }
  };

  /* ==========================================================
     RENDER
     ========================================================== */

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
      {/* ======================================================
          GRÁFICO
          ====================================================== */}

      <Plot
        data={data}
        layout={layout}
        useResizeHandler={true}
        style={{
          width: "100%",
          height: "100%",
        }}
        config={plotConfig}
        onInitialized={(_figure, graphDiv) => {
          setPlotElement(graphDiv as PlotlyHTMLElement);
        }}
        onUpdate={(_figure, graphDiv) => {
          setPlotElement(graphDiv as PlotlyHTMLElement);
        }}
      />

      {/* ======================================================
          PAINEL DE EXPORTAÇÃO
          ====================================================== */}

      <div
        className="
          border-t
          border-[#C9C5BC]
          bg-[#E8E6E1]
          px-5
          py-4
        "
      >
        <div
          className="
            flex
            flex-col
            xl:flex-row
            xl:items-end
            gap-5
          "
        >
          {/* ==================================================
              PRESETS
              ================================================== */}

          <div className="flex-1">
            <label
              className="
                block
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#8C8478]
                mb-2
              "
            >
              Tamanho da figura
            </label>

            <div className="flex flex-wrap gap-2">
              {EXPORT_PRESETS.map((preset) => {
                const selected =
                  exportWidth === preset.width &&
                  exportHeight === preset.height;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`
                        px-3
                        py-2
                        rounded-lg
                        border
                        text-xs
                        font-semibold
                        transition-colors
                        ${
                          selected
                            ? "bg-[#353638] text-white border-[#353638]"
                            : "bg-[#F8F7F4] text-[#353638] border-[#C9C5BC] hover:bg-white"
                        }
                      `}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================================================
              LARGURA
              ================================================== */}

          <div className="w-full xl:w-32">
            <label
              htmlFor="export-width"
              className="
                block
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#8C8478]
                mb-2
              "
            >
              Largura (px)
            </label>

            <input
              id="export-width"
              type="number"
              min={300}
              max={10000}
              step={100}
              value={exportWidth}
              onChange={(event) => setExportWidth(Number(event.target.value))}
              className="
                w-full
                px-3
                py-2
                rounded-lg
                border
                border-[#C9C5BC]
                bg-[#F8F7F4]
                text-[#353638]
                text-sm
                font-medium
                outline-none
                focus:border-[#8C8478]
              "
            />
          </div>

          {/* ==================================================
              ALTURA
              ================================================== */}

          <div className="w-full xl:w-32">
            <label
              htmlFor="export-height"
              className="
                block
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#8C8478]
                mb-2
              "
            >
              Altura (px)
            </label>

            <input
              id="export-height"
              type="number"
              min={200}
              max={10000}
              step={100}
              value={exportHeight}
              onChange={(event) => setExportHeight(Number(event.target.value))}
              className="
                w-full
                px-3
                py-2
                rounded-lg
                border
                border-[#C9C5BC]
                bg-[#F8F7F4]
                text-[#353638]
                text-sm
                font-medium
                outline-none
                focus:border-[#8C8478]
              "
            />
          </div>

          {/* ==================================================
              ESCALA
              ================================================== */}

          <div className="w-full xl:w-32">
            <label
              htmlFor="export-scale"
              className="
                block
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#8C8478]
                mb-2
              "
            >
              Escala
            </label>

            <select
              id="export-scale"
              value={exportScale}
              onChange={(event) => setExportScale(Number(event.target.value))}
              className="
                w-full
                px-3
                py-2
                rounded-lg
                border
                border-[#C9C5BC]
                bg-[#F8F7F4]
                text-[#353638]
                text-sm
                font-medium
                outline-none
                focus:border-[#8C8478]
              "
            >
              {SCALE_OPTIONS.map((scale) => (
                <option key={scale} value={scale}>
                  {scale}×
                </option>
              ))}
            </select>
          </div>

          {/* ==================================================
              BOTÕES
              ================================================== */}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={exporting}
              onClick={() => exportImage("png")}
              className="
                px-4
                py-2
                rounded-lg
                border
                border-[#353638]
                bg-[#353638]
                text-white
                text-sm
                font-semibold
                hover:bg-[#4A4B4D]
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition-colors
              "
            >
              {exporting ? "Exportando..." : "PNG"}
            </button>

            <button
              type="button"
              disabled={exporting}
              onClick={() => exportImage("svg")}
              className="
                px-4
                py-2
                rounded-lg
                border
                border-[#C9C5BC]
                bg-[#F8F7F4]
                text-[#353638]
                text-sm
                font-semibold
                hover:bg-white
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition-colors
              "
            >
              {exporting ? "..." : "SVG"}
            </button>
          </div>
        </div>

        {/* ====================================================
            INFORMAÇÃO
            ==================================================== */}

        <div
          className="
            mt-3
            pt-3
            border-t
            border-[#C9C5BC]
            text-xs
            text-[#8C8478]
          "
        >
          Exportação atual:{" "}
          <strong className="text-[#353638]">
            {exportWidth} × {exportHeight} px
          </strong>{" "}
          · escala <strong className="text-[#353638]">{exportScale}×</strong>
          {exportWidth === 2000 && exportHeight === 1200 && (
            <span className="ml-2">· recomendado para artigo científico</span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { AppState, CorrelatedPhase } from "@/types";

import type { Config, Data, Layout, PlotlyHTMLElement } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="min-h-100 w-full flex items-center justify-center bg-white border border-[#C9C5BC] rounded-xl text-[#8C8478]">
      Carregando gráfico científico...
    </div>
  ),
});

/* =========================================================
   SÍMBOLOS DISPONÍVEIS
   ========================================================= */

const SYMBOLS: string[] = [
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

  "hourglass",
  "bowtie",
];

/* =========================================================
   NOMES DOS SÍMBOLOS
   ========================================================= */

const SYMBOL_LABELS: Record<string, string> = {
  circle: "Círculo",
  "circle-open": "Círculo aberto",

  square: "Quadrado",
  "square-open": "Quadrado aberto",

  diamond: "Losango",
  "diamond-open": "Losango aberto",

  "triangle-up": "Triângulo ↑",
  "triangle-up-open": "Triângulo ↑ aberto",

  "triangle-down": "Triângulo ↓",
  "triangle-down-open": "Triângulo ↓ aberto",

  "triangle-left": "Triângulo ←",
  "triangle-left-open": "Triângulo ← aberto",

  "triangle-right": "Triângulo →",
  "triangle-right-open": "Triângulo → aberto",

  pentagon: "Pentágono",
  "pentagon-open": "Pentágono aberto",

  hexagon: "Hexágono",
  "hexagon-open": "Hexágono aberto",

  hexagram: "Hexagrama",
  "hexagram-open": "Hexagrama aberto",

  star: "Estrela",
  "star-open": "Estrela aberta",

  cross: "Cruz",
  x: "X",

  hourglass: "Ampulheta",
  bowtie: "Ampulheta dupla",
};

/* =========================================================
   PALETA DAS FASES
   NÃO CONTÉM AZUL
   ========================================================= */

const COLORS = [
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

/* =========================================================
   CORES DO MODO ARTIGO
   ========================================================= */

const ARTICLE_COLORS = [
  "#222222",
  "#444444",
  "#666666",
  "#888888",
  "#555555",
  "#777777",
  "#999999",
  "#333333",
  "#111111",
  "#707070",
];

/* =========================================================
   TIPOS
   ========================================================= */

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

interface ExportPreset {
  label: string;
  width: number;
  height: number;
}

interface PhaseControl {
  code: string;
  name: string;
  formula: string;
  isMain: boolean;
  defaultSymbol: string;
  defaultColor: string;
}

/* =========================================================
   EXPORTAÇÃO
   ========================================================= */

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

/* =========================================================
   COMPONENTE
   ========================================================= */

export default function DrxChart({ state }: Props) {
  const { diffractogram, correlations, mainPhaseCode, config } = state;

  const { articleMode, hideAxes, smoothLine, labelType } = config;

  /* =======================================================
     ESTADOS
     ======================================================= */

  const [exportWidth, setExportWidth] = useState<number>(2000);

  const [exportHeight, setExportHeight] = useState<number>(1200);

  const [exportScale, setExportScale] = useState<number>(2);

  const [exporting, setExporting] = useState<boolean>(false);

  const [plotElement, setPlotElement] = useState<PlotlyHTMLElement | null>(
    null,
  );

  const [customSymbols, setCustomSymbols] = useState<Record<string, string>>(
    {},
  );

  const [customColors, setCustomColors] = useState<Record<string, string>>({});

  /* =======================================================
     CORES DO GRÁFICO
     ======================================================= */

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

  /* =======================================================
     FASES DISPONÍVEIS
     ======================================================= */

  const phaseControls = useMemo<PhaseControl[]>(() => {
    if (!correlations || correlations.length === 0) {
      return [];
    }

    const map = new Map<string, PhaseControl>();

    let colorIdx = 0;
    let symbolIdx = 0;

    correlations.forEach((corr) => {
      if (!corr || !corr.phases) {
        return;
      }

      corr.phases.forEach((phase: CorrelatedPhase) => {
        if (!phase || !phase.code || map.has(phase.code)) {
          return;
        }

        const isMain = phase.code === mainPhaseCode;

        const defaultSymbol = isMain
          ? "star"
          : SYMBOLS[symbolIdx % SYMBOLS.length];

        const defaultColor = isMain
          ? articleMode
            ? "#000000"
            : "#B91C1C"
          : articleMode
            ? ARTICLE_COLORS[colorIdx % ARTICLE_COLORS.length]
            : COLORS[colorIdx % COLORS.length];

        map.set(phase.code, {
          code: phase.code,
          name: phase.name || phase.code,
          formula: phase.formula || "",
          isMain,
          defaultSymbol,
          defaultColor,
        });

        if (!isMain) {
          colorIdx++;
          symbolIdx++;
        }
      });
    });

    return Array.from(map.values());
  }, [correlations, mainPhaseCode, articleMode]);

  /* =======================================================
     DADOS DO GRÁFICO

     IMPORTANTE:
     customSymbols e customColors são dependências
     diretas do useMemo.

     Isso elimina o warning:
     "missing dependencies getPhaseColor/getPhaseSymbol"
     ======================================================= */

  const data = useMemo<Data[]>(() => {
    const traces: Data[] = [];

    /* =====================================================
       CURVA DRX
       ===================================================== */

    if (diffractogram.length > 0) {
      traces.push({
        x: diffractogram.map((point) => point.twoTheta),

        y: diffractogram.map((point) => point.intensity),

        type: "scattergl",

        mode: "lines",

        name: "DRX",

        line: {
          color: articleMode ? "#000000" : "#2563EB",

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

    /* =====================================================
       VERIFICAÇÃO DAS FASES
       ===================================================== */

    if (!config.showPhases || !correlations || correlations.length === 0) {
      return traces;
    }

    /* =====================================================
       AGRUPAMENTO
       ===================================================== */

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

    const yOffsetStep = safeMaxIntensity * 0.05;

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

    /* =====================================================
       TRACES DAS FASES
       ===================================================== */

    phaseGroups.forEach((group, code) => {
      if (group.x.length === 0) {
        return;
      }

      const phase = phaseControls.find((item) => item.code === code);

      const isMain = code === mainPhaseCode;

      /*
       * COR PERSONALIZADA
       *
       * Sem função externa.
       * Isso resolve o exhaustive-deps.
       */

      const color =
        customColors[code] ??
        phase?.defaultColor ??
        (isMain
          ? articleMode
            ? "#000000"
            : "#B91C1C"
          : articleMode
            ? "#555555"
            : "#059669");

      /*
       * SÍMBOLO PERSONALIZADO
       */

      const symbol =
        customSymbols[code] ??
        phase?.defaultSymbol ??
        (isMain ? "star" : "circle");

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
    phaseControls,
    customSymbols,
    customColors,
  ]);

  /* =======================================================
     LAYOUT RESPONSIVO DO PLOTLY
     ======================================================= */

  const layout: Partial<Layout> = {
    autosize: true,

    /*
     * Altura menor para telas pequenas.
     * O CSS do container controla a largura.
     */

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

      automargin: true,
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

      automargin: true,
    },

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

      orientation: "v",
    },

    hovermode: "closest",

    hoverlabel: {
      bgcolor: colors.tooltipBg,

      font: {
        family: "Arial, Helvetica, sans-serif",

        size: 12,

        color: colors.text,
      },

      bordercolor: colors.tooltipBorder,
    },

    dragmode: "zoom",
  };

  /* =======================================================
     CONFIG DO PLOTLY
     ======================================================= */

  const plotConfig: Partial<Config> = {
    responsive: true,

    displaylogo: false,

    displayModeBar: false,

    modeBarButtonsToRemove: ["toImage", "lasso2d", "select2d"],
  };

  /* =======================================================
     EXPORTAÇÃO
     ======================================================= */

  const applyPreset = (preset: ExportPreset) => {
    setExportWidth(preset.width);

    setExportHeight(preset.height);
  };

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

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className="
        w-full
        max-w-full
        min-w-0
        overflow-hidden
        rounded-xl
        border
        border-[#C9C5BC]
        bg-[#F8F7F4]
        mb-8
        shadow-xs
      "
    >
      {/* =================================================
          GRÁFICO
          ================================================= */}

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
          useResizeHandler={true}
          style={{
            width: "100%",
            height: "100%",
            minWidth: 0,
          }}
          config={plotConfig}
          onInitialized={(_figure, graphDiv) => {
            setPlotElement(graphDiv as PlotlyHTMLElement);
          }}
          onUpdate={(_figure, graphDiv) => {
            setPlotElement(graphDiv as PlotlyHTMLElement);
          }}
        />
      </div>

      {/* =================================================
          PERSONALIZAÇÃO DAS FASES
          ================================================= */}

      {config.showPhases && phaseControls.length > 0 && (
        <div
          className="
              w-full
              min-w-0
              border-t
              border-[#C9C5BC]
              bg-[#F8F7F4]
              px-3
              py-4
              sm:px-5
              sm:py-5
            "
        >
          {/* CABEÇALHO */}

          <div
            className="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
                mb-4
              "
          >
            <div className="min-w-0">
              <h3
                className="
                    text-sm
                    sm:text-base
                    font-bold
                    text-[#353638]
                  "
              >
                Personalização das fases
              </h3>

              <p
                className="
                    text-xs
                    sm:text-sm
                    text-[#8C8478]
                    mt-1
                    leading-relaxed
                  "
              >
                Altere o símbolo e a cor de cada fase diretamente no gráfico.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCustomSymbols({});
                setCustomColors({});
              }}
              className="
                  w-full
                  sm:w-auto
                  shrink-0
                  px-3
                  py-2
                  rounded-lg
                  border
                  border-[#C9C5BC]
                  bg-white
                  text-[#353638]
                  text-xs
                  sm:text-sm
                  font-semibold
                  hover:bg-[#E8E6E1]
                  transition-colors
                "
            >
              Restaurar padrões
            </button>
          </div>

          {/* FASES */}

          <div
            className="
                grid
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-3
                gap-3
                sm:gap-4
              "
          >
            {phaseControls.map((phase) => {
              const currentSymbol =
                customSymbols[phase.code] ?? phase.defaultSymbol;

              const currentColor =
                customColors[phase.code] ?? phase.defaultColor;

              return (
                <div
                  key={phase.code}
                  className="
                        min-w-0
                        rounded-xl
                        border
                        border-[#C9C5BC]
                        bg-white
                        p-3
                        sm:p-4
                      "
                >
                  {/* ---------------------------------
                          CABEÇALHO DA FASE
                          --------------------------------- */}

                  <div
                    className="
                          flex
                          items-start
                          gap-3
                          mb-3
                        "
                  >
                    <div
                      className="
                            flex-1
                            min-w-0
                          "
                    >
                      <div
                        className="
                              flex
                              flex-wrap
                              items-center
                              gap-2
                            "
                      >
                        <span
                          className="
                                text-sm
                                font-bold
                                text-[#353638]
                              "
                        >
                          {phase.name}
                        </span>

                        {phase.isMain && (
                          <span
                            className="
                                  shrink-0
                                  px-2
                                  py-0.5
                                  rounded-full
                                  bg-[#FEE2E2]
                                  text-[#991B1B]
                                  text-[9px]
                                  sm:text-[10px]
                                  font-bold
                                  uppercase
                                "
                          >
                            Principal
                          </span>
                        )}
                      </div>

                      <div
                        className="
                              text-[10px]
                              sm:text-[11px]
                              text-[#8C8478]
                              mt-1
                              break-all
                            "
                      >
                        {phase.formula || "Sem fórmula"}
                        {" · "}
                        {phase.code}
                      </div>
                    </div>

                    {/* PRÉVIA */}

                    <div
                      className="
                            w-9
                            h-9
                            sm:w-10
                            sm:h-10
                            shrink-0
                            rounded-lg
                            border
                            border-[#C9C5BC]
                            bg-[#F8F7F4]
                            flex
                            items-center
                            justify-center
                          "
                    >
                      <span
                        className="
                              text-lg
                              font-bold
                            "
                        style={{
                          color: currentColor,
                        }}
                      >
                        {currentSymbol === "circle"
                          ? "●"
                          : currentSymbol === "circle-open"
                            ? "○"
                            : currentSymbol === "square"
                              ? "■"
                              : currentSymbol === "square-open"
                                ? "□"
                                : currentSymbol === "diamond"
                                  ? "◆"
                                  : currentSymbol === "diamond-open"
                                    ? "◇"
                                    : currentSymbol === "triangle-up"
                                      ? "▲"
                                      : currentSymbol === "triangle-down"
                                        ? "▼"
                                        : currentSymbol === "triangle-left"
                                          ? "◀"
                                          : currentSymbol === "triangle-right"
                                            ? "▶"
                                            : currentSymbol === "star"
                                              ? "★"
                                              : currentSymbol === "star-open"
                                                ? "☆"
                                                : currentSymbol === "cross"
                                                  ? "+"
                                                  : currentSymbol === "x"
                                                    ? "×"
                                                    : "◆"}
                      </span>
                    </div>
                  </div>

                  {/* ---------------------------------
                          CONTROLES
                          --------------------------------- */}

                  <div
                    className="
                          grid
                          grid-cols-1
                          sm:grid-cols-[minmax(0,1fr)_auto]
                          gap-3
                        "
                  >
                    {/* SÍMBOLO */}

                    <div
                      className="
                            min-w-0
                          "
                    >
                      <label
                        htmlFor={`symbol-${phase.code}`}
                        className="
                              block
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-wider
                              text-[#8C8478]
                              mb-1.5
                            "
                      >
                        Símbolo
                      </label>

                      <select
                        id={`symbol-${phase.code}`}
                        value={currentSymbol}
                        onChange={(event) => {
                          setCustomSymbols((previous) => ({
                            ...previous,
                            [phase.code]: event.target.value,
                          }));
                        }}
                        className="
                              w-full
                              min-w-0
                              px-3
                              py-2
                              rounded-lg
                              border
                              border-[#C9C5BC]
                              bg-[#F8F7F4]
                              text-[#353638]
                              text-xs
                              sm:text-sm
                              font-medium
                              outline-none
                              focus:border-[#8C8478]
                            "
                      >
                        {SYMBOLS.map((symbol) => (
                          <option key={symbol} value={symbol}>
                            {SYMBOL_LABELS[symbol]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* COR */}

                    <div
                      className="
                            sm:w-16
                          "
                    >
                      <label
                        htmlFor={`color-${phase.code}`}
                        className="
                              block
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-wider
                              text-[#8C8478]
                              mb-1.5
                            "
                      >
                        Cor
                      </label>

                      <input
                        id={`color-${phase.code}`}
                        type="color"
                        value={currentColor}
                        disabled={articleMode}
                        onChange={(event) => {
                          setCustomColors((previous) => ({
                            ...previous,
                            [phase.code]: event.target.value,
                          }));
                        }}
                        className="
                              h-9.5
                              w-16
                              max-w-full
                              p-1
                              rounded-lg
                              border
                              border-[#C9C5BC]
                              bg-[#F8F7F4]
                              cursor-pointer
                              disabled:opacity-50
                              disabled:cursor-not-allowed
                            "
                        title={
                          articleMode
                            ? "As cores das fases são controladas pelo modo artigo"
                            : "Escolher cor"
                        }
                      />
                    </div>
                  </div>

                  {/* MODO ARTIGO */}

                  {articleMode && (
                    <p
                      className="
                            mt-2
                            text-[10px]
                            leading-relaxed
                            text-[#8C8478]
                          "
                    >
                      No modo artigo, a escala de cinza é mantida para preservar
                      o padrão visual científico.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================
          EXPORTAÇÃO
          ================================================= */}

      <div
        className="
          w-full
          min-w-0
          border-t
          border-[#C9C5BC]
          bg-[#E8E6E1]
          px-3
          py-4
          sm:px-5
          sm:py-5
        "
      >
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem_auto]
            gap-4
            items-end
          "
        >
          {/* PRESETS */}

          <div
            className="
              min-w-0
              sm:col-span-2
              xl:col-span-1
            "
          >
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

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
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
                        whitespace-nowrap
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

          {/* LARGURA */}

          <div
            className="
              min-w-0
            "
          >
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
                min-w-0
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

          {/* ALTURA */}

          <div
            className="
              min-w-0
            "
          >
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
                min-w-0
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

          {/* ESCALA */}

          <div
            className="
              min-w-0
            "
          >
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
                min-w-0
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

          {/* BOTÕES */}

          <div
            className="
              flex
              flex-wrap
              gap-2
              sm:col-span-2
              xl:col-span-1
            "
          >
            <button
              type="button"
              disabled={exporting}
              onClick={() => exportImage("png")}
              className="
                flex-1
                sm:flex-none
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
                flex-1
                sm:flex-none
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

        {/* =================================================
            INFORMAÇÃO DA EXPORTAÇÃO
            ================================================= */}

        <div
          className="
            mt-4
            pt-3
            border-t
            border-[#C9C5BC]
            text-xs
            leading-relaxed
            text-[#8C8478]
          "
        >
          Exportação atual:{" "}
          <strong
            className="
              text-[#353638]
            "
          >
            {exportWidth} × {exportHeight} px
          </strong>
          {" · "}escala{" "}
          <strong
            className="
              text-[#353638]
            "
          >
            {exportScale}×
          </strong>
          {exportWidth === 2000 && exportHeight === 1200 && (
            <span className="block sm:inline sm:ml-2">
              · recomendado para artigo científico
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

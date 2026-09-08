"use client";

import { useMemo, useState } from "react";

import {
  Analytics,
  ChartRelationship,
  Reset,
  TreeView,
  WarningAlt,
  Tree,
} from "@carbon/icons-react";

import type { PlotlyHTMLElement } from "plotly.js";

import type { AppState, ConfigState, PhaseStyleConfig } from "@/types";

import DrxChart from "@/components/chart/DrxChart";
import PhaseCustom from "@/components/PhaseCustom/PhaseCustom";
import DataTables from "@/components/tables/DataTables";
import LeafButton from "@/components/Leaf/LeafButton";

import { parseDiffractogram, parsePeakList, parsePhaseList } from "@/lib/parsers";

import { correlateData } from "@/lib/correlator";

/* ============================================================
   ESTADO INICIAL
   ============================================================ */

const INITIAL_STATE: AppState = {
  diffractogram: [],
  peaks: [],
  phases: [],
  correlations: [],
  mainPhaseCode: null,

  config: {
    tolerance: 0.15,

    background: "white",

    typography: {
      fontFamily: "Arial",
      legendFontSize: 12,
      titleFontSize: 18,
      xAxisTitleFontSize: 14,
      yAxisTitleFontSize: 14,
      titleText: "Difratograma de Raios X",
      xAxisTitle: "2θ (°)",
      yAxisTitle: "Intensidade (u.a.)",
    },

    lines: {
      curveThickness: 1.35,
      peakConnectorThickness: 1,
      peakHeight: 60,
    },

    labels: {
      phasesSectionTitle: "Fases Identificadas",
      phase: "Fase",
      formula: "Fórmula",
      referenceCode: "Código",
      score: "Score",
      correlatedPeaks: "Picos Correlacionados",
      exportCsv: "Exportar CSV",
      csvFileName: "drx_correlacoes.csv",
      mainPhaseTooltip: "Fase principal",
    },

    showGrid: true,
    showLegend: true,
    showPeaks: true,
    showPhases: true,
    labelType: "name",
  } satisfies ConfigState,

  filesLoaded: {
    drx: false,
    peak: false,
    phase: false,
  },

  error: null,
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function DRXAnalyzer() {
  /* ==========================================================
     ESTADO
     ========================================================== */

  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const [plotElement, setPlotElement] = useState<PlotlyHTMLElement | null>(null);

  const [phaseVisibility, setPhaseVisibility] = useState<Record<string, boolean>>({});

  const [phaseStyles, setPhaseStyles] = useState<Record<string, PhaseStyleConfig>>({});

  /* ==========================================================
     CORRELAÇÃO
     ========================================================== */

  const correlationResult = useMemo(() => {
    if (state.diffractogram.length === 0 || state.peaks.length === 0 || state.phases.length === 0) {
      return {
        correlations: [],
        mainPhaseCode: null,
      };
    }

    try {
      return correlateData(state.diffractogram, state.peaks, state.phases);
    } catch (error) {
      console.error("Erro ao correlacionar os dados:", error);

      return {
        correlations: [],
        mainPhaseCode: null,
      };
    }
  }, [state.diffractogram, state.peaks, state.phases]);

  const correlations = correlationResult.correlations;

  const mainPhaseCode = correlationResult.mainPhaseCode ?? null;

  /* ==========================================================
     ESTADO DERIVADO
     ========================================================== */

  const derivedState = useMemo<AppState>(
    () => ({
      ...state,
      correlations,
      mainPhaseCode,
    }),
    [state, correlations, mainPhaseCode],
  );

  /* ==========================================================
     IMPORTAÇÃO
     ========================================================== */

  const handleFileUpload = async (type: "drx" | "peak" | "phase", file: File) => {
    try {
      setState((previous) => ({
        ...previous,
        error: null,
      }));

      if (type === "drx") {
        const data = await parseDiffractogram(file);

        setState((previous) => ({
          ...previous,

          diffractogram: data,

          filesLoaded: {
            ...previous.filesLoaded,
            drx: true,
          },

          error: null,
        }));

        return;
      }

      if (type === "peak") {
        const data = await parsePeakList(file);

        setState((previous) => ({
          ...previous,

          peaks: data,

          filesLoaded: {
            ...previous.filesLoaded,
            peak: true,
          },

          error: null,
        }));

        return;
      }

      const data = await parsePhaseList(file);

      setState((previous) => ({
        ...previous,

        phases: data,

        filesLoaded: {
          ...previous.filesLoaded,
          phase: true,
        },

        error: null,
      }));

      setPhaseVisibility(Object.fromEntries(data.map((phase) => [phase.code, true])));

      setPhaseStyles({});
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao ler o arquivo.";

      setState((previous) => ({
        ...previous,
        error: message,
      }));
    }
  };

  /* ==========================================================
     CONFIGURAÇÕES
     ========================================================== */

  const handleConfigChange = (newConfig: Partial<ConfigState>) => {
    setState((previous) => ({
      ...previous,

      config: {
        ...previous.config,

        ...newConfig,

        typography: newConfig.typography
          ? {
              ...previous.config.typography,
              ...newConfig.typography,
            }
          : previous.config.typography,

        lines: newConfig.lines
          ? {
              ...previous.config.lines,
              ...newConfig.lines,
            }
          : previous.config.lines,

        labels: newConfig.labels
          ? {
              ...previous.config.labels,
              ...newConfig.labels,
            }
          : previous.config.labels,
      },
    }));
  };

  /* ==========================================================
     VISIBILIDADE DAS FASES
     ========================================================== */

  const handlePhaseVisibilityChange = (phaseCode: string, enabled: boolean) => {
    setPhaseVisibility((previous) => ({
      ...previous,
      [phaseCode]: enabled,
    }));
  };

  /* ==========================================================
     ESTILO DAS FASES
     ========================================================== */

  const handlePhaseStyleChange = (phaseCode: string, changes: Partial<PhaseStyleConfig>) => {
    setPhaseStyles((previous) => {
      const current = previous[phaseCode] ?? {};

      const next: PhaseStyleConfig = {
        ...current,
      };

      if (Object.prototype.hasOwnProperty.call(changes, "symbol")) {
        if (changes.symbol === undefined) {
          delete next.symbol;
        } else {
          next.symbol = changes.symbol;
        }
      }

      if (Object.prototype.hasOwnProperty.call(changes, "color")) {
        if (changes.color === undefined) {
          delete next.color;
        } else {
          next.color = changes.color;
        }
      }

      if (Object.prototype.hasOwnProperty.call(changes, "symbolSize")) {
        if (changes.symbolSize === undefined) {
          delete next.symbolSize;
        } else {
          next.symbolSize = changes.symbolSize;
        }
      }

      if (Object.prototype.hasOwnProperty.call(changes, "symbolHeight")) {
        if (changes.symbolHeight === undefined) {
          delete next.symbolHeight;
        } else {
          next.symbolHeight = changes.symbolHeight;
        }
      }

      if (Object.keys(next).length === 0) {
        const result = {
          ...previous,
        };

        delete result[phaseCode];

        return result;
      }

      return {
        ...previous,
        [phaseCode]: next,
      };
    });
  };

  /* ==========================================================
     RESET DAS FASES
     ========================================================== */

  const handleResetPhaseControls = () => {
    const visibility: Record<string, boolean> = {};

    state.phases.forEach((phase) => {
      visibility[phase.code] = true;
    });

    setPhaseVisibility(visibility);

    setPhaseStyles({});
  };

  /* ==========================================================
     ATUALIZA FASE
     ========================================================== */

  const handlePhaseUpdate = (
    phaseCode: string,
    changes: {
      name?: string;
      formula?: string;
    },
  ) => {
    setState((previous) => ({
      ...previous,

      phases: previous.phases.map((phase) =>
        phase.code === phaseCode
          ? {
              ...phase,
              ...changes,
            }
          : phase,
      ),
    }));
  };

  /* ==========================================================
     RESET COMPLETO
     ========================================================== */

  const handleResetProject = () => {
    setState({
      ...INITIAL_STATE,

      config: {
        ...INITIAL_STATE.config,

        typography: {
          ...INITIAL_STATE.config.typography,
        },

        lines: {
          ...INITIAL_STATE.config.lines,
        },

        labels: {
          ...INITIAL_STATE.config.labels,
        },
      },

      filesLoaded: {
        ...INITIAL_STATE.filesLoaded,
      },
    });

    setPhaseVisibility({});

    setPhaseStyles({});

    setPlotElement(null);
  };

  /* ==========================================================
     FASE PRINCIPAL
     ========================================================== */

  const mainPhaseName = useMemo(() => {
    if (!mainPhaseCode) {
      return "-";
    }

    return state.phases.find((phase) => phase.code === mainPhaseCode)?.name ?? "-";
  }, [mainPhaseCode, state.phases]);

  /* ==========================================================
     KPIs
     ========================================================== */

  const analyzedPoints = state.diffractogram.length;

  const peakCount = state.peaks.length;

  const correlationCount = correlations.length;

  const phaseCount = state.phases.length;

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className="
        flex
        h-screen
        min-h-screen
        w-full
        flex-col
        overflow-hidden

        bg-background
        text-text-primary
        font-sans
      "
    >
      {/* ====================================================
          HEADER
          ==================================================== */}

      <header
        className="
          z-content
          shrink-0
          border-b
          border-border-subtle
          bg-surface
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[1800px]

            flex-col
            gap-4

            px-4
            py-4

            sm:px-5

            md:flex-row
            md:items-center
            md:justify-between
            md:px-6

            lg:px-8
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            {/* ============================================
                ÁRVORE / IDENTIDADE
                ============================================ */}

            <div
              className="
                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-md

                border
                border-primary-border

                bg-primary-soft

                text-primary
              "
            >
              <Tree size={24} aria-hidden={true} />
            </div>

            <div className="min-w-0">
              <h1
                className="
                  truncate

                  text-lg
                  font-semibold
                  leading-tight

                  text-text-primary

                  sm:text-xl
                "
              >
                Plot de gráficos DRX
              </h1>

              <p
                className="
                  mt-0.5
                  truncate

                  text-xs
                  text-text-secondary

                  sm:text-sm
                "
              >
                Análise e correlação de difratogramas de raios X
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetProject}
            className="
              leaf-secondary-button

              w-full
              sm:w-auto
            "
          >
            <Reset size={16} aria-hidden={true} />

            <span>Limpar projeto</span>
          </button>
        </div>
      </header>

      {/* ====================================================
          CONTEÚDO
          ==================================================== */}

      <main
        className="
          min-h-0
          min-w-0
          flex-1

          overflow-x-hidden
          overflow-y-auto

          bg-background
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1800px]

            px-3
            py-4

            sm:px-4

            md:px-6
            md:py-6

            lg:px-8
            lg:py-8
          "
        >
          {/* ==================================================
              ERRO
              ================================================== */}

          {state.error && (
            <section
              role="alert"
              className="
                mb-5

                flex
                items-start
                gap-3

                border
                border-border-subtle
                border-l-4
                border-l-error

                bg-surface

                px-4
                py-3

                shadow-sm
              "
            >
              <WarningAlt
                size={20}
                className="
                  mt-0.5
                  shrink-0
                  text-error
                "
                aria-hidden={true}
              />

              <div className="min-w-0">
                <div
                  className="
                    text-sm
                    font-semibold
                    text-text-primary
                  "
                >
                  Erro na importação
                </div>

                <div
                  className="
                    mt-0.5
                    wrap-break-word
                    text-sm
                    text-text-secondary
                  "
                >
                  {state.error}
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              KPIs
              ================================================== */}

          <section
            aria-label="Resumo da análise"
            className="
              mb-6

              grid
              min-w-0

              grid-cols-1
              gap-px

              overflow-hidden

              border
              border-border-subtle

              bg-border-subtle

              shadow-sm

              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <KpiCard
              icon={<Analytics size={20} aria-hidden={true} />}
              label="Pontos analisados"
              value={analyzedPoints}
              helper="Pontos do difratograma"
            />

            <KpiCard
              icon={<ChartRelationship size={20} aria-hidden={true} />}
              label="Picos encontrados"
              value={peakCount}
              helper="Reflexões identificadas"
            />

            <KpiCard
              icon={<Analytics size={20} aria-hidden={true} />}
              label="Correlações"
              value={correlationCount}
              helper="Picos associados às fases"
            />

            {/* ==============================================
                FASE PRINCIPAL
                ============================================== */}

            <div
              className="
                min-w-0
                bg-surface

                p-4
                sm:p-5
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    flex
                    h-7
                    w-7
                    shrink-0

                    items-center
                    justify-center

                    rounded-sm

                    bg-primary-soft

                    text-primary
                  "
                >
                  <TreeView size={18} aria-hidden={true} />
                </span>

                <span
                  className="
                    truncate

                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide

                    text-text-secondary
                  "
                >
                  Fase principal
                </span>
              </div>

              <div
                className="
                  mt-3
                  flex
                  min-w-0
                  items-start
                  gap-2
                "
              >
                {mainPhaseCode && (
                  <span
                    className="
                      mt-0.5
                      shrink-0

                      text-lg
                      leading-none

                      text-primary
                    "
                    aria-hidden={true}
                  >
                    ★
                  </span>
                )}

                <div className="min-w-0">
                  <div
                    className="
                      truncate

                      text-lg
                      font-semibold
                      leading-tight

                      text-text-primary
                    "
                    title={mainPhaseName}
                  >
                    {mainPhaseName}
                  </div>

                  <div
                    className="
                      mt-1

                      text-xs
                      text-text-secondary
                    "
                  >
                    {phaseCount} {phaseCount === 1 ? "fase" : "fases"} carregada
                    {phaseCount === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              CABEÇALHO DA ANÁLISE
              ================================================== */}

          <section
            className="
              mb-3
              flex
              min-w-0
              flex-col
              gap-1

              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  text-base
                  font-semibold
                  text-text-primary

                  sm:text-lg
                "
              >
                Análise do difratograma
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-text-secondary
                "
              >
                Visualização dos dados, fases identificadas e correlações.
              </p>
            </div>
          </section>

          {/* ==================================================
              GRÁFICO
              ================================================== */}

          <section
            className="
              mb-6
              min-w-0
            "
          >
            <DrxChart
              state={derivedState}
              phaseVisibility={phaseVisibility}
              phaseStyles={phaseStyles}
              onPlotReady={setPlotElement}
            />
          </section>

          {/* ==================================================
              FASES
              ================================================== */}

          <section
            className="
              mb-6
              min-w-0
            "
          >
            <PhaseCustom
              state={derivedState}
              phaseVisibility={phaseVisibility}
              onPhaseVisibilityChange={handlePhaseVisibilityChange}
              phaseStyles={phaseStyles}
              onPhaseStyleChange={handlePhaseStyleChange}
              onResetPhaseControls={handleResetPhaseControls}
            />
          </section>

          {/* ==================================================
              TABELAS
              ================================================== */}

          <section className="min-w-0">
            <DataTables state={derivedState} onPhaseUpdate={handlePhaseUpdate} />
          </section>
        </div>
      </main>

      {/* ====================================================
          LEAF BUTTON
          ==================================================== */}

      <LeafButton
        state={derivedState}
        onFileUpload={handleFileUpload}
        onConfigChange={handleConfigChange}
        plotElement={plotElement}
      />
    </div>
  );
}

/* ============================================================
   KPI
   ============================================================ */

function KpiCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;

  label: string;

  value: number | string;

  helper: string;
}) {
  return (
    <div
      className="
        min-w-0
        bg-surface

        p-4
        sm:p-5
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-2
        "
      >
        <span
          className="
            flex
            h-7
            w-7
            shrink-0

            items-center
            justify-center

            rounded-sm

            bg-primary-soft

            text-primary
          "
        >
          {icon}
        </span>

        <span
          className="
            truncate

            text-xs
            font-semibold
            uppercase
            tracking-wide

            text-text-secondary
          "
        >
          {label}
        </span>
      </div>

      <div
        className="
          mt-3

          text-2xl
          font-semibold
          leading-none

          text-primary

          sm:text-3xl
        "
      >
        {value}
      </div>

      <div
        className="
          mt-2
          truncate

          text-xs
          text-text-secondary
        "
        title={helper}
      >
        {helper}
      </div>
    </div>
  );
}

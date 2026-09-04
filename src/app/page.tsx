// src/app/page.tsx

"use client";

import React, { useMemo, useState } from "react";

import { AppState, ConfigState } from "@/types";

import Sidebar from "@/components/layout/Sidebar";

import DrxChart from "@/components/chart/DrxChart";

import DataTables from "@/components/tables/DataTables";

import {
  parseDiffractogram,
  parsePeakList,
  parsePhaseList,
} from "@/lib/parsers";

import { correlateData } from "@/lib/correlator";

import { Activity, AlertCircle } from "lucide-react";

const INITIAL_STATE: AppState = {
  diffractogram: [],

  peaks: [],

  phases: [],

  correlations: [],

  mainPhaseCode: null,

  config: {
    tolerance: 0.15,

    background: "white",

    curveThickness: 1.35,

    markerSize: 8,

    showGrid: true,

    showLegend: true,

    showPeaks: true,

    showPhases: true,

    labelType: "name",

    articleMode: false,

    hideAxes: false,

    smoothLine: false,
  } satisfies ConfigState,

  filesLoaded: {
    drx: false,

    peak: false,

    phase: false,
  },

  error: null,
};

export default function DRXAnalyzer() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const correlationResult = useMemo(() => {
    if (
      state.diffractogram.length === 0 ||
      state.peaks.length === 0 ||
      state.phases.length === 0
    ) {
      return {
        correlations: [],

        mainPhaseCode: null,
      };
    }

    return correlateData(state.diffractogram, state.peaks, state.phases);
  }, [state.diffractogram, state.peaks, state.phases]);

  /**
   * ============================================================
   * CORRELAÇÕES
   * ============================================================
   */

  const correlations = correlationResult.correlations;

  /**
   * ============================================================
   * FASE PRINCIPAL
   * ============================================================
   *
   * Primeiro usamos a fase principal fornecida pelo correlator.
   *
   * Caso não exista, calculamos pela quantidade de ocorrências.
   *
   * Nenhum pico é removido.
   */

  const mainPhaseCode = useMemo(() => {
    if (correlationResult.mainPhaseCode) {
      return correlationResult.mainPhaseCode;
    }

    if (correlations.length === 0) {
      return null;
    }

    const phaseCounts = new Map<string, number>();

    for (const correlation of correlations) {
      for (const phase of correlation.phases) {
        const current = phaseCounts.get(phase.code) ?? 0;

        phaseCounts.set(phase.code, current + 1);
      }
    }

    let selectedCode: string | null = null;

    let highestCount = 0;

    for (const [code, count] of phaseCounts) {
      if (count > highestCount) {
        highestCount = count;

        selectedCode = code;
      }
    }

    return selectedCode;
  }, [correlationResult.mainPhaseCode, correlations]);

  /**
   * ============================================================
   * ESTADO DERIVADO
   * ============================================================
   *
   * O state original continua armazenando apenas os dados
   * carregados.
   *
   * As correlações são calculadas a partir deles e entregues
   * para Sidebar, gráfico e tabelas.
   */

  const derivedState = useMemo<AppState>(() => {
    return {
      ...state,

      correlations,

      mainPhaseCode,
    };
  }, [state, correlations, mainPhaseCode]);

  /**
   * ============================================================
   * IMPORTAÇÃO DOS ARQUIVOS
   * ============================================================
   */

  const handleFileUpload = async (
    type: "drx" | "peak" | "phase",

    file: File,
  ) => {
    try {
      /**
       * Limpa mensagem de erro anterior.
       */

      setState((prev) => ({
        ...prev,

        error: null,
      }));

      /**
       * --------------------------------------------------------
       * DIFRATOGRAMA
       * --------------------------------------------------------
       */

      if (type === "drx") {
        const data = await parseDiffractogram(file);

        setState((prev) => ({
          ...prev,

          diffractogram: data,

          filesLoaded: {
            ...prev.filesLoaded,

            drx: true,
          },

          error: null,
        }));

        return;
      }

      /**
       * --------------------------------------------------------
       * PEAK LIST
       * --------------------------------------------------------
       */

      if (type === "peak") {
        const data = await parsePeakList(file);

        setState((prev) => ({
          ...prev,

          peaks: data,

          filesLoaded: {
            ...prev.filesLoaded,

            peak: true,
          },

          error: null,
        }));

        return;
      }

      /**
       * --------------------------------------------------------
       * PHASE LIST
       * --------------------------------------------------------
       */

      if (type === "phase") {
        const data = await parsePhaseList(file);

        setState((prev) => ({
          ...prev,

          phases: data,

          filesLoaded: {
            ...prev.filesLoaded,

            phase: true,
          },

          error: null,
        }));

        return;
      }
    } catch (error: unknown) {
      /**
       * Tratamento tipado do erro.
       *
       * Não usamos any.
       */

      const message =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao ler o arquivo.";

      setState((prev) => ({
        ...prev,

        error: message,
      }));
    }
  };

  /**
   * ============================================================
   * CONFIGURAÇÕES DO GRÁFICO
   * ============================================================
   */

  const handleConfigChange = (newConfig: Partial<ConfigState>) => {
    setState((prev) => ({
      ...prev,

      config: {
        ...prev.config,

        ...newConfig,
      },
    }));
  };

  /**
   * ============================================================
   * LIMPAR PROJETO
   * ============================================================
   */

  const resetProject = () => {
    setState(INITIAL_STATE);
  };

  /**
   * ============================================================
   * NOME DA FASE PRINCIPAL
   * ============================================================
   */

  const mainPhaseName = useMemo(() => {
    if (!mainPhaseCode) {
      return "-";
    }

    return (
      state.phases.find((phase) => phase.code === mainPhaseCode)?.name ?? "-"
    );
  }, [mainPhaseCode, state.phases]);

  /**
   * ============================================================
   * INTERFACE
   *
   * O DESIGN ABAIXO FOI MANTIDO DO SEU PAGE.TSX ORIGINAL.
   *
   * ============================================================
   */

  return (
    // Fundo geral #F8F7F4 (Off White)

    <div className="flex h-screen min-h-screen w-full max-w-full  flex-col bg-[#F8F7F4] font-sans text-[#353638]">
      {/* Header com borda #C9C5BC (Stone) */}

      <header className="z-10 flex shrink-0 flex-col gap-3 border-b border-[#C9C5BC] bg-[#F8F7F4] px-4 py-3 sm:px-5 sm:py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="shrink-0 rounded-lg border border-[#C9C5BC] bg-[#E8E6E1] p-2 sm:p-2.5 text-[#353638]">
            <Activity className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight text-[#353638] sm:text-lg md:text-xl">
              TESTE APP DE GRAFICO LAB_ECO
            </h1>

            <p className="truncate text-[10px] font-medium text-[#8C8478] sm:text-xs">
              Análise acadêmica de difratogramas de raios X
            </p>
          </div>
        </div>

        <button
          onClick={resetProject}
          className="w-full rounded-lg border border-[#C9C5BC] bg-[#F8F7F4] px-4 py-2.5 text-sm font-semibold text-[#353638] transition-colors hover:bg-[#E8E6E1] hover:text-[#353638] sm:w-auto sm:px-5"
        >
          Limpar Projeto
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <Sidebar
          state={derivedState}
          onFileUpload={handleFileUpload}
          onConfigChange={handleConfigChange}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          {state.error && (
            <div className="mb-4 flex min-w-0 items-start gap-3 rounded-r-lg border border-r-[#C9C5BC] border-t-[#C9C5BC] border-b-[#C9C5BC] border-l-4 border-[#8C8478] bg-[#E8E6E1] p-3 text-[#353638] sm:mb-6 sm:p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8C8478]" />

              <div className="min-w-0">
                <strong className="block font-semibold">
                  Erro na importação
                </strong>

                <span className=" text-sm text-[#8C8478]">{state.error}</span>
              </div>
            </div>
          )}

          <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:mb-8 md:gap-5 lg:grid-cols-4">
            {/* ==================================================
                CARD — PONTOS ANALISADOS
            ================================================== */}

            <div className="min-w-0 rounded-xl border border-[#C9C5BC] bg-[#E8E6E1] p-4 shadow-xs transition-colors hover:border-[#8C8478] sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8C8478]">
                Pontos Analisados
              </div>

              <div className="mt-2 text-2xl font-bold text-[#353638] sm:text-3xl">
                {state.diffractogram.length.toLocaleString()}
              </div>
            </div>

            {/* ==================================================
                CARD — PICOS ENCONTRADOS
            ================================================== */}

            <div className="min-w-0 rounded-xl border border-[#C9C5BC] bg-[#E8E6E1] p-4 shadow-xs transition-colors hover:border-[#8C8478] sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8C8478]">
                Picos Encontrados
              </div>

              <div className="mt-2 text-2xl font-bold text-[#353638] sm:text-3xl">
                {state.peaks.length}
              </div>
            </div>

            {/* ==================================================
                CARD — CORRELAÇÕES
            ================================================== */}

            <div className="min-w-0 rounded-xl border border-[#C9C5BC] bg-[#E8E6E1] p-4 shadow-xs transition-colors hover:border-[#8C8478] sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8C8478]">
                Correlações Fixadas
              </div>

              <div className="mt-2 text-2xl font-bold text-[#353638] sm:text-3xl">
                {correlations.length}
              </div>
            </div>

            {/* ==================================================
                CARD — FASE PRINCIPAL
            ================================================== */}

            <div className="relative min-w-0 overflow-hidden rounded-xl border border-[#C9C5BC] bg-[#E8E6E1] p-4 shadow-xs transition-colors hover:border-[#8C8478] sm:p-5">
              <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#8C8478]"></div>

              <div className="truncate pl-2 text-xs font-semibold uppercase tracking-wider text-[#8C8478]">
                Fase Principal
              </div>

              <div className="mt-2 flex min-w-0 items-center gap-2 truncate pl-2 text-lg font-bold text-[#353638] sm:text-xl">
                {mainPhaseCode && (
                  <span className="shrink-0 text-[#8C8478]">★</span>
                )}

                <span className="truncate">{mainPhaseName}</span>
              </div>
            </div>
          </div>

          {/* ====================================================
              GRÁFICO
          ==================================================== */}

          <div className="min-w-0 max-w-full">
            <DrxChart state={derivedState} />
          </div>

          {/* ====================================================
              TABELAS
          ==================================================== */}

          <div className="min-w-0 max-w-full">
            <DataTables state={derivedState} />
          </div>
        </main>
      </div>
    </div>
  );
}

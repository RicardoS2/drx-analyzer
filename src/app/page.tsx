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

  /*
   * ============================================================
   * CORRELAÇÕES
   * ============================================================
   */
  const correlations = correlationResult.correlations;

  /*
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

  /*
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

  /*
   * ============================================================
   * IMPORTAÇÃO DOS ARQUIVOS
   * ============================================================
   */
  const handleFileUpload = async (
    type: "drx" | "peak" | "phase",
    file: File,
  ) => {
    try {
      /*
       * Limpa mensagem de erro anterior.
       */
      setState((prev) => ({
        ...prev,

        error: null,
      }));

      /*
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

      /*
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

      /*
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
      /*
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

  /*
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

  /*
   * ============================================================
   * LIMPAR PROJETO
   * ============================================================
   */
  const resetProject = () => {
    setState(INITIAL_STATE);
  };

  /*
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

  /*
   * ============================================================
   * INTERFACE
   * ============================================================
   *
   * O DESIGN ABAIXO FOI MANTIDO DO SEU PAGE.TSX ORIGINAL.
   * ============================================================
   */
  return (
    // Fundo geral #F8F7F4 (Off White)
    <div className="flex flex-col h-screen bg-[#F8F7F4] overflow-hidden font-sans text-[#353638]">
      {/* Header com borda #C9C5BC (Stone) */}
      <header className="bg-[#F8F7F4] border-b border-[#C9C5BC] px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#E8E6E1] p-2.5 rounded-lg text-[#353638] border border-[#C9C5BC]">
            <Activity className="w-5 h-5" />
          </div>

          <div>
            <h1 className="font-bold text-xl text-[#353638] leading-tight">
              TESTE APP DE GRAFICO LAB_ECO
            </h1>

            <p className="text-xs text-[#8C8478] font-medium">
              Análise acadêmica de difratogramas de raios X
            </p>
          </div>
        </div>

        <button
          onClick={resetProject}
          className="text-sm font-semibold text-[#353638] hover:text-[#353638] px-5 py-2.5 border border-[#C9C5BC] rounded-lg hover:bg-[#E8E6E1] transition-colors bg-[#F8F7F4]"
        >
          Limpar Projeto
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <Sidebar
          state={derivedState}
          onFileUpload={handleFileUpload}
          onConfigChange={handleConfigChange}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {state.error && (
            <div className="mb-6 bg-[#E8E6E1] border-l-4 border-[#8C8478] text-[#353638] p-4 rounded-r-lg border border-r-[#C9C5BC] border-t-[#C9C5BC] border-b-[#C9C5BC] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#8C8478]" />

              <div>
                <strong className="font-semibold block">
                  Erro na importação
                </strong>

                <span className="text-sm text-[#8C8478]">{state.error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {/* ==================================================
                CARD — PONTOS ANALISADOS
            ================================================== */}

            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors shadow-xs">
              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider">
                Pontos Analisados
              </div>

              <div className="text-3xl font-bold text-[#353638] mt-2">
                {state.diffractogram.length.toLocaleString()}
              </div>
            </div>

            {/* ==================================================
                CARD — PICOS ENCONTRADOS
            ================================================== */}

            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors shadow-xs">
              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider">
                Picos Encontrados
              </div>

              <div className="text-3xl font-bold text-[#353638] mt-2">
                {state.peaks.length}
              </div>
            </div>

            {/* ==================================================
                CARD — CORRELAÇÕES
            ================================================== */}

            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors shadow-xs">
              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider">
                Correlações Fixadas
              </div>

              <div className="text-3xl font-bold text-[#353638] mt-2">
                {correlations.length}
              </div>
            </div>

            {/* ==================================================
                CARD — FASE PRINCIPAL
            ================================================== */}

            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors relative overflow-hidden group shadow-xs">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#8C8478]"></div>

              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider pl-2">
                Fase Principal
              </div>

              <div className="text-xl font-bold text-[#353638] mt-2 pl-2 truncate flex items-center gap-2">
                {mainPhaseCode && <span className="text-[#8C8478]">★</span>}

                {mainPhaseName}
              </div>
            </div>
          </div>

          {/* ====================================================
              GRÁFICO
          ==================================================== */}

          <DrxChart state={derivedState} />

          {/* ====================================================
              TABELAS
          ==================================================== */}

          <DataTables state={derivedState} />
        </main>
      </div>
    </div>
  );
}

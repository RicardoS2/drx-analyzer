// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AppState, ConfigState } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import DrxChart from '@/components/chart/DrxChart';
import DataTables from '@/components/tables/DataTables';
import { parseDiffractogram, parsePeakList, parsePhaseList } from '@/lib/parsers';
import { correlateData } from '@/lib/correlator';
import { Activity, AlertCircle } from 'lucide-react';

const INITIAL_STATE: AppState = {
  diffractogram: [],
  peaks: [],
  phases: [],
  correlations: [],
  mainPhaseCode: null,
  config: {
    tolerance: 0.15,
    background: 'white',
    curveThickness: 1.35,
    markerSize: 8,
    showGrid: true,
    showLegend: true,
    showPeaks: true,
    showPhases: true
  },
  filesLoaded: { drx: false, peak: false, phase: false },
  error: null
};

export default function DRXAnalyzer() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  useEffect(() => {
    if (state.diffractogram.length > 0 && state.peaks.length > 0 && state.phases.length > 0) {
      const { correlations, mainPhaseCode } = correlateData(
        state.diffractogram,
        state.peaks,
        state.phases,
        state.config.tolerance
      );
      setState(prev => ({ ...prev, correlations, mainPhaseCode }));
    }
  }, [state.diffractogram, state.peaks, state.phases, state.config.tolerance]);

  const handleFileUpload = async (type: 'drx' | 'peak' | 'phase', file: File) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (type === 'drx') {
        const data = await parseDiffractogram(file);
        setState(prev => ({ ...prev, diffractogram: data, filesLoaded: { ...prev.filesLoaded, drx: true } }));
      } else if (type === 'peak') {
        const data = await parsePeakList(file);
        setState(prev => ({ ...prev, peaks: data, filesLoaded: { ...prev.filesLoaded, peak: true } }));
      } else if (type === 'phase') {
        const data = await parsePhaseList(file);
        setState(prev => ({ ...prev, phases: data, filesLoaded: { ...prev.filesLoaded, phase: true } }));
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || "Erro inesperado ao ler o arquivo." }));
    }
  };

  const handleConfigChange = (newConfig: Partial<ConfigState>) => {
    setState(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
  };

  const resetProject = () => setState(INITIAL_STATE);

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
            <h1 className="font-bold text-xl text-[#353638] leading-tight">TESTE APP DE GRAFICO LAB_ECO</h1>
            <p className="text-xs text-[#8C8478] font-medium">Análise acadêmica de difratogramas de raios X</p>
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

        <Sidebar state={state} onFileUpload={handleFileUpload} onConfigChange={handleConfigChange} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {state.error && (
            <div className="mb-6 bg-[#E8E6E1] border-l-4 border-[#8C8478] text-[#353638] p-4 rounded-r-lg border border-r-[#C9C5BC] border-t-[#C9C5BC] border-b-[#C9C5BC] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#8C8478]" />
              <div>
                <strong className="font-semibold block">Erro na importação</strong>
                <span className="text-sm text-[#8C8478]">{state.error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors shadow-xs">
              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider">Pontos Analisados</div>
              <div className="text-3xl font-bold text-[#353638] mt-2">
                {state.diffractogram.length.toLocaleString()}
              </div>
            </div>

            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors shadow-xs">
              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider">Picos Encontrados</div>
              <div className="text-3xl font-bold text-[#353638] mt-2">
                {state.peaks.length}
              </div>
            </div>

            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors shadow-xs">
              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider">Correlações Fixadas</div>
              <div className="text-3xl font-bold text-[#353638] mt-2">
                {state.correlations.length}
              </div>
            </div>

            <div className="bg-[#E8E6E1] p-5 rounded-xl border border-[#C9C5BC] hover:border-[#8C8478] transition-colors relative overflow-hidden group shadow-xs">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#8C8478]"></div>
              <div className="text-xs text-[#8C8478] font-semibold uppercase tracking-wider pl-2">Fase Principal</div>
              <div className="text-xl font-bold text-[#353638] mt-2 pl-2 truncate flex items-center gap-2">
                {state.mainPhaseCode && <span className="text-[#8C8478]">★</span>}
                {state.mainPhaseCode ? state.phases.find(p => p.code === state.mainPhaseCode)?.name : '-'}
              </div>
            </div>
          </div>

          <DrxChart state={state} />
          <DataTables state={state} />

        </main>
      </div>
    </div>
  );
}

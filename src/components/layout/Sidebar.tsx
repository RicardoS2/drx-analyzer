// src/components/layout/Sidebar.tsx
'use client';

import React from 'react';
import { Upload, Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { AppState, ConfigState } from '@/types';

interface Props {
  state: AppState;
  onFileUpload: (type: 'drx' | 'peak' | 'phase', file: File) => void;
  onConfigChange: (config: Partial<ConfigState>) => void;
}

export default function Sidebar({ state, onFileUpload, onConfigChange }: Props) {
  const FileStatus = ({ loaded, label }: { loaded: boolean, label: string }) => (
    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-[#E8E6E1] shadow-xs border border-[#C9C5BC]">
      <span className="text-[#353638] font-medium">{label}</span>
      {loaded ? (
        <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
      ) : (
        <XCircle className="w-5 h-5 text-[#8C8478]" />
      )}
    </div>
  );

  return (
    <div className="w-full md:w-80 bg-[#F8F7F4] border-r border-[#C9C5BC] p-5 flex flex-col gap-8 shrink-0 overflow-y-auto">

      {/* Seção de Importação */}
      <div>
        <h3 className="font-bold text-[#353638] flex items-center gap-2 mb-5">
          <Upload className="w-5 h-5 text-[#353638]" />
          Importação de Dados
        </h3>

        <div className="space-y-4">
          <div className="group">
            <label className="block text-xs font-semibold text-[#8C8478] mb-1.5 uppercase tracking-wider">
              Difratograma (.txt, .dat)
            </label>
            <input
              type="file"
              accept=".txt,.dat,.asc"
              className="block w-full text-sm text-[#8C8478] cursor-pointer
                file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#C9C5BC]
                file:text-xs file:font-semibold file:bg-[#E8E6E1] file:text-[#353638]
                hover:file:bg-[#C9C5BC] transition-all"
              onChange={(e) => e.target.files?.[0] && onFileUpload('drx', e.target.files[0])}
            />
          </div>

          <div className="group">
            <label className="block text-xs font-semibold text-[#8C8478] mb-1.5 uppercase tracking-wider">
              Peak List (.txt, .csv)
            </label>
            <input
              type="file"
              accept=".txt,.csv"
              className="block w-full text-sm text-[#8C8478] cursor-pointer
                file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#C9C5BC]
                file:text-xs file:font-semibold file:bg-[#E8E6E1] file:text-[#353638]
                hover:file:bg-[#C9C5BC] transition-all"
              onChange={(e) => e.target.files?.[0] && onFileUpload('peak', e.target.files[0])}
            />
          </div>

          <div className="group">
            <label className="block text-xs font-semibold text-[#8C8478] mb-1.5 uppercase tracking-wider">
              Phase List (.txt, .csv)
            </label>
            <input
              type="file"
              accept=".txt,.csv"
              className="block w-full text-sm text-[#8C8478] cursor-pointer
                file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#C9C5BC]
                file:text-xs file:font-semibold file:bg-[#E8E6E1] file:text-[#353638]
                hover:file:bg-[#C9C5BC] transition-all"
              onChange={(e) => e.target.files?.[0] && onFileUpload('phase', e.target.files[0])}
            />
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <FileStatus loaded={state.filesLoaded.drx} label="Difratograma" />
          <FileStatus loaded={state.filesLoaded.peak} label="Peak List" />
          <FileStatus loaded={state.filesLoaded.phase} label="Phase List" />
        </div>
      </div>

      {/* Seção de Configuração Visual */}
      <div className="border-t border-[#C9C5BC] pt-6">
        <h3 className="font-bold text-[#353638] flex items-center gap-2 mb-5">
          <Settings2 className="w-5 h-5 text-[#353638]" />
          Configuração Visual
        </h3>

        <div className="space-y-6">
          <div>
            <label className="flex justify-between items-center text-sm text-[#353638] mb-2">
              <span className="font-medium">Tolerância (2θ)</span>
              <span className="font-mono bg-[#E8E6E1] border border-[#C9C5BC] text-[#353638] px-2 py-1 rounded-md text-xs font-bold">
                ±{state.config.tolerance.toFixed(2)}°
              </span>
            </label>
            <input
              type="range"
              min="0.01" max="0.5" step="0.01"
              value={state.config.tolerance}
              onChange={(e) => onConfigChange({ tolerance: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#C9C5BC] rounded-lg appearance-none cursor-pointer accent-[#353638]"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 text-sm text-[#353638] cursor-pointer group">
              <input
                type="checkbox"
                checked={state.config.showGrid}
                onChange={(e) => onConfigChange({ showGrid: e.target.checked })}
                className="w-4 h-4 rounded border-[#C9C5BC] text-[#353638] focus:ring-[#8C8478] cursor-pointer transition-colors"
              />
              <span className="group-hover:text-[#8C8478] transition-colors">Mostrar Grade</span>
            </label>

            <label className="flex items-center gap-3 text-sm text-[#353638] cursor-pointer group">
              <input
                type="checkbox"
                checked={state.config.showLegend}
                onChange={(e) => onConfigChange({ showLegend: e.target.checked })}
                className="w-4 h-4 rounded border-[#C9C5BC] text-[#353638] focus:ring-[#8C8478] cursor-pointer transition-colors"
              />
              <span className="group-hover:text-[#8C8478] transition-colors">Mostrar Legenda</span>
            </label>

            <label className="flex items-center gap-3 text-sm text-[#353638] cursor-pointer group">
              <input
                type="checkbox"
                checked={state.config.showPhases}
                onChange={(e) => onConfigChange({ showPhases: e.target.checked })}
                className="w-4 h-4 rounded border-[#C9C5BC] text-[#353638] focus:ring-[#8C8478] cursor-pointer transition-colors"
              />
              <span className="group-hover:text-[#8C8478] transition-colors">Marcar Fases no Gráfico</span>
            </label>
          </div>
        </div>
      </div>

    </div>
  );
}

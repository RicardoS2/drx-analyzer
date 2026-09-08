"use client";

import { useState } from "react";
import { Grid, SettingsAdjust, StringText, View } from "@carbon/icons-react";
import Switch from "@/components/ui/Switch";
import type { AppState, ConfigState } from "@/types";

interface ChartToolsProps {
  state: AppState;
  onConfigChange: (config: Partial<ConfigState>) => void;
}

const TABS = [
  { id: "chart", label: "Gráfico", icon: Grid },
  { id: "typography", label: "Tipos", icon: StringText },
  { id: "lines", label: "Linhas", icon: SettingsAdjust },
  { id: "appearance", label: "Visual", icon: View },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ChartTools({ state, onConfigChange }: ChartToolsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("chart");
  const typography = state.config.typography;
  const lines = state.config.lines;

  return (
    <div className="flex flex-col">
      <nav className="mb-6 flex space-x-1.5 rounded-lg border border-border-subtle bg-surface-02 p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                isActive
                  ? "bg-surface text-primary shadow-sm ring-1 ring-border-subtle"
                  : "text-text-secondary hover:bg-surface-03 hover:text-text-primary"
              }`}
            >
              <Icon size={18} aria-hidden={true} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-h-75">
        {activeTab === "chart" && (
          <div className="flex animate-in flex-col gap-3 fade-in slide-in-from-left-2 duration-300">
            <SwitchRow
              label="Mostrar Grade de Fundo"
              checked={state.config.showGrid}
              onChange={(v) => onConfigChange({ showGrid: v })}
            />
            <SwitchRow
              label="Exibir Legenda"
              checked={state.config.showLegend}
              onChange={(v) => onConfigChange({ showLegend: v })}
            />
            <SwitchRow
              label="Destacar Picos"
              checked={state.config.showPeaks}
              onChange={(v) => onConfigChange({ showPeaks: v })}
            />
            <SwitchRow
              label="Identificar Fases"
              checked={state.config.showPhases}
              onChange={(v) => onConfigChange({ showPhases: v })}
            />
          </div>
        )}

        {activeTab === "typography" && (
          <div className="flex animate-in flex-col gap-5 fade-in slide-in-from-left-2 duration-300">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Família da fonte
              </span>
              <select
                value={typography.fontFamily}
                onChange={(e) =>
                  onConfigChange({
                    typography: {
                      ...typography,
                      fontFamily: e.target.value as "Arial" | "Times New Roman",
                    },
                  })
                }
                className="leaf-select w-full"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="Título"
                value={typography.titleFontSize}
                min={8}
                max={32}
                step={1}
                suffix=" px"
                onChange={(v) =>
                  onConfigChange({ typography: { ...typography, titleFontSize: v } })
                }
              />
              <Slider
                label="Legenda"
                value={typography.legendFontSize}
                min={6}
                max={24}
                step={1}
                suffix=" px"
                onChange={(v) =>
                  onConfigChange({ typography: { ...typography, legendFontSize: v } })
                }
              />
              <Slider
                label="Eixo X"
                value={typography.xAxisTitleFontSize}
                min={6}
                max={24}
                step={1}
                suffix=" px"
                onChange={(v) =>
                  onConfigChange({ typography: { ...typography, xAxisTitleFontSize: v } })
                }
              />
              <Slider
                label="Eixo Y"
                value={typography.yAxisTitleFontSize}
                min={6}
                max={24}
                step={1}
                suffix=" px"
                onChange={(v) =>
                  onConfigChange({ typography: { ...typography, yAxisTitleFontSize: v } })
                }
              />
            </div>

            <div className="flex flex-col gap-4 border-t border-border-subtle pt-5">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary">
                  Título do Gráfico
                </span>
                <input
                  type="text"
                  value={typography.titleText}
                  onChange={(e) =>
                    onConfigChange({ typography: { ...typography, titleText: e.target.value } })
                  }
                  placeholder="Ex: Análise DRX"
                  className="leaf-input w-full"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-text-secondary">
                    Rótulo do Eixo X
                  </span>
                  <input
                    type="text"
                    value={typography.xAxisTitle}
                    onChange={(e) =>
                      onConfigChange({ typography: { ...typography, xAxisTitle: e.target.value } })
                    }
                    className="leaf-input w-full"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-text-secondary">
                    Rótulo do Eixo Y
                  </span>
                  <input
                    type="text"
                    value={typography.yAxisTitle}
                    onChange={(e) =>
                      onConfigChange({ typography: { ...typography, yAxisTitle: e.target.value } })
                    }
                    className="leaf-input w-full"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "lines" && (
          <div className="flex animate-in flex-col gap-4 fade-in slide-in-from-left-2 duration-300">
            <Slider
              label="Espessura da Curva Principal"
              value={lines.curveThickness}
              min={0.5}
              max={6}
              step={0.5}
              suffix="pt"
              onChange={(v) => onConfigChange({ lines: { ...lines, curveThickness: v } })}
            />
            <Slider
              label="Espessura das Guias de Pico"
              value={lines.peakConnectorThickness}
              min={0.5}
              max={6}
              step={0.5}
              suffix="pt"
              onChange={(v) => onConfigChange({ lines: { ...lines, peakConnectorThickness: v } })}
            />
            <Slider
              label="Altura Relativa dos Marcadores"
              value={lines.peakHeight}
              min={10}
              max={100}
              step={1}
              suffix="%"
              onChange={(v) => onConfigChange({ lines: { ...lines, peakHeight: v } })}
            />
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="grid animate-in grid-cols-1 gap-5 fade-in slide-in-from-left-2 duration-300 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Fundo do Gráfico
              </span>
              <select
                value={state.config.background}
                onChange={(e) =>
                  onConfigChange({ background: e.target.value as "white" | "transparent" })
                }
                className="leaf-select w-full"
              >
                <option value="white">Branco (Padrão)</option>
                <option value="transparent">Transparente</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Rótulos das Fases
              </span>
              <select
                value={state.config.labelType}
                onChange={(e) =>
                  onConfigChange({ labelType: e.target.value as "name" | "formula" })
                }
                className="leaf-select w-full"
              >
                <option value="name">Nome (Ex: Quartzo)</option>
                <option value="formula">Fórmula (Ex: SiO2)</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border-subtle bg-surface px-4 py-3.5 transition-colors hover:bg-surface-02">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <div className="ml-4 shrink-0">
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col justify-center rounded-md border border-border-subtle bg-surface px-4 py-3.5 transition-colors hover:bg-surface-02">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className="rounded-sm bg-primary-soft px-1.5 py-0.5 text-xs font-bold text-primary">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-primary"
      />
    </label>
  );
}

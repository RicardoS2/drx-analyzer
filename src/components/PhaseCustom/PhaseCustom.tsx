"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Reset, StarFilled, Draggable } from "@carbon/icons-react";
import Switch from "@/components/ui/Switch";
import type { AppState, PhaseStyleConfig } from "@/types";
import { DEFAULT_PHASE_MARKER_HEIGHT, DEFAULT_PHASE_MARKER_SIZE } from "@/types";
import { formatChemicalFormula } from "@/lib/chemicalFormula";

/* ============================================================
   PROPS
   ============================================================ */

interface PhaseCustomProps {
  state: AppState;
  phaseVisibility: Record<string, boolean>;
  onPhaseVisibilityChange: (phaseCode: string, enabled: boolean) => void;
  phaseStyles: Record<string, PhaseStyleConfig>;
  onPhaseStyleChange: (phaseCode: string, changes: Partial<PhaseStyleConfig>) => void;
  onResetPhaseControls: () => void;
}

interface PhaseCardProps {
  phase: AppState["phases"][number];
  isMain: boolean;
  enabled: boolean;
  symbol: string;
  color: string;
  symbolSize: number;
  symbolHeight: number;
  onVisibilityChange: (value: boolean) => void;
  onStyleChange: (changes: Partial<PhaseStyleConfig>) => void;
}

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

/* ============================================================
   CONSTANTES
   ============================================================ */

const SYMBOLS = [
  { value: "circle", label: "Círculo" },
  { value: "square", label: "Quadrado" },
  { value: "diamond", label: "Losango" },
  { value: "pentagon", label: "Pentágono" },
  { value: "hexagon", label: "Hexágono" },
  { value: "hexagram", label: "Hexagrama" },
  { value: "star", label: "Estrela" },
  { value: "hourglass", label: "Ampulheta" },
  { value: "bowtie", label: "Ampulheta dupla" },
] as const;

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
  "#0369A1",
  "#4338CA",
  "#0F766E",
];

const MAIN_PHASE_SYMBOL = "star";
const MAIN_PHASE_COLOR = "#DA1E28";
const DEFAULT_SIZE_PATTERN = [10, 8, 7, 9, 6, 8, 7, 9];
const DEFAULT_HEIGHT_PATTERN = [72, 58, 82, 64, 48, 76, 54, 68];
const ITEMS_PER_PAGE = 3;

/* ============================================================
   FUNÇÕES AUXILIARES
   ============================================================ */

function getPhaseOrder(
  correlations: AppState["correlations"],
  phases: AppState["phases"],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const correlation of correlations) {
    for (const phase of correlation.phases) {
      if (!seen.has(phase.code)) {
        seen.add(phase.code);
        result.push(phase.code);
      }
    }
  }

  for (const phase of phases) {
    if (!seen.has(phase.code)) {
      seen.add(phase.code);
      result.push(phase.code);
    }
  }

  return result;
}

export function getDefaultPhaseValues(state: AppState, phaseCode: string) {
  const order = getPhaseOrder(state.correlations, state.phases);
  const index = Math.max(0, order.indexOf(phaseCode));
  const isMain = phaseCode === state.mainPhaseCode;

  if (isMain) {
    return {
      symbol: MAIN_PHASE_SYMBOL,
      color: MAIN_PHASE_COLOR,
      symbolSize: 14,
      symbolHeight: 85,
    };
  }

  const secondaryIndex =
    order.slice(0, index + 1).filter((code) => code !== state.mainPhaseCode).length - 1;
  const safeIndex = Math.max(0, secondaryIndex);

  return {
    symbol: SYMBOLS[safeIndex % SYMBOLS.length]?.value ?? "circle",
    color: COLORS[safeIndex % COLORS.length] ?? "#059669",
    symbolSize:
      DEFAULT_SIZE_PATTERN[safeIndex % DEFAULT_SIZE_PATTERN.length] ?? DEFAULT_PHASE_MARKER_SIZE,
    symbolHeight:
      DEFAULT_HEIGHT_PATTERN[safeIndex % DEFAULT_HEIGHT_PATTERN.length] ??
      DEFAULT_PHASE_MARKER_HEIGHT,
  };
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function PhaseCustom({
  state,
  phaseVisibility,
  onPhaseVisibilityChange,
  phaseStyles,
  onPhaseStyleChange,
  onResetPhaseControls,
}: PhaseCustomProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const phaseOrder = useMemo(
    () => getPhaseOrder(state.correlations, state.phases),
    [state.correlations, state.phases],
  );

  const totalPages = Math.max(1, Math.ceil(phaseOrder.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const pageStart = safeCurrentPage * ITEMS_PER_PAGE;
  const visiblePhaseCodes = phaseOrder.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  if (phaseOrder.length === 0) {
    return (
      <section className="w-full">
        <div className="flex min-h-35 flex-col items-center justify-center rounded-lg border border-dashed border-border-default bg-surface-02 px-4 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-text-primary">Nenhuma fase carregada</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-secondary">
            Importe a lista de fases para habilitar a personalização.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-border-subtle bg-surface shadow-sm overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface-02 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Fases ({phaseOrder.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onResetPhaseControls}
          className="leaf-ghost-button flex h-7 items-center gap-1.5 px-2.5 text-[11px]"
        >
          <Reset size={14} aria-hidden="true" />
          <span>Restaurar</span>
        </button>
      </header>

      {/* Grid responsivo com as fases lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
        {visiblePhaseCodes.map((phaseCode) => {
          const phase = state.phases.find((item) => item.code === phaseCode);
          if (!phase) return null;

          const style = phaseStyles[phase.code] ?? {};
          const isMain = phase.code === state.mainPhaseCode;
          const defaults = getDefaultPhaseValues(state, phase.code);
          const symbol = style.symbol ?? defaults.symbol;
          const color = isMain ? MAIN_PHASE_COLOR : (style.color ?? defaults.color);
          const symbolSize = style.symbolSize ?? defaults.symbolSize;
          const symbolHeight = style.symbolHeight ?? defaults.symbolHeight;
          const enabled = phaseVisibility[phase.code] !== false;

          return (
            <PhaseCard
              key={phase.code}
              phase={phase}
              isMain={isMain}
              enabled={enabled}
              symbol={symbol}
              color={color}
              symbolSize={symbolSize}
              symbolHeight={symbolHeight}
              onVisibilityChange={(value) => onPhaseVisibilityChange(phase.code, value)}
              onStyleChange={(changes) => onPhaseStyleChange(phase.code, changes)}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-border-subtle bg-surface-02 px-3 py-2.5">
          <button
            type="button"
            disabled={safeCurrentPage === 0}
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-icon-secondary transition-all hover:bg-surface-03 hover:text-text-primary disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => {
              const active = index === safeCurrentPage;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentPage(index)}
                  className={`rounded-full transition-all duration-300 ${
                    active
                      ? "h-2 w-5 bg-primary"
                      : "h-2 w-2 bg-border-default hover:bg-border-strong"
                  }`}
                  aria-label={`Página ${index + 1}`}
                />
              );
            })}
          </div>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages - 1}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-icon-secondary transition-all hover:bg-surface-03 hover:text-text-primary disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </footer>
      )}
    </div>
  );
}

/* ============================================================
   CARD DE FASE
   ============================================================ */

function PhaseCard({
  phase,
  isMain,
  enabled,
  symbol,
  color,
  symbolSize,
  symbolHeight,
  onVisibilityChange,
  onStyleChange,
}: PhaseCardProps) {
  return (
    <article
      className={`flex flex-col min-w-0 overflow-hidden rounded-md border bg-surface transition-all duration-200 ${
        enabled
          ? "border-border-subtle shadow-xs hover:border-border-strong"
          : "border-border-subtle opacity-50 saturate-0"
      }`}
    >
      <header className="flex items-center gap-2 border-b border-border-subtle bg-surface-01 px-3 py-2.5">
        <div
          className="flex cursor-grab shrink-0 items-center justify-center text-icon-disabled transition-colors hover:text-text-secondary active:cursor-grabbing"
          title="Arrastar fase"
        >
          <Draggable size={16} />
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border-subtle bg-surface">
          <SymbolPreview symbol={symbol} color={color} size={symbolSize * 0.8} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            {isMain && <StarFilled size={12} className="shrink-0 text-error" />}
            <span className="truncate text-[13px] font-bold text-text-primary" title={phase.name}>
              {phase.name}
            </span>
          </div>
          <span className="mt-0.5 block wrap-break-word text-[11px] font-medium text-text-secondary leading-tight">
            {formatChemicalFormula(phase.formula)}
          </span>
        </div>

        <div className="shrink-0">
          <Switch checked={enabled} onCheckedChange={onVisibilityChange} />
        </div>
      </header>

      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <label className="block flex-1">
            <span className="mb-1 block text-[10px] font-semibold text-text-secondary uppercase">
              Símbolo
            </span>
            <select
              value={SYMBOLS.some((item) => item.value === symbol) ? symbol : "circle"}
              onChange={(e) => onStyleChange({ symbol: e.target.value })}
              className="leaf-select h-7 w-full text-[11px] font-medium"
            >
              {SYMBOLS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:w-24 shrink-0">
            <span className="mb-1 block text-[10px] font-semibold text-text-secondary uppercase">
              Cor
            </span>
            <div className="flex h-7 w-full items-center gap-1.5 rounded-md border border-border-default bg-surface px-1.5 focus-within:border-primary hover:border-border-strong">
              <input
                type="color"
                value={color}
                disabled={isMain}
                onChange={(e) => onStyleChange({ color: e.target.value })}
                className="h-5 w-6 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0 disabled:opacity-50"
              />
              <span className="flex-1 truncate font-mono text-[10px] uppercase text-text-secondary">
                {color}
              </span>
            </div>
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
          <RangeControl
            label="Tamanho"
            value={symbolSize}
            min={3}
            max={22}
            step={1}
            display={`${Math.round(symbolSize)}px`}
            onChange={(value) => onStyleChange({ symbolSize: value })}
          />
          <RangeControl
            label="Altura"
            value={symbolHeight}
            min={10}
            max={100}
            step={1}
            display={`${Math.round(symbolHeight)}%`}
            onChange={(value) => onStyleChange({ symbolHeight: value })}
          />
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   PREVIEW DO SÍMBOLO
   ============================================================ */

function SymbolPreview({ symbol, color, size }: { symbol: string; color: string; size: number }) {
  const visualSize = Math.min(18, Math.max(10, size));
  const baseStyle = { width: visualSize, height: visualSize, backgroundColor: color };

  switch (symbol) {
    case "square":
      return <span className="block rounded-xs" style={baseStyle} />;
    case "diamond":
      return (
        <span
          className="block rotate-45 rounded-xs"
          style={{ ...baseStyle, width: visualSize * 0.72, height: visualSize * 0.72 }}
        />
      );
    case "pentagon":
      return (
        <span
          className="block"
          style={{ ...baseStyle, clipPath: "polygon(50% 0%, 95% 35%, 78% 100%, 22% 100%, 5% 35%)" }}
        />
      );
    case "hexagon":
      return (
        <span
          className="block"
          style={{
            ...baseStyle,
            clipPath: "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
          }}
        />
      );
    case "hexagram":
      return (
        <span
          className="block"
          style={{
            ...baseStyle,
            clipPath:
              "polygon(50% 0%, 61% 34%, 98% 34%, 68% 55%, 79% 91%, 50% 69%, 21% 91%, 32% 55%, 2% 34%, 39% 34%)",
          }}
        />
      );
    case "star":
      return (
        <span
          className="block"
          style={{
            ...baseStyle,
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 100%, 50% 73%, 21% 100%, 32% 56%, 2% 35%, 39% 35%)",
          }}
        />
      );
    case "hourglass":
      return (
        <span
          className="block"
          style={{
            ...baseStyle,
            clipPath: "polygon(7% 8%, 93% 8%, 58% 50%, 93% 92%, 7% 92%, 42% 50%)",
          }}
        />
      );
    case "bowtie":
      return (
        <span
          className="block"
          style={{
            ...baseStyle,
            clipPath:
              "polygon(5% 10%, 43% 10%, 50% 43%, 57% 10%, 95% 10%, 61% 50%, 95% 90%, 57% 90%, 50% 57%, 43% 90%, 5% 90%, 39% 50%)",
          }}
        />
      );
    case "circle":
    default:
      return <span className="block rounded-full" style={baseStyle} />;
  }
}

/* ============================================================
   CONTROLE DESLIZANTE (RANGE) - UX PERFEITO (Com Tailwind)
   ============================================================ */

function RangeControl({ label, value, min, max, step, display, onChange }: RangeControlProps) {
  // Calcula a porcentagem para preencher o rastro do slider
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <label className="flex flex-col justify-center rounded-md border border-border-subtle bg-surface-01 px-2.5 py-2 transition-all hover:border-primary-soft hover:bg-surface-02 group">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-text-secondary uppercase group-hover:text-primary transition-colors">
          {label}
        </span>
        <span className="rounded bg-primary-soft px-1 py-0.5 text-[10px] font-bold text-primary">
          {display}
        </span>
      </div>

      <div className="relative flex h-3 w-full items-center cursor-pointer">
        {/* Fundo do Slider + Rastro (Track customizado que respeita o tema) */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-border-default">
          <div
            className="h-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input Range Invisível (Recebe os cliques/arrastos e mostra só o thumb) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="
            absolute h-full w-full appearance-none bg-transparent outline-none
            [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125
          "
        />
      </div>
    </label>
  );
}

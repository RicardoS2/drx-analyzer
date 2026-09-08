"use client";

import { useState } from "react";

import { Download } from "@carbon/icons-react";

import type { PlotlyHTMLElement } from "plotly.js";

/* ============================================================
   PRESETS DE TAMANHO
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
  {
    label: "2400 × 1350",
    width: 2400,
    height: 1350,
  },
];

/* ============================================================
   ESCALAS DE EXPORTAÇÃO
   ============================================================ */

const SCALE_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16] as const;

/* ============================================================
   PROPS
   ============================================================ */

interface ChartExportProps {
  plotElement: PlotlyHTMLElement | null;
  onClose: () => void;
}

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function ChartExport({ plotElement, onClose }: ChartExportProps) {
  /* ==========================================================
     ESTADO
     ========================================================== */

  const [width, setWidth] = useState(2000);

  const [height, setHeight] = useState(1200);

  /*
   * Escala inicial.
   * O usuário pode escolher de 1x até 16x.
   */
  const [scale, setScale] = useState<number>(4);

  const [exporting, setExporting] = useState(false);

  /* ==========================================================
     LARGURA
     ========================================================== */

  const updateWidth = (value: string) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    setWidth(Math.min(10000, Math.max(300, Math.round(parsed))));
  };

  /* ==========================================================
     ALTURA
     ========================================================== */

  const updateHeight = (value: string) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    setHeight(Math.min(10000, Math.max(200, Math.round(parsed))));
  };

  /* ==========================================================
     EXPORTAÇÃO
     ========================================================== */

  const exportImage = async (format: "png" | "svg") => {
    if (!plotElement) {
      return;
    }

    setExporting(true);

    try {
      // eslint-disable-next-line @next/next/no-assign-module-variable
      const module = await import("plotly.js-dist-min");

      const Plotly = module.default ?? module;

      await Plotly.downloadImage(plotElement, {
        format,

        filename: `grafico_drx_${width}x${height}_${scale}x`,

        width,

        height,

        /*
         * Permite realmente usar 1x até 16x.
         *
         * 1x  = tamanho original
         * 2x  = 2 vezes
         * 3x  = 3 vezes
         * ...
         * 16x = 16 vezes
         */
        scale: Math.max(1, Math.min(16, scale)),
      });

      onClose();
    } finally {
      setExporting(false);
    }
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="flex flex-col gap-6">
      {/* ======================================================
          TAMANHO
          ====================================================== */}

      <section>
        <span
          className="
            mb-3
            block
            text-xs
            font-semibold
            uppercase
            tracking-wider
            text-text-secondary
          "
        >
          Predefinições de tamanho
        </span>

        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
          "
        >
          {EXPORT_PRESETS.map((preset) => {
            const selected = width === preset.width && height === preset.height;

            return (
              <button
                key={preset.label}
                type="button"
                disabled={exporting}
                onClick={() => {
                  setWidth(preset.width);
                  setHeight(preset.height);
                }}
                className={`
                  rounded-md
                  border
                  px-3
                  py-2.5
                  text-sm
                  font-medium
                  outline-none
                  transition-all

                  focus-visible:ring-2
                  focus-visible:ring-primary
                  focus-visible:ring-offset-1

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  ${
                    selected
                      ? `
                        border-primary
                        bg-primary
                        text-white
                        shadow-md
                      `
                      : `
                        border-border-subtle
                        bg-surface
                        text-text-primary

                        hover:border-border-strong
                        hover:bg-surface-02
                      `
                  }
                `}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ======================================================
          DIMENSÕES
          ====================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-4
        "
      >
        <label className="block">
          <span
            className="
              mb-2
              block
              text-xs
              font-semibold
              text-text-secondary
            "
          >
            Largura (px)
          </span>

          <input
            type="number"
            min={300}
            max={10000}
            step={100}
            value={width}
            disabled={exporting}
            onChange={(event) => {
              updateWidth(event.target.value);
            }}
            className="
              leaf-input
              w-full
            "
          />
        </label>

        <label className="block">
          <span
            className="
              mb-2
              block
              text-xs
              font-semibold
              text-text-secondary
            "
          >
            Altura (px)
          </span>

          <input
            type="number"
            min={200}
            max={10000}
            step={100}
            value={height}
            disabled={exporting}
            onChange={(event) => {
              updateHeight(event.target.value);
            }}
            className="
              leaf-input
              w-full
            "
          />
        </label>
      </div>

      {/* ======================================================
          QUALIDADE
          ====================================================== */}

      <section>
        <span
          className="
            mb-2
            block
            text-xs
            font-semibold
            text-text-secondary
          "
        >
          Qualidade de exportação
        </span>

        <select
          value={scale}
          disabled={exporting}
          onChange={(event) => {
            setScale(Number(event.target.value));
          }}
          className="
            leaf-select
            w-full
          "
        >
          {SCALE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}x Resolução
              {value === 1
                ? " — Padrão"
                : value === 2
                  ? " — Boa"
                  : value === 3
                    ? " — Alta"
                    : value === 4
                      ? " — Muito alta"
                      : value === 16
                        ? " — Máxima"
                        : value >= 10
                          ? " — Extrema"
                          : value >= 8
                            ? " — Muito alta"
                            : " — Alta"}
            </option>
          ))}
        </select>

        <p
          className="
            mt-2
            text-xs
            leading-5
            text-text-secondary
          "
        >
          A escala multiplica a resolução de saída do gráfico.
        </p>
      </section>

      {/* ======================================================
          RESUMO
          ====================================================== */}

      <div
        className="
          border
          border-border-subtle
          bg-surface-02
          px-4
          py-3
        "
      >
        <div
          className="
            text-xs
            font-semibold
            text-text-secondary
          "
        >
          Saída selecionada
        </div>

        <div
          className="
            mt-1
            text-sm
            font-medium
            text-text-primary
          "
        >
          {width} × {height} px · {scale}x
        </div>

        <div
          className="
            mt-1
            text-xs
            text-text-secondary
          "
        >
          PNG: resolução raster em {scale}x.
        </div>

        <div
          className="
            text-xs
            text-text-secondary
          "
        >
          SVG: saída vetorial.
        </div>
      </div>

      {/* ======================================================
          BOTÕES
          ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
        "
      >
        <button
          type="button"
          disabled={exporting || !plotElement}
          onClick={() => {
            void exportImage("png");
          }}
          className="
            leaf-primary-button
            flex
            w-full
            items-center
            justify-center
            gap-2
            py-3
            text-sm
          "
        >
          <Download size={18} aria-hidden={true} />

          {exporting ? "Gerando..." : "Baixar PNG"}
        </button>

        <button
          type="button"
          disabled={exporting || !plotElement}
          onClick={() => {
            void exportImage("svg");
          }}
          className="
            leaf-secondary-button
            flex
            w-full
            items-center
            justify-center
            gap-2
            py-3
            text-sm
          "
        >
          <Download size={18} aria-hidden={true} />

          {exporting ? "Gerando..." : "Baixar SVG"}
        </button>
      </div>
    </div>
  );
}

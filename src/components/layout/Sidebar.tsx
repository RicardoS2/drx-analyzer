"use client";

import React from "react";

import {
  Upload,
  Settings2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Presentation,
} from "lucide-react";

import { AppState, ConfigState } from "@/types";

interface Props {
  state: AppState;
  onFileUpload: (type: "drx" | "peak" | "phase", file: File) => void;
  onConfigChange: (config: Partial<ConfigState>) => void;
}

type ExtendedConfig = ConfigState & {
  labelType?: "name" | "formula";
  articleMode?: boolean;
  hideAxes?: boolean;
  smoothLine?: boolean;
};

// ============================================================
// COMPONENTE: CUSTOM SWITCH
// ============================================================

interface CustomSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CustomSwitch({ label, checked, onChange }: CustomSwitchProps) {
  return (
    <label className="group flex cursor-pointer items-center justify-between py-1.5">
      <span
        className="
          text-sm
          font-medium
          text-[#353638]
          transition-colors
          group-hover:text-[#8C8478]
        "
      >
        {label}
      </span>

      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />

        <div
          className="
            relative
            h-5
            w-10
            rounded-full
            bg-[#C9C5BC]
            transition-colors
            peer-checked:bg-[#2563EB]
            peer-checked:after:translate-x-full
            peer-checked:after:border-white
            after:absolute
            after:left-0.5
            after:top-0.5
            after:h-4
            after:w-4
            after:rounded-full
            after:border
            after:border-gray-300
            after:bg-white
            after:transition-all
            after:content-['']
          "
        />
      </div>
    </label>
  );
}

// ============================================================
// COMPONENTE: STATUS DOS ARQUIVOS
//
// IMPORTANTE:
// Este componente está FORA do Sidebar.
// Isso elimina react-hooks/static-components.
// ============================================================

interface FileStatusProps {
  loaded: boolean;
  label: string;
}

function FileStatus({ loaded, label }: FileStatusProps) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-lg
        border
        border-[#C9C5BC]
        bg-[#E8E6E1]
        p-3
        text-sm
        shadow-sm
      "
    >
      <span className="font-medium text-[#353638]">{label}</span>

      {loaded ? (
        <CheckCircle2 className="h-5 w-5 text-[#2563EB]" />
      ) : (
        <XCircle className="h-5 w-5 text-[#8C8478]" />
      )}
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar({
  state,
  onFileUpload,
  onConfigChange,
}: Props) {
  const config = state.config as ExtendedConfig;

  return (
    <div
      className="
        flex
        w-full
        shrink-0
        flex-col
        gap-8
        overflow-y-auto
        border-r
        border-[#C9C5BC]
        bg-[#F8F7F4]
        p-5
        md:w-80
      "
    >
      {/* ======================================================
          IMPORTAÇÃO DE DADOS
          ====================================================== */}

      <div>
        <h3
          className="
            mb-5
            flex
            items-center
            gap-2
            font-bold
            text-[#353638]
          "
        >
          <Upload className="h-5 w-5" />
          Importação de Dados
        </h3>

        <div className="space-y-4">
          {/* DIFRATOGRAMA */}

          <div className="group">
            <label
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#8C8478]
              "
            >
              Difratograma (.txt, .dat)
            </label>

            <input
              type="file"
              accept=".txt,.dat,.asc"
              className="
                block
                w-full
                cursor-pointer
                text-sm
                text-[#8C8478]
                transition-all
                file:mr-4
                file:cursor-pointer
                file:rounded-lg
                file:border
                file:border-[#C9C5BC]
                file:bg-[#E8E6E1]
                file:px-4
                file:py-2
                file:text-xs
                file:font-semibold
                file:text-[#353638]
                hover:file:bg-[#C9C5BC]
              "
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  onFileUpload("drx", file);
                }
              }}
            />
          </div>

          {/* PEAK LIST */}

          <div className="group">
            <label
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#8C8478]
              "
            >
              Peak List (.txt, .csv)
            </label>

            <input
              type="file"
              accept=".txt,.csv"
              className="
                block
                w-full
                cursor-pointer
                text-sm
                text-[#8C8478]
                transition-all
                file:mr-4
                file:cursor-pointer
                file:rounded-lg
                file:border
                file:border-[#C9C5BC]
                file:bg-[#E8E6E1]
                file:px-4
                file:py-2
                file:text-xs
                file:font-semibold
                file:text-[#353638]
                hover:file:bg-[#C9C5BC]
              "
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  onFileUpload("peak", file);
                }
              }}
            />
          </div>

          {/* PHASE LIST */}

          <div className="group">
            <label
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#8C8478]
              "
            >
              Phase List (.txt, .csv)
            </label>

            <input
              type="file"
              accept=".txt,.csv"
              className="
                block
                w-full
                cursor-pointer
                text-sm
                text-[#8C8478]
                transition-all
                file:mr-4
                file:cursor-pointer
                file:rounded-lg
                file:border
                file:border-[#C9C5BC]
                file:bg-[#E8E6E1]
                file:px-4
                file:py-2
                file:text-xs
                file:font-semibold
                file:text-[#353638]
                hover:file:bg-[#C9C5BC]
              "
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  onFileUpload("phase", file);
                }
              }}
            />
          </div>
        </div>

        {/* ====================================================
            STATUS
            ==================================================== */}

        <div className="mt-6 space-y-2.5">
          <FileStatus loaded={state.filesLoaded.drx} label="Difratograma" />

          <FileStatus loaded={state.filesLoaded.peak} label="Peak List" />

          <FileStatus loaded={state.filesLoaded.phase} label="Phase List" />
        </div>
      </div>

      {/* ======================================================
          CONFIGURAÇÃO VISUAL
          ====================================================== */}

      <div
        className="
          border-t
          border-[#C9C5BC]
          pt-6
        "
      >
        <h3
          className="
            mb-5
            flex
            items-center
            gap-2
            font-bold
            text-[#353638]
          "
        >
          <Settings2 className="h-5 w-5" />
          Configuração Visual
        </h3>

        <div className="space-y-6">
          {/* ==================================================
              RÓTULO DAS FASES
              ================================================== */}

          <div>
            <label
              className="
                mb-2
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#353638]
              "
            >
              <Presentation className="h-4 w-4 text-[#8C8478]" />
              Rótulo das Fases
            </label>

            <select
              value={config.labelType ?? "name"}
              onChange={(event) => {
                const value = event.target.value as "name" | "formula";

                onConfigChange({
                  labelType: value,
                });
              }}
              className="
                w-full
                cursor-pointer
                rounded-lg
                border
                border-[#C9C5BC]
                bg-[#E8E6E1]
                p-2.5
                text-sm
                font-medium
                text-[#353638]
                outline-none
                focus:ring-2
                focus:ring-[#2563EB]
              "
            >
              <option value="name">Nome do Composto</option>

              <option value="formula">Fórmula Química</option>
            </select>

            <p
              className="
                mt-1.5
                text-[11px]
                text-[#8C8478]
              "
            >
              Define o texto apresentado na legenda das fases.
            </p>
          </div>

          {/* ==================================================
              GERAL
              ================================================== */}

          <div
            className="
              flex
              flex-col
              gap-1
              rounded-xl
              border
              border-[#C9C5BC]
              bg-white
              p-3
              shadow-sm
            "
          >
            <h4
              className="
                mb-2
                text-xs
                font-bold
                uppercase
                text-[#8C8478]
              "
            >
              Geral
            </h4>

            <CustomSwitch
              label="Mostrar Grade"
              checked={config.showGrid ?? true}
              onChange={(checked) =>
                onConfigChange({
                  showGrid: checked,
                })
              }
            />

            <CustomSwitch
              label="Mostrar Legenda"
              checked={config.showLegend ?? true}
              onChange={(checked) =>
                onConfigChange({
                  showLegend: checked,
                })
              }
            />

            <CustomSwitch
              label="Marcar Fases no Gráfico"
              checked={config.showPhases ?? true}
              onChange={(checked) =>
                onConfigChange({
                  showPhases: checked,
                })
              }
            />
          </div>

          {/* ==================================================
              ESTILO PARA ARTIGO
              ================================================== */}

          <div
            className="
              flex
              flex-col
              gap-1
              rounded-xl
              border
              border-[#C9C5BC]
              bg-white
              p-3
              shadow-sm
            "
          >
            <h4
              className="
                mb-2
                flex
                items-center
                gap-1.5
                text-xs
                font-bold
                uppercase
                text-[#8C8478]
              "
            >
              <BookOpen className="h-3.5 w-3.5" />
              Estilo para Artigo
            </h4>

            <CustomSwitch
              label="Modo Artigo (P&B)"
              checked={config.articleMode ?? false}
              onChange={(checked) =>
                onConfigChange({
                  articleMode: checked,
                })
              }
            />

            <CustomSwitch
              label="Esconder Eixos"
              checked={config.hideAxes ?? false}
              onChange={(checked) =>
                onConfigChange({
                  hideAxes: checked,
                })
              }
            />

            <CustomSwitch
              label="Suavizar Linha (Spline)"
              checked={config.smoothLine ?? false}
              onChange={(checked) =>
                onConfigChange({
                  smoothLine: checked,
                })
              }
            />
          </div>

          {/* ==================================================
              INFORMAÇÃO ACADÊMICA
              ================================================== */}

          <div
            className="
              rounded-lg
              border
              border-[#C9C5BC]
              bg-[#E8E6E1]
              p-3
            "
          >
            <p
              className="
                text-[11px]
                leading-relaxed
                text-[#5F5A53]
              "
            >
              <strong>Recomendação para artigo:</strong> mantenha a suavização
              desativada para preservar visualmente a forma original dos picos
              de difração.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

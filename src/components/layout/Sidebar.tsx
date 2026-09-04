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

/* ============================================================
   COMPONENTE: CUSTOM SWITCH
   ============================================================ */

interface CustomSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CustomSwitch({ label, checked, onChange }: CustomSwitchProps) {
  return (
    <label
      className="
        group
        flex
        w-full
        min-w-0
        cursor-pointer
        items-center
        justify-between
        gap-3
        py-2
      "
    >
      <span
        className="
          min-w-0
          flex-1
          text-sm
          font-medium
          leading-snug
          text-[#353638]
          transition-colors
          group-hover:text-[#8C8478]
        "
      >
        {label}
      </span>

      <div className="relative inline-flex shrink-0 items-center">
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
            shrink-0
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

/* ============================================================
   COMPONENTE: STATUS DOS ARQUIVOS
   ============================================================ */

interface FileStatusProps {
  loaded: boolean;
  label: string;
}

function FileStatus({ loaded, label }: FileStatusProps) {
  return (
    <div
      className="
        flex
        min-w-0
        items-center
        justify-between
        gap-3
        rounded-lg
        border
        border-[#C9C5BC]
        bg-[#E8E6E1]
        p-3
        text-sm
        shadow-sm
      "
    >
      <span
        className="
          min-w-0
          font-medium
          text-[#353638]
        "
      >
        {label}
      </span>

      {loaded ? (
        <CheckCircle2
          className="
            h-5
            w-5
            shrink-0
            text-[#2563EB]
          "
        />
      ) : (
        <XCircle
          className="
            h-5
            w-5
            shrink-0
            text-[#8C8478]
          "
        />
      )}
    </div>
  );
}

/* ============================================================
   COMPONENTE: FILE INPUT
   Evita repetição e melhora responsividade
   ============================================================ */

interface FileInputProps {
  label: string;
  accept: string;
  onChange: (file: File) => void;
}

function FileInput({ label, accept, onChange }: FileInputProps) {
  return (
    <div className="group min-w-0">
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
        {label}
      </label>

      <input
        type="file"
        accept={accept}
        className="
          block
          w-full
          min-w-0
          max-w-full
          cursor-pointer
          overflow-hidden
          text-xs
          text-[#8C8478]
          transition-all

          file:mr-2
          file:cursor-pointer
          file:rounded-lg
          file:border
          file:border-[#C9C5BC]
          file:bg-[#E8E6E1]
          file:px-3
          file:py-2
          file:text-xs
          file:font-semibold
          file:text-[#353638]

          hover:file:bg-[#C9C5BC]

          sm:file:mr-4
          sm:file:px-4
        "
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onChange(file);
          }
        }}
      />
    </div>
  );
}

/* ============================================================
   SIDEBAR
   ============================================================ */

export default function Sidebar({
  state,
  onFileUpload,
  onConfigChange,
}: Props) {
  const config = state.config as ExtendedConfig;

  return (
    <aside
      className="
        flex
        w-full
        min-w-0
        max-w-full
        shrink-0
        flex-col

        overflow-x-hidden
        overflow-y-auto

        border-b
        border-[#C9C5BC]

        bg-[#F8F7F4]

        p-4

        sm:p-5

        lg:w-80
        lg:border-b-0
        lg:border-r

        lg:max-h-screen
      "
    >
      {/* ======================================================
          IMPORTAÇÃO DE DADOS
          ====================================================== */}

      <section className="min-w-0">
        <h3
          className="
            mb-4
            flex
            min-w-0
            items-center
            gap-2

            text-sm
            font-bold
            text-[#353638]

            sm:mb-5
            sm:text-base
          "
        >
          <Upload className="h-5 w-5 shrink-0" />

          <span className="min-w-0 ">Importação de Dados</span>
        </h3>

        <div className="space-y-4">
          {/* DIFRATOGRAMA */}

          <FileInput
            label="Difratograma (.txt, .dat)"
            accept=".txt,.dat,.asc"
            onChange={(file) => onFileUpload("drx", file)}
          />

          {/* PEAK LIST */}

          <FileInput
            label="Peak List (.txt, .csv)"
            accept=".txt,.csv"
            onChange={(file) => onFileUpload("peak", file)}
          />

          {/* PHASE LIST */}

          <FileInput
            label="Phase List (.txt, .csv)"
            accept=".txt,.csv"
            onChange={(file) => onFileUpload("phase", file)}
          />
        </div>

        {/* STATUS */}

        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-2.5
            sm:mt-6
          "
        >
          <FileStatus loaded={state.filesLoaded.drx} label="Difratograma" />

          <FileStatus loaded={state.filesLoaded.peak} label="Peak List" />

          <FileStatus loaded={state.filesLoaded.phase} label="Phase List" />
        </div>
      </section>

      {/* ======================================================
          CONFIGURAÇÃO VISUAL
          ====================================================== */}

      <section
        className="
          mt-7
          border-t
          border-[#C9C5BC]
          pt-5

          sm:mt-8
          sm:pt-6
        "
      >
        <h3
          className="
            mb-4
            flex
            min-w-0
            items-center
            gap-2

            text-sm
            font-bold
            text-[#353638]

            sm:mb-5
            sm:text-base
          "
        >
          <Settings2 className="h-5 w-5 shrink-0" />

          <span className="min-w-0 ">Configuração Visual</span>
        </h3>

        <div className="space-y-5 sm:space-y-6">
          {/* ==================================================
              RÓTULO DAS FASES
              ================================================== */}

          <div className="min-w-0">
            <label
              className="
                mb-2
                flex
                min-w-0
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#353638]
              "
            >
              <Presentation
                className="
                  h-4
                  w-4
                  shrink-0
                  text-[#8C8478]
                "
              />

              <span className="">Rótulo das Fases</span>
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
                min-w-0
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
                leading-relaxed
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
              min-w-0
              flex-col
              gap-1
              rounded-xl
              border
              border-[#C9C5BC]
              bg-white
              p-3
              shadow-sm

              sm:p-4
            "
          >
            <h4
              className="
                mb-2
                text-xs
                font-bold
                uppercase
                tracking-wide
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
              min-w-0
              flex-col
              gap-1
              rounded-xl
              border
              border-[#C9C5BC]
              bg-white
              p-3
              shadow-sm

              sm:p-4
            "
          >
            <h4
              className="
                mb-2
                flex
                min-w-0
                items-center
                gap-1.5
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-[#8C8478]
              "
            >
              <BookOpen
                className="
                  h-3.5
                  w-3.5
                  shrink-0
                "
              />

              <span className="">Estilo para Artigo</span>
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
              min-w-0
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
      </section>
    </aside>
  );
}

"use client";

import React, { useState } from "react";

import { Checkmark, Close, Download, Edit, StarFilled } from "@carbon/icons-react";

import type { AppState } from "@/types";

import { formatChemicalFormula, normalizeChemicalFormula } from "@/lib/chemicalFormula";

interface DataTablesProps {
  state: AppState;

  /**
   * Atualiza uma fase no estado global.
   *
   * A alteração do nome deve ser propagada para:
   * - state.phases
   * - state.correlations
   * - gráfico
   * - fases customizadas
   * - demais componentes que consumam a fase
   */
  onPhaseUpdate: (
    phaseCode: string,
    changes: {
      name?: string;
    },
  ) => void;
}

interface EditablePhaseCellProps {
  value: string;

  onSave: (value: string) => void;
}

/* ============================================================
   CÉLULA EDITÁVEL DA FASE
   ============================================================ */

function EditablePhaseCell({ value, onSave }: EditablePhaseCellProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [draftValue, setDraftValue] = useState(value);

  const startEditing = () => {
    setDraftValue(value);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftValue(value);
    setIsEditing(false);
  };

  const saveEditing = () => {
    const newValue = draftValue.trim();

    if (!newValue) {
      cancelEditing();
      return;
    }

    if (newValue !== value) {
      onSave(newValue);
    }

    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      saveEditing();

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      cancelEditing();
    }
  };

  /* ==========================================================
     MODO EDIÇÃO
     ========================================================== */

  if (isEditing) {
    return (
      <div
        className="
          flex
          w-full
          max-w-sm
          min-w-0
          items-center
          gap-2
        "
      >
        <input
          autoFocus
          type="text"
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="
            leaf-input
            min-w-0
            flex-1
          "
        />

        <button
          type="button"
          onClick={saveEditing}
          title="Salvar"
          aria-label="Salvar"
          className="
            inline-flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded
            border
            border-primary
            bg-primary
            text-white
            transition-colors
            hover:bg-primary-hover
            active:bg-primary-active
          "
        >
          <Checkmark size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={cancelEditing}
          title="Cancelar"
          aria-label="Cancelar"
          className="
            inline-flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded
            border
            border-border
            bg-surface
            text-icon-secondary
            transition-colors
            hover:bg-surface-02
            hover:text-icon-primary
          "
        >
          <Close size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  /* ==========================================================
     MODO NORMAL
     ========================================================== */

  return (
    <button
      type="button"
      onClick={startEditing}
      title="Clique para editar a fase"
      className="
        group
        inline-flex
        min-w-0
        max-w-full
        items-center
        gap-2
        text-left
        text-text-primary
        outline-none
      "
    >
      <span
        className="
          min-w-0
          truncate
        "
      >
        {value || "-"}
      </span>

      <Edit
        size={16}
        aria-hidden="true"
        className="
          shrink-0
          text-icon-secondary
          opacity-0
          transition-opacity
          group-hover:opacity-100
          group-focus-visible:opacity-100
        "
      />
    </button>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function DataTables({ state, onPhaseUpdate }: DataTablesProps) {
  if (state.correlations.length === 0 && state.phases.length === 0) {
    return null;
  }

  const labels = state.config.labels;

  /* ==========================================================
     EXPORTAÇÃO CSV
     ========================================================== */

  const exportCSV = () => {
    const header = "2Theta,Intensidade,Fase,Formula\n";

    const rows = state.correlations
      .map((correlation) => {
        /*
         * Nome atualizado da fase.
         *
         * Primeiro tentamos encontrar
         * o registro oficial em state.phases.
         */
        const phaseNames = correlation.phases
          .map((correlatedPhase) => {
            const currentPhase = state.phases.find((phase) => phase.code === correlatedPhase.code);

            return currentPhase?.name ?? correlatedPhase.name ?? "";
          })
          .join("; ");

        /*
         * Fórmula também vem
         * da fase oficial quando
         * disponível.
         */
        const formulas = correlation.phases
          .map((correlatedPhase) => {
            const currentPhase = state.phases.find((phase) => phase.code === correlatedPhase.code);

            return normalizeChemicalFormula(currentPhase?.formula ?? correlatedPhase.formula);
          })
          .join("; ");

        return [
          correlation.twoThetaReal,

          correlation.intensityReal,

          `"${phaseNames.replace(/"/g, '""')}"`,

          `"${formulas.replace(/"/g, '""')}"`,
        ].join(",");
      })
      .join("\n");

    const csvContent = header + rows;

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = labels.csvFileName || "drx_correlacoes.csv";

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(url);
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      className="
        mt-8
        w-full
        min-w-0
        overflow-hidden
        rounded-lg
        border
        border-border-subtle
        bg-surface
        shadow-sm
      "
    >
      {/* ======================================================
          CABEÇALHO
          ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-border-subtle
          bg-surface-02
          px-5
          py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <h3
            className="
              text-base
              font-semibold
              leading-6
              text-text-primary
            "
          >
            {labels.phasesSectionTitle}
          </h3>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-text-secondary
            "
          >
            Clique no nome da fase para editar.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="
            leaf-primary-button
            shrink-0
          "
        >
          <Download size={16} aria-hidden="true" />

          <span>{labels.exportCsv}</span>
        </button>
      </div>

      {/* ======================================================
          TABELA
          ====================================================== */}

      <div
        className="
          overflow-x-auto
        "
      >
        <table
          className="
            w-full
            min-w-180
            text-left
            text-sm
          "
        >
          {/* ==================================================
              CABEÇALHO
              ================================================== */}

          <thead
            className="
              border-b
              border-border-default
              bg-surface-03
            "
          >
            <tr>
              <th
                className="
                  px-5
                  py-3.5
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-text-secondary
                  sm:px-6
                "
              >
                {labels.phase}
              </th>

              <th
                className="
                  px-5
                  py-3.5
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-text-secondary
                  sm:px-6
                "
              >
                {labels.formula}
              </th>

              <th
                className="
                  px-5
                  py-3.5
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-text-secondary
                  sm:px-6
                "
              >
                {labels.referenceCode}
              </th>

              <th
                className="
                  px-5
                  py-3.5
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-text-secondary
                  sm:px-6
                "
              >
                {labels.score}
              </th>

              <th
                className="
                  px-5
                  py-3.5
                  text-center
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-text-secondary
                  sm:px-6
                "
              >
                {labels.correlatedPeaks}
              </th>
            </tr>
          </thead>

          {/* ==================================================
              CORPO
              ================================================== */}

          <tbody>
            {state.phases.map((phase) => {
              const isMain = phase.code === state.mainPhaseCode;

              /*
               * Conta quantos picos
               * realmente estão associados
               * a esta fase.
               */
              const correlatedPeaksCount = state.correlations.filter((correlation) =>
                correlation.phases.some((correlatedPhase) => correlatedPhase.code === phase.code),
              ).length;

              /*
               * Fases sem pico correlacionado
               * não são exibidas.
               */
              if (correlatedPeaksCount === 0) {
                return null;
              }

              return (
                <tr
                  key={phase.code}
                  className="
                      border-b
                      border-border-subtle
                      bg-surface
                      last:border-b-0
                      transition-colors
                      hover:bg-surface-02
                    "
                >
                  {/* ========================================
                        FASE
                        ======================================== */}

                  <td
                    className="
                        px-5
                        py-4
                        sm:px-6
                      "
                  >
                    <div
                      className="
                          flex
                          min-w-0
                          items-center
                          gap-2.5
                        "
                    >
                      {isMain && (
                        <span
                          className="
                              inline-flex
                              h-5
                              w-5
                              shrink-0
                              items-center
                              justify-center
                              rounded
                              bg-primary-soft
                              text-primary
                            "
                          title={labels.mainPhaseTooltip}
                          aria-label={labels.mainPhaseTooltip}
                        >
                          <StarFilled size={14} aria-hidden="true" />
                        </span>
                      )}

                      <EditablePhaseCell
                        value={phase.name}
                        onSave={(name) =>
                          onPhaseUpdate(phase.code, {
                            name,
                          })
                        }
                      />
                    </div>
                  </td>

                  {/* ========================================
                        FÓRMULA
                        ======================================== */}

                  <td
                    className="
                        px-5
                        py-4
                        sm:px-6
                      "
                  >
                    <div
                      className="
                          inline-flex
                          min-w-20
                          items-center
                          rounded
                          border
                          border-border-subtle
                          bg-surface-02
                          px-2.5
                          py-1.5
                          font-mono
                          text-sm
                          font-semibold
                          tracking-wide
                          text-text-primary
                        "
                    >
                      {formatChemicalFormula(phase.formula)}
                    </div>
                  </td>

                  {/* ========================================
                        CÓDIGO
                        ======================================== */}

                  <td
                    className="
                        px-5
                        py-4
                        sm:px-6
                      "
                  >
                    <span
                      className="
                          inline-flex
                          items-center
                          rounded
                          border
                          border-border-subtle
                          bg-surface-02
                          px-2
                          py-1
                          font-mono
                          text-xs
                          font-medium
                          text-text-secondary
                        "
                    >
                      {phase.code}
                    </span>
                  </td>

                  {/* ========================================
                        SCORE
                        ======================================== */}

                  <td
                    className="
                        px-5
                        py-4
                        sm:px-6
                      "
                  >
                    {phase.score !== undefined && phase.score !== null ? (
                      <span
                        className="
                            inline-flex
                            items-center
                            rounded
                            bg-primary-soft
                            px-2
                            py-1
                            text-xs
                            font-semibold
                            text-primary-active
                          "
                      >
                        {phase.score}
                      </span>
                    ) : (
                      <span
                        className="
                            text-text-placeholder
                          "
                      >
                        -
                      </span>
                    )}
                  </td>

                  {/* ========================================
                        PICOS CORRELACIONADOS
                        ======================================== */}

                  <td
                    className="
                        px-5
                        py-4
                        text-center
                        sm:px-6
                      "
                  >
                    <span
                      className="
                          inline-flex
                          h-8
                          min-w-8
                          items-center
                          justify-center
                          rounded
                          bg-primary-soft
                          px-2
                          font-semibold
                          text-primary-active
                        "
                    >
                      {correlatedPeaksCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

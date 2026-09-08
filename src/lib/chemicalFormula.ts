import React from "react";

type ChemicalFormulaInput = string | null | undefined;

/* ============================================================
   NORMALIZAÇÃO
   ============================================================ */

export function normalizeChemicalFormula(formula: ChemicalFormulaInput): string {
  if (formula === null || formula === undefined) {
    return "";
  }

  let result = String(formula);

  /*
   * Remove espaços.
   */
  result = result.trim().replace(/\s+/g, "");

  /*
   * Corrige vírgula decimal.
   *
   * Exemplo:
   * 2,50 -> 2.50
   */
  result = result.replace(/(\d),(\d)/g, "$1.$2");

  /*
   * Converte números decimais
   * para sua forma mais simples.
   *
   * 2.000 -> 2
   * 3.000 -> 3
   * 2.500 -> 2.5
   */
  result = result.replace(/\d+(?:\.\d+)+/g, (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return value;
    }

    return String(number);
  });

  /*
   * Remove zeros desnecessários.
   */
  result = result.replace(/\.0+(?=[A-Za-z(]|$)/g, "").replace(/,0+(?=[A-Za-z(]|$)/g, "");

  result = result
    .replace(/\.000+/g, "")
    .replace(/\.00+/g, "")
    .replace(/\.0+/g, "");

  result = result.replace(/,000+/g, "").replace(/,00+/g, "").replace(/,0+/g, "");

  /*
   * Remove ponto ou vírgula
   * soltos depois de inteiro.
   */
  result = result.replace(/(\d+)\.(?=[A-Za-z]|$)/g, "$1").replace(/(\d+),(?=[A-Za-z]|$)/g, "$1");

  return result.trim();
}

/* ============================================================
   FÓRMULA COMPACTA
   ============================================================ */

export function compactChemicalFormula(formula: ChemicalFormulaInput): string {
  const normalized = normalizeChemicalFormula(formula);

  if (!normalized) {
    return "";
  }

  return normalized;
}

/* ============================================================
   TEXTO NORMAL
   ============================================================ */

export function chemicalFormulaText(formula: ChemicalFormulaInput): string {
  return compactChemicalFormula(formula);
}

/* ============================================================
   SUBSCRITOS UNICODE
   ============================================================ */

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  ".": "·",
  ",": ",",
};

/**
 * Converte:
 *
 * O2Si2
 *
 * em:
 *
 * O₂Si₂
 *
 * Usado em contextos de texto.
 */
export function chemicalFormulaLegend(formula: ChemicalFormulaInput): string {
  const clean = chemicalFormulaText(formula);

  if (!clean) {
    return "";
  }

  return clean.replace(/[0-9.,]+/g, (number) =>
    number
      .split("")
      .map((char) => SUBSCRIPT_MAP[char] ?? char)
      .join(""),
  );
}

/* ============================================================
   LEGENDA PLOTLY
   ============================================================ */

/**
 * Gera a fórmula para a legenda
 * do Plotly.
 *
 * Os números ficam em:
 *
 * font-size: 0.4em
 *
 * Exemplos:
 *
 * O2Si2  -> O₂Si₂
 * Al2O3  -> Al₂O₃
 * Ca3SiO5 -> Ca₃SiO₅
 *
 * Porém, na legenda, os números
 * recebem 0.4em.
 */
export function chemicalFormulaLegendHtml(formula: ChemicalFormulaInput): string {
  const clean = chemicalFormulaText(formula);

  if (!clean) {
    return "";
  }

  /*
   * Escapa caracteres HTML
   * básicos antes de montar
   * a fórmula.
   */
  const escaped = clean
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  /*
   * Todo número da fórmula
   * vira um subscript com
   * 0.4em.
   *
   * Exemplo:
   *
   * O2Si2
   *
   * ->
   *
   * O<sub style="font-size:0.4em">2</sub>
   * Si<sub style="font-size:0.4em">2</sub>
   */
  return escaped.replace(
    /[0-9]+(?:\.[0-9]+)?/g,
    (number) => `<sub style="font-size:6em">${number}</sub>`,
  );
}

/* ============================================================
   FÓRMULA FORMATADA PARA A TABELA
   ============================================================ */

export function formatChemicalFormula(formula: ChemicalFormulaInput): React.ReactNode {
  const clean = chemicalFormulaText(formula);

  if (!clean) {
    return "-";
  }

  /*
   * Divide a fórmula em:
   *
   * texto
   * números
   */
  const parts = clean.split(/(\d+(?:\.\d+)?)/g).filter(Boolean);

  return React.createElement(
    React.Fragment,
    null,
    ...parts.map((part, index) => {
      /*
       * NÚMERO QUÍMICO
       *
       * Tamanho da tabela:
       * 0.83em
       */
      if (/^\d+(?:\.\d+)?$/.test(part)) {
        return React.createElement(
          "sub",
          {
            key: `number-${index}`,
            className: "align-sub text-[0.83em]",
          },
          part,
        );
      }

      /*
       * ELEMENTO QUÍMICO.
       */
      return React.createElement(
        "span",
        {
          key: `text-${index}`,
        },
        part,
      );
    }),
  );
}

/* ============================================================
   NORMALIZAÇÃO DE FASE
   ============================================================ */

export function normalizePhaseFormula<
  T extends {
    formula?: string | null;
  },
>(
  phase: T,
): T & {
  formula: string;
} {
  return {
    ...phase,

    formula: chemicalFormulaText(phase.formula),
  };
}

/* ============================================================
   NORMALIZAÇÃO DE VÁRIAS FASES
   ============================================================ */

export function normalizePhaseFormulas<
  T extends {
    formula?: string | null;
  },
>(
  phases: T[],
): Array<
  T & {
    formula: string;
  }
> {
  return phases.map(normalizePhaseFormula);
}

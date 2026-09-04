// src/types/index.ts

export interface DiffractogramPoint {
  twoTheta: number;
  intensity: number;
}

export interface PeakData {
  twoTheta: number;
  fwhm: number | null;
  area: number | null;
  matched: boolean;
  matchedBy: string[];
}

export interface PhaseData {
  code: string;
  name: string;
  formula: string;
  score?: number;
  semiQuant?: number;
}

export interface CorrelatedPhase {
  code: string;
  name: string;
  formula: string;
}

export interface CorrelationResult {
  twoThetaRef: number;
  twoThetaReal: number;
  intensityReal: number;
  phases: CorrelatedPhase[];
  fwhm: number | null;
  area: number | null;
}

export interface ConfigState {
  /**
   * Tolerância utilizada na correlação dos picos.
   */
  tolerance: number;

  /**
   * Fundo do gráfico.
   */
  background: "white" | "transparent";

  /**
   * Espessura da curva principal do difratograma.
   */
  curveThickness: number;

  /**
   * Tamanho dos marcadores dos picos.
   */
  markerSize: number;

  /**
   * Exibição da grade.
   */
  showGrid: boolean;

  /**
   * Exibição da legenda.
   */
  showLegend: boolean;

  /**
   * Exibição dos picos detectados.
   */
  showPeaks: boolean;

  /**
   * Exibição das fases correlacionadas.
   */
  showPhases: boolean;

  /**
   * Tipo de identificação exibida para as fases:
   * nome do composto ou fórmula química.
   */
  labelType: "name" | "formula";

  /**
   * Ativa o modo de gráfico para publicação/artigo científico.
   */
  articleMode: boolean;

  /**
   * Oculta os eixos do gráfico.
   */
  hideAxes: boolean;

  /**
   * Ativa o suavizamento visual da curva.
   */
  smoothLine: boolean;
}

export interface AppState {
  diffractogram: DiffractogramPoint[];

  peaks: PeakData[];

  phases: PhaseData[];

  correlations: CorrelationResult[];

  mainPhaseCode: string | null;

  config: ConfigState;

  filesLoaded: {
    drx: boolean;
    peak: boolean;
    phase: boolean;
  };

  error: string | null;
}

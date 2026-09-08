export const DEFAULT_PHASE_MARKER_SIZE = 8;

export const DEFAULT_PHASE_MARKER_HEIGHT = 60;

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

export type GraphFontFamily = "Arial" | "Times New Roman";

export interface GraphTypographyConfig {
  fontFamily: GraphFontFamily;

  legendFontSize: number;

  titleFontSize: number;

  xAxisTitleFontSize: number;

  yAxisTitleFontSize: number;

  titleText: string;

  xAxisTitle: string;

  yAxisTitle: string;
}

export interface GraphLineConfig {
  /*
   * Controles globais.
   */

  curveThickness: number;

  peakConnectorThickness: number;

  /*
   * Altura global dos marcadores.
   *
   * Uma fase pode sobrescrever esse
   * valor individualmente.
   */

  peakHeight: number;
}

/**
 * Personalização individual da fase.
 *
 * Todos os campos são opcionais porque
 * o gráfico possui valores padrão.
 */
export interface PhaseStyleConfig {
  symbol?: string;

  color?: string;

  symbolSize?: number;

  symbolHeight?: number;
}

/**
 * Mantido por compatibilidade.
 */
export interface ChartPhaseControl {
  code: string;

  name: string;

  formula: string;

  isMain: boolean;

  style: PhaseStyleConfig;
}

export interface LabelConfig {
  phasesSectionTitle: string;

  phase: string;

  formula: string;

  referenceCode: string;

  score: string;

  correlatedPeaks: string;

  exportCsv: string;

  csvFileName: string;

  mainPhaseTooltip: string;
}

export interface ConfigState {
  /*
   * Mantido para compatibilidade
   * com a lógica de análise.
   */
  tolerance: number;

  background: "white" | "transparent";

  typography: GraphTypographyConfig;

  lines: GraphLineConfig;

  labels: LabelConfig;

  showGrid: boolean;

  showLegend: boolean;

  showPeaks: boolean;

  showPhases: boolean;

  labelType: "name" | "formula";
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

export type InputFileType = "drx" | "peak" | "phase";

export interface ClassifiedFile {
  type: InputFileType;

  file: File;
}

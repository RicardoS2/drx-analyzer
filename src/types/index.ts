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
  tolerance: number;
  background: 'white' | 'transparent';
  curveThickness: number;
  markerSize: number;
  showGrid: boolean;
  showLegend: boolean;
  showPeaks: boolean;
  showPhases: boolean;
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

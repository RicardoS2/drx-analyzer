// src/lib/correlator.ts
import { DiffractogramPoint, PeakData, PhaseData, CorrelationResult } from '../types';

export function correlateData(
  diffractogram: DiffractogramPoint[],
  peaks: PeakData[],
  phases: PhaseData[],
  tolerance: number
): { correlations: CorrelationResult[], mainPhaseCode: string | null } {
  const phaseMap = new Map<string, PhaseData>();
  phases.forEach(p => phaseMap.set(p.code, p));

  const correlations: CorrelationResult[] = [];
  const phaseCount = new Map<string, number>();

  peaks.forEach(peak => {
    if (!peak.matched || peak.matchedBy.length === 0) return;

    const matchedPhases = peak.matchedBy
      .filter(code => phaseMap.has(code))
      .map(code => {
        const p = phaseMap.get(code)!;
        return { code: p.code, name: p.name, formula: p.formula };
      });

    if (matchedPhases.length === 0) return;

    // Encontrar o pico real no difratograma
    const minTheta = peak.twoTheta - tolerance;
    const maxTheta = peak.twoTheta + tolerance;

    let maxIntensity = -1;
    let realTwoTheta = peak.twoTheta;

    // Busca linear simplificada. Para performance extrema em JS, busca binária seria o ideal
    for (const point of diffractogram) {
      if (point.twoTheta > maxTheta) break;
      if (point.twoTheta >= minTheta && point.intensity > maxIntensity) {
        maxIntensity = point.intensity;
        realTwoTheta = point.twoTheta;
      }
    }

    if (maxIntensity > -1) {
      correlations.push({
        twoThetaRef: peak.twoTheta,
        twoThetaReal: realTwoTheta,
        intensityReal: maxIntensity,
        phases: matchedPhases,
        fwhm: peak.fwhm,
        area: peak.area
      });

      // Contagem para Fase Principal
      matchedPhases.forEach(p => {
        phaseCount.set(p.code, (phaseCount.get(p.code) || 0) + 1);
      });
    }
  });

  let mainPhaseCode = null;
  let maxCount = 0;
  for (const [code, count] of phaseCount.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mainPhaseCode = code;
    }
  }

  return { correlations, mainPhaseCode };
}

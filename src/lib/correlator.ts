// src/lib/correlator.ts
import {
  DiffractogramPoint,
  PeakData,
  PhaseData,
  CorrelationResult,
} from "../types";

export function correlateData(
  diffractogram: DiffractogramPoint[],
  peaks: PeakData[],
  phases: PhaseData[],
): { correlations: CorrelationResult[]; mainPhaseCode: string | null } {
  const phaseMap = new Map<string, PhaseData>();
  phases.forEach((p) => phaseMap.set(p.code, p));

  const correlations: CorrelationResult[] = [];
  const phaseCount = new Map<string, number>();

  peaks.forEach((peak) => {
    // Se o pico não foi associado a nenhuma fase, pula
    if (!peak.matched || peak.matchedBy.length === 0) return;

    const matchedPhases = peak.matchedBy
      .filter((code) => phaseMap.has(code))
      .map((code) => {
        const p = phaseMap.get(code)!;
        return { code: p.code, name: p.name, formula: p.formula };
      });

    if (matchedPhases.length === 0) return;

    // --- CORREÇÃO: Tolerância Saudável ---
    // Limpamos anomalias (FWHM absurdo > 1) e garantimos uma janela mínima de 0.1 e máxima de 0.3.
    // Isso impede que um pico gigante "roube" o marcador de um pico menor vizinho.
    const safeFwhm =
      peak.fwhm && peak.fwhm > 0 && peak.fwhm < 1 ? peak.fwhm : 0.15;
    const dynamicTolerance = Math.max(0.1, Math.min(safeFwhm, 0.3));

    const minTheta = peak.twoTheta - dynamicTolerance;
    const maxTheta = peak.twoTheta + dynamicTolerance;

    let maxIntensity = -1;
    let realTwoTheta = peak.twoTheta;

    // Fallback: Guarda sempre o ponto mais próximo
    let closestDist = Infinity;
    let closestIntensity = 0;
    let closestTheta = peak.twoTheta;

    // Varredura para encontrar o topo exato dentro do limite
    for (const point of diffractogram) {
      const dist = Math.abs(point.twoTheta - peak.twoTheta);
      if (dist < closestDist) {
        closestDist = dist;
        closestIntensity = point.intensity;
        closestTheta = point.twoTheta;
      }

      if (point.twoTheta >= minTheta && point.twoTheta <= maxTheta) {
        if (point.intensity > maxIntensity) {
          maxIntensity = point.intensity;
          realTwoTheta = point.twoTheta;
        }
      }
    }

    // Se falhar, usa o ponto mais perto absoluto
    if (maxIntensity === -1) {
      maxIntensity = closestIntensity;
      realTwoTheta = closestTheta;
    }

    correlations.push({
      twoThetaRef: peak.twoTheta,
      twoThetaReal: realTwoTheta,
      intensityReal: maxIntensity,
      phases: matchedPhases,
      fwhm: peak.fwhm,
      area: peak.area,
    });

    matchedPhases.forEach((p) => {
      phaseCount.set(p.code, (phaseCount.get(p.code) || 0) + 1);
    });
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

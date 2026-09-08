import { DiffractogramPoint, PeakData, PhaseData, CorrelationResult } from "../types";

export function correlateData(
  diffractogram: DiffractogramPoint[],
  peaks: PeakData[],
  phases: PhaseData[],
): {
  correlations: CorrelationResult[];
  mainPhaseCode: string | null;
} {
  const phaseMap = new Map<string, PhaseData>();

  phases.forEach((phase) => {
    phaseMap.set(phase.code, phase);
  });

  const correlations: CorrelationResult[] = [];

  /*
   * Usado somente para determinar
   * a fase principal.
   */
  const phaseCount = new Map<string, number>();

  for (const peak of peaks) {
    if (!peak.matched || !peak.matchedBy || peak.matchedBy.length === 0) {
      continue;
    }

    const matchedPhases = peak.matchedBy
      .filter((code) => phaseMap.has(code))
      .map((code) => {
        const phase = phaseMap.get(code)!;

        return {
          code: phase.code,
          name: phase.name,
          formula: phase.formula,
        };
      });

    if (matchedPhases.length === 0) {
      continue;
    }

    /*
     * ========================================================
     * TOLERÂNCIA DO PICO
     * ========================================================
     */

    const safeFwhm =
      peak.fwhm !== null && peak.fwhm !== undefined && peak.fwhm > 0 && peak.fwhm < 1
        ? peak.fwhm
        : 0.15;

    const dynamicTolerance = Math.max(0.1, Math.min(safeFwhm, 0.3));

    const minTheta = peak.twoTheta - dynamicTolerance;

    const maxTheta = peak.twoTheta + dynamicTolerance;

    /*
     * ========================================================
     * LOCALIZAÇÃO DO PICO REAL
     * ========================================================
     */

    let maxIntensity = -Infinity;

    let realTwoTheta = peak.twoTheta;

    let closestDistance = Infinity;

    let closestIntensity = 0;

    let closestTheta = peak.twoTheta;

    for (const point of diffractogram) {
      const distance = Math.abs(point.twoTheta - peak.twoTheta);

      if (distance < closestDistance) {
        closestDistance = distance;

        closestIntensity = point.intensity;

        closestTheta = point.twoTheta;
      }

      if (
        point.twoTheta >= minTheta &&
        point.twoTheta <= maxTheta &&
        point.intensity > maxIntensity
      ) {
        maxIntensity = point.intensity;

        realTwoTheta = point.twoTheta;
      }
    }

    /*
     * Nenhum ponto dentro da janela:
     * usa o ponto mais próximo.
     */

    if (maxIntensity === -Infinity) {
      maxIntensity = closestIntensity;

      realTwoTheta = closestTheta;
    }

    /*
     * ========================================================
     * CORRELAÇÃO
     * ========================================================
     */

    correlations.push({
      twoThetaRef: peak.twoTheta,

      twoThetaReal: realTwoTheta,

      intensityReal: maxIntensity,

      phases: matchedPhases,

      fwhm: peak.fwhm,

      area: peak.area,
    });

    /*
     * ========================================================
     * CONTAGEM DA FASE
     * ========================================================
     *
     * Continua sendo usada somente para
     * escolher a fase principal.
     */

    for (const phase of matchedPhases) {
      const currentCount = phaseCount.get(phase.code) ?? 0;

      phaseCount.set(phase.code, currentCount + 1);
    }
  }

  /*
   * ========================================================
   * FASE PRINCIPAL
   * ========================================================
   *
   * A fase com maior número de picos
   * correlacionados é a principal.
   */

  let mainPhaseCode: string | null = null;

  let maxCount = 0;

  for (const phase of phases) {
    const count = phaseCount.get(phase.code) ?? 0;

    if (count > maxCount) {
      maxCount = count;

      mainPhaseCode = phase.code;
    }
  }

  return {
    correlations,
    mainPhaseCode,
  };
}

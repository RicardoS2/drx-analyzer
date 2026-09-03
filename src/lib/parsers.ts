// src/lib/parsers.ts
import { DiffractogramPoint, PeakData, PhaseData } from '../types';

function parseNumber(val: string): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[^0-9.\-eE+]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '+' || cleaned.toLowerCase() === 'e') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export async function parseDiffractogram(file: File): Promise<DiffractogramPoint[]> {
  const text = await file.text();
  const lines = text.split('\n');
  const data: DiffractogramPoint[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const cleanLine = lines[i].trim();
    if (!cleanLine || /[a-df-zA-DF-Z]/.test(cleanLine)) continue;

    let normalizedLine = cleanLine;
    let separatorPattern = /[\s,;\t]+/;

    if (cleanLine.includes('\t') || cleanLine.includes(';')) {
      normalizedLine = cleanLine.replace(/,/g, '.');
      separatorPattern = /[\s;\t]+/;
    } else if (cleanLine.includes(' ')) {
      normalizedLine = cleanLine.replace(/,/g, '.');
      separatorPattern = /[\s]+/;
    }

    const parts = normalizedLine.split(separatorPattern).filter(p => p !== '');
    if (parts.length < 2) continue;

    const twoTheta = parseNumber(parts[0]);
    const intensity = parseNumber(parts[1]);

    if (twoTheta !== null && intensity !== null && !seen.has(twoTheta)) {
      data.push({ twoTheta, intensity });
      seen.add(twoTheta);
    }
  }

  if (data.length === 0) throw new Error("Não foi possível extrair dados válidos do difratograma.");
  return data.sort((a, b) => a.twoTheta - b.twoTheta);
}

export async function parsePeakList(file: File): Promise<PeakData[]> {
  const text = await file.text();
  const lines = text.split('\n');
  const data: PeakData[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // CORREÇÃO: Removemos a restrição 'Search Peaks'.
    // Agora pulamos apenas linhas vazias ou o cabeçalho principal que começa com "No."
    if (!line || line.toLowerCase().startsWith("no.")) {
      continue;
    }

    const separator = line.includes(';') ? ';' : (line.includes('\t') ? '\t' : ',');
    const parts = line.split(separator).map(s => s.trim().replace(/['"]/g, ''));

    if (parts.length < 3) continue;

    let posStr = parts[1];

    if (separator === ',' && parts.length > 2 && /^\d+$/.test(parts[2]) && !parts[1].includes('.')) {
       posStr = parts[1] + '.' + parts[2];
    } else {
       posStr = posStr.replace(',', '.');
    }

    const twoTheta = parseNumber(posStr);

    // Se a posição não for um número válido, ele simplesmente ignora essa linha
    if (twoTheta === null) continue;

    const trueFalseIdx = parts.findIndex(p => p.toLowerCase() === 'true' || p.toLowerCase() === 'false');
    let matched = false;
    let matchedBy: string[] = [];

    if (trueFalseIdx !== -1) {
      matched = parts[trueFalseIdx].toLowerCase() === 'true';
      if (matched && parts.length > trueFalseIdx + 1) {
        const codesStr = parts[trueFalseIdx + 1];
        if (codesStr && codesStr.trim() !== '') {
          matchedBy = codesStr.split(/[|/ ;]+/).map(s => s.trim()).filter(Boolean);
        }
      }
    }

    data.push({
      twoTheta,
      fwhm: null,
      area: null,
      matched,
      matchedBy
    });
  }

  if (data.length === 0) throw new Error("Nenhum pico numérico encontrado no Peak List.");
  return data;
}

export async function parsePhaseList(file: File): Promise<PhaseData[]> {
  const text = await file.text();
  const lines = text.split('\n');
  const data: PhaseData[] = [];

  for (const line of lines) {
    if (line.toLowerCase().includes("ref. code") || line.toLowerCase().includes("compound")) continue;

    const separator = line.includes(';') ? ';' : (line.includes('\t') ? '\t' : ',');
    const parts = line.split(separator).map(s => s.trim().replace(/['"]/g, ''));

    if (parts.length < 3) continue;

    let codeIdx = parts.findIndex(p => /^\d+-\d+-\d+$/.test(p) || (isNaN(Number(p.replace(',', '.'))) && p.includes('-')));

    if (codeIdx === -1) {
      codeIdx = parts.length >= 5 ? 2 : 1;
    }

    const code = parts[codeIdx];
    if (!code || !isNaN(Number(code.replace(',', '.')))) continue;

    data.push({
      code: code,
      name: parts[codeIdx + 1] || 'Fase Desconhecida',
      formula: parts[codeIdx + 2] || '',
      score: undefined,
      semiQuant: undefined
    });
  }

  if (data.length === 0) throw new Error("Nenhuma fase válida encontrada no Phase List.");
  return data;
}

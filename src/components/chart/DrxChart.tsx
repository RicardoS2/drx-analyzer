'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AppState } from '@/types';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-[#F8F7F4] border border-[#C9C5BC] rounded-xl text-[#8C8478]">
      Carregando gráfico científico...
    </div>
  )
});

const SYMBOLS = ['square', 'triangle-up', 'diamond', 'cross', 'x', 'triangle-down', 'pentagon', 'hexagon', 'circle-open'];
// Cores sóbrias e acadêmicas que contrastam bem com o Off-White
const COLORS = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4B5563', '#9333EA'];

interface Props {
  state: AppState;
}

export default function DrxChart({ state }: Props) {
  const { diffractogram, correlations, mainPhaseCode, config, phases } = state;

  const colors = {
    text: '#353638',           // Ink
    grid: '#E8E6E1',           // Mist
    axis: '#8C8478',           // Taupe
    bg: '#F8F7F4',             // Off White
    paperBg: '#F8F7F4',
    legendBg: 'rgba(248, 247, 244, 0.95)',
    tooltipBg: '#F8F7F4',
    tooltipBorder: '#C9C5BC',  // Stone
  };

  const data = useMemo(() => {
    const traces: any[] = [];

    const maxIntensity = diffractogram.length > 0 ? Math.max(...diffractogram.map(d => d.intensity)) : 1000;
    const yOffsetStep = maxIntensity * 0.05;

    if (diffractogram.length > 0) {
      traces.push({
        x: diffractogram.map(d => d.twoTheta),
        y: diffractogram.map(d => d.intensity),
        type: 'scattergl',
        mode: 'lines',
        name: 'DRX',
        line: { color: '#353638', width: config.curveThickness }, // Ink para a curva principal
        hoverinfo: 'x+y',
        showlegend: config.showLegend
      });
    }

    if (config.showPhases && correlations.length > 0) {
      const phaseGroups = new Map<string, {
        x: number[], y: number[], drop: number[], peakY: number[],
        names: string[], formulas: string[], codes: string[]
      }>();

      correlations.forEach(corr => {
        corr.phases.forEach((phase, index) => {
          if (!phaseGroups.has(phase.code)) {
            phaseGroups.set(phase.code, { x: [], y: [], drop: [], peakY: [], names: [], formulas: [], codes: [] });
          }
          const group = phaseGroups.get(phase.code)!;

          const verticalDrop = yOffsetStep * (index + 1);
          const finalY = corr.intensityReal + verticalDrop;

          group.x.push(corr.twoThetaReal);
          group.y.push(finalY);
          group.drop.push(verticalDrop);
          group.peakY.push(corr.intensityReal);
          group.names.push(phase.name);
          group.formulas.push(phase.formula);
          group.codes.push(phase.code);
        });
      });

      let colorIdx = 0;
      let symbolIdx = 0;

      phaseGroups.forEach((group, code) => {
        const isMain = code === mainPhaseCode;
        const color = isMain ? '#B91C1C' : COLORS[colorIdx % COLORS.length]; // Vermelho fechado para a principal
        const symbol = isMain ? 'star' : SYMBOLS[symbolIdx % SYMBOLS.length];
        const size = isMain ? config.markerSize + 4 : config.markerSize;
        const markerBorder = isMain ? '#353638' : '#F8F7F4';

        if (!isMain) { colorIdx++; symbolIdx++; }

        traces.push({
          x: group.x,
          y: group.y,
          mode: 'markers',
          type: 'scatter',
          name: group.names[0],
          marker: {
            symbol: symbol,
            color: color,
            size: size,
            line: { color: markerBorder, width: 1.5 }
          },
          error_y: {
            type: 'data',
            symmetric: false,
            array: group.drop.map(() => 0),
            arrayminus: group.drop,
            visible: true,
            color: color,
            thickness: isMain ? 1.5 : 1,
            width: 0
          },
          hovertemplate: `<b>%{customdata[0]}</b><br>Fórmula: %{customdata[1]}<br>Ref: %{customdata[2]}<br>2θ: %{x:.3f}°<br>Int. do Pico: %{customdata[3]}<extra></extra>`,
          customdata: group.names.map((_, i) => [group.names[i], group.formulas[i], group.codes[i], group.peakY[i]]),
          showlegend: config.showLegend
        });
      });
    }

    return traces;
  }, [diffractogram, correlations, mainPhaseCode, config, phases]);

  const layout: any = {
    autosize: true,
    height: 600,
    margin: { l: 70, r: 30, t: 40, b: 60 },
    paper_bgcolor: colors.paperBg,
    plot_bgcolor: colors.bg,
    font: { family: '"Inter", "Segoe UI", system-ui, sans-serif', size: 13, color: colors.text },
    xaxis: {
      title: { text: '2θ (°)', font: { size: 14, weight: 'bold' } },
      showgrid: config.showGrid,
      gridcolor: colors.grid,
      zeroline: false,
      mirror: 'ticks',
      ticklen: 6,
      linecolor: colors.axis,
      tickcolor: colors.axis,
      linewidth: 1.5
    },
    yaxis: {
      title: { text: 'Intensidade (counts)', font: { size: 14, weight: 'bold' } },
      showgrid: config.showGrid,
      gridcolor: colors.grid,
      zeroline: false,
      mirror: 'ticks',
      ticklen: 6,
      linecolor: colors.axis,
      tickcolor: colors.axis,
      linewidth: 1.5
    },
    legend: {
      x: 0.99,
      y: 0.99,
      xanchor: 'right',
      yanchor: 'top',
      bgcolor: colors.legendBg,
      bordercolor: colors.axis,
      borderwidth: 1,
      font: { color: colors.text }
    },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: colors.tooltipBg,
      font: { color: colors.text, family: '"Inter", "Segoe UI", system-ui, sans-serif' },
      bordercolor: colors.tooltipBorder,
    }
  };

  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#C9C5BC] bg-[#F8F7F4] mb-8 shadow-xs">
      <Plot
        data={data}
        layout={layout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{
          responsive: true,
          displaylogo: false,
          toImageButtonOptions: {
            format: 'png',
            filename: 'drx_export_editorial',
            height: 1200,
            width: 1800,
            scale: 2
          },
          modeBarButtonsToRemove: ['lasso2d', 'select2d']
        }}
      />
    </div>
  );
}

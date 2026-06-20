'use client';

import html2canvas from 'html2canvas';

export async function downloadPredictionCard(element: HTMLElement, filename = 'wc26-oracle-prediction.png') {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function encodedWeights(weights: Record<string, number>) {
  const params = new URLSearchParams();
  Object.entries(weights).forEach(([key, value]) => params.set(key, value.toFixed(4)));
  return `?${params.toString()}`;
}

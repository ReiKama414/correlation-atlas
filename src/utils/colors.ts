/**
 * Color and styling utilities for Correlation Atlas charts
 */

export const GROUP_COLORS = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
];

export function getGroupColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length];
}

/**
 * Maps correlation coefficient r in [-1, 1] to diverging color with Light/Dark contrast adaptation
 */
export function getCorrelationColor(
  r: number,
  theme: 'coolwarm' | 'emerald' | 'viridis' | 'sunset' = 'coolwarm',
  isDark: boolean = true
): { bg: string; text: string } {
  // Clamp r
  const clamped = Math.max(-1, Math.min(1, r));
  const neutralR = isDark ? 30 : 248;
  const neutralG = isDark ? 41 : 250;
  const neutralB = isDark ? 59 : 252;

  if (theme === 'coolwarm') {
    // Negative: Blue (#2563eb) -> Neutral -> Positive: Rose/Red (#e11d48)
    if (clamped < 0) {
      const t = Math.abs(clamped);
      const rVal = Math.round(neutralR - t * (neutralR - 37));
      const gVal = Math.round(neutralG - t * (neutralG - 99));
      const bVal = Math.round(neutralB - t * (neutralB - 235));
      const text = t > 0.45 ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a';
      return { bg: `rgb(${rVal}, ${gVal}, ${bVal})`, text };
    } else {
      const t = clamped;
      const rVal = Math.round(neutralR - t * (neutralR - 225));
      const gVal = Math.round(neutralG - t * (neutralG - 29));
      const bVal = Math.round(neutralB - t * (neutralB - 72));
      const text = t > 0.45 ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a';
      return { bg: `rgb(${rVal}, ${gVal}, ${bVal})`, text };
    }
  }

  if (theme === 'emerald') {
    // Negative: Purple (#9333ea) -> Neutral -> Positive: Emerald (#10b981)
    if (clamped < 0) {
      const t = Math.abs(clamped);
      const rVal = Math.round(neutralR - t * (neutralR - 147));
      const gVal = Math.round(neutralG - t * (neutralG - 51));
      const bVal = Math.round(neutralB - t * (neutralB - 234));
      const text = t > 0.45 ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a';
      return { bg: `rgb(${rVal}, ${gVal}, ${bVal})`, text };
    } else {
      const t = clamped;
      const rVal = Math.round(neutralR - t * (neutralR - 16));
      const gVal = Math.round(neutralG - t * (neutralG - 185));
      const bVal = Math.round(neutralB - t * (neutralB - 129));
      const text = t > 0.45 ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a';
      return { bg: `rgb(${rVal}, ${gVal}, ${bVal})`, text };
    }
  }

  if (theme === 'sunset') {
    // Negative: Indigo (#4338ca) -> Neutral -> Positive: Orange (#ea580c)
    if (clamped < 0) {
      const t = Math.abs(clamped);
      const rVal = Math.round(neutralR - t * (neutralR - 67));
      const gVal = Math.round(neutralG - t * (neutralG - 56));
      const bVal = Math.round(neutralB - t * (neutralB - 202));
      const text = t > 0.45 ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a';
      return { bg: `rgb(${rVal}, ${gVal}, ${bVal})`, text };
    } else {
      const t = clamped;
      const rVal = Math.round(neutralR - t * (neutralR - 234));
      const gVal = Math.round(neutralG - t * (neutralG - 88));
      const bVal = Math.round(neutralB - t * (neutralB - 12));
      const text = t > 0.45 ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a';
      return { bg: `rgb(${rVal}, ${gVal}, ${bVal})`, text };
    }
  }

  // viridis fallback
  const norm = (clamped + 1) / 2; // [0, 1]
  const rVal = Math.round(68 + norm * (253 - 68));
  const gVal = Math.round(1 + norm * (231 - 1));
  const bVal = Math.round(84 + norm * (37 - 84));
  const text = norm > 0.3 && norm < 0.8 ? '#ffffff' : isDark ? '#f1f5f9' : '#0f172a';
  return { bg: `rgb(${rVal}, ${gVal}, ${bVal})`, text };
}

export function formatNumber(val: number | null | undefined, decimals: number = 3): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (Math.abs(val) < 1e-4 && val !== 0) {
    return val.toExponential(2);
  }
  return val.toFixed(decimals);
}

export function formatPValue(p: number | null | undefined): string {
  if (p === null || p === undefined || isNaN(p)) return '—';
  if (p < 0.001) return '< 0.001 ***';
  if (p < 0.01) return `${p.toFixed(3)} **`;
  if (p < 0.05) return `${p.toFixed(3)} *`;
  return `${p.toFixed(3)} (n.s.)`;
}

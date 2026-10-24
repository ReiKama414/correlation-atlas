/**
 * Correlation Atlas - Rigorous Statistical Computation Engine
 * All formulas follow standard mathematical formulations (NIST / R / SciPy benchmarks).
 */

export interface DescriptiveStats {
  count: number;
  validCount: number;
  missingCount: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  iqr: number;
  skewness: number;
}

export interface CorrelationResult {
  r: number;
  rSquared: number;
  tStat: number;
  pValue: number;
  df: number;
  n: number;
  ci95: [number, number]; // 95% Confidence Interval for Pearson
  isSignificant05: boolean;
  isSignificant01: boolean;
  isSignificant001: boolean;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  pValue: number;
  tStat: number;
  seSlope: number;
  seIntercept: number;
  seResidual: number;
  df: number;
  n: number;
  meanX: number;
  meanY: number;
  sumSqXDiff: number;
  predict: (x: number) => number;
  confidenceBand: (x: number) => { fit: number; lower: number; upper: number };
  predictionBand: (x: number) => { fit: number; lower: number; upper: number };
  residuals: number[];
}

export type OutlierMethod = 'iqr' | 'zscore' | 'cooks';

export interface OutlierResult {
  indices: Set<number>;
  flags: boolean[];
  scores: number[];
  threshold: number;
  method: OutlierMethod;
}

export interface SimpsonsParadoxResult {
  isDetected: boolean;
  overallR: number;
  overallDirection: 'positive' | 'negative' | 'neutral';
  groupResults: {
    group: string;
    r: number;
    direction: 'positive' | 'negative' | 'neutral';
    n: number;
  }[];
  divergentGroupsCount: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Basic Statistical Helpers
// ---------------------------------------------------------------------------

export function isNumeric(val: unknown): val is number {
  if (typeof val === 'number') {
    return !isNaN(val) && isFinite(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === 'NA' || trimmed === 'null' || trimmed === 'NaN' || trimmed === '?' || trimmed === '-') {
      return false;
    }
    const num = Number(trimmed);
    return !isNaN(num) && isFinite(num);
  }
  return false;
}

export function toCleanNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? null : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === 'NA' || trimmed === 'null' || trimmed === 'NaN' || trimmed === '?' || trimmed === '-') {
      return null;
    }
    const num = Number(trimmed);
    return isNaN(num) || !isFinite(num) ? null : num;
  }
  return null;
}

export function computeMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, v) => acc + v, 0);
  return sum / arr.length;
}

export function computeVariance(arr: number[], isSample: boolean = true): number {
  if (arr.length <= (isSample ? 1 : 0)) return 0;
  const m = computeMean(arr);
  const sumSq = arr.reduce((acc, v) => acc + (v - m) * (v - m), 0);
  return sumSq / (isSample ? arr.length - 1 : arr.length);
}

export function computeStdDev(arr: number[], isSample: boolean = true): number {
  return Math.sqrt(computeVariance(arr, isSample));
}

export function computeQuantile(sortedArr: number[], q: number): number {
  if (sortedArr.length === 0) return 0;
  if (sortedArr.length === 1) return sortedArr[0];
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base + 1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
  }
  return sortedArr[base];
}

export function computeDescriptiveStats(values: (number | null | undefined | string)[]): DescriptiveStats {
  const total = values.length;
  const validNums: number[] = [];
  let missing = 0;

  for (const v of values) {
    const num = toCleanNumber(v);
    if (num !== null) {
      validNums.push(num);
    } else {
      missing++;
    }
  }

  if (validNums.length === 0) {
    return {
      count: total,
      validCount: 0,
      missingCount: missing,
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      q25: 0,
      q75: 0,
      iqr: 0,
      skewness: 0,
    };
  }

  const sorted = [...validNums].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = computeMean(sorted);
  const variance = computeVariance(sorted, true);
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];
  const median = computeQuantile(sorted, 0.5);
  const q25 = computeQuantile(sorted, 0.25);
  const q75 = computeQuantile(sorted, 0.75);
  const iqr = q75 - q25;

  // Adjusted Fisher-Pearson standardized moment coefficient for skewness
  let skewness = 0;
  if (n > 2 && stdDev > 1e-12) {
    const m3 = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
    const s3 = Math.pow(variance * ((n - 1) / n), 1.5);
    if (s3 > 1e-12) {
      const g1 = m3 / s3;
      skewness = (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
    }
  }

  return {
    count: total,
    validCount: n,
    missingCount: missing,
    mean,
    median,
    stdDev,
    variance,
    min,
    max,
    q25,
    q75,
    iqr,
    skewness,
  };
}

// ---------------------------------------------------------------------------
// Student's t-Distribution P-Value Calculation
// ---------------------------------------------------------------------------

/**
 * Regularized Incomplete Beta Function I_x(a, b)
 * Used to compute Student's t-distribution CDF and p-values accurately without external dependencies.
 */
function logGamma(x: number): number {
  // Lanczos approximation (g=5, n=7)
  const p = [
    1.000000000190015,
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    1.208650973866179e-3,
    -5.395239384953e-6,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = p[0];
  for (let j = 1; j < 7; ++j) {
    y += 1;
    ser += p[j] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betaIncomplete(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Continued fraction representation (Lentz's method)
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1.0 - x) * b - lnBeta) / a;

  const fPMin = 1e-30;
  let c = 1.0;
  let d = 1.0 - (a + b) * x / (a + 1.0);
  if (Math.abs(d) < fPMin) d = fPMin;
  d = 1.0 / d;
  let f = d;

  for (let m = 1; m <= 200; ++m) {
    const m2 = 2 * m;
    // Even step
    let num = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1.0 + num * d;
    if (Math.abs(d) < fPMin) d = fPMin;
    c = 1.0 + num / c;
    if (Math.abs(c) < fPMin) c = fPMin;
    d = 1.0 / d;
    f *= d * c;

    // Odd step
    num = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1.0 + num * d;
    if (Math.abs(d) < fPMin) d = fPMin;
    c = 1.0 + num / c;
    if (Math.abs(c) < fPMin) c = fPMin;
    d = 1.0 / d;
    const delta = d * c;
    f *= delta;

    if (Math.abs(delta - 1.0) < 1e-14) break;
  }

  return front * f;
}

export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Symmetry transform if needed
  if (x > (a + 1.0) / (a + b + 2.0)) {
    return 1.0 - regularizedIncompleteBeta(1.0 - x, b, a);
  }
  return betaIncomplete(x, a, b);
}

/**
 * Two-tailed p-value for Student's t distribution with df degrees of freedom
 */
export function studentTTwoTailedPValue(t: number, df: number): number {
  if (df <= 0) return 1;
  if (isNaN(t) || !isFinite(t)) return 0;
  const absT = Math.abs(t);
  const x = df / (df + absT * absT);
  const p = regularizedIncompleteBeta(x, 0.5 * df, 0.5);
  return Math.max(0, Math.min(1, p));
}

/**
 * Approximate critical t-value for two-tailed 95% confidence interval (alpha=0.05)
 */
export function criticalT95(df: number): number {
  if (df <= 0) return 1.96;
  if (df >= 120) return 1.96;
  // Hill & Davis approximation / lookup table for common df
  const tTable: Record<number, number> = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042, 40: 2.021,
    50: 2.009, 60: 2.000, 80: 1.990, 100: 1.984
  };
  if (tTable[df]) return tTable[df];
  // Interpolation using asymptotic expansion
  return 1.95996 + 2.372 / df + 2.82 / (df * df);
}

// ---------------------------------------------------------------------------
// Pearson Correlation
// ---------------------------------------------------------------------------

export function calculatePearson(x: number[], y: number[]): CorrelationResult {
  const n = Math.min(x.length, y.length);
  if (n < 3) {
    return {
      r: 0,
      rSquared: 0,
      tStat: 0,
      pValue: 1,
      df: Math.max(0, n - 2),
      n,
      ci95: [-1, 1],
      isSignificant05: false,
      isSignificant01: false,
      isSignificant001: false,
    };
  }

  const meanX = computeMean(x);
  const meanY = computeMean(y);

  let sumDiffX2 = 0;
  let sumDiffY2 = 0;
  let sumDiffXY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumDiffXY += dx * dy;
    sumDiffX2 += dx * dx;
    sumDiffY2 += dy * dy;
  }

  const denominator = Math.sqrt(sumDiffX2 * sumDiffY2);
  let r = 0;
  if (denominator > 1e-12) {
    r = sumDiffXY / denominator;
    // Bound r strictly between -1 and 1
    r = Math.max(-1, Math.min(1, r));
  }

  const df = n - 2;
  const rSquared = r * r;

  let tStat = 0;
  let pValue = 1;

  if (Math.abs(r) >= 0.999999999) {
    tStat = r > 0 ? 999999 : -999999;
    pValue = 0;
  } else if (df > 0 && 1 - rSquared > 1e-12) {
    tStat = r * Math.sqrt(df / (1 - rSquared));
    pValue = studentTTwoTailedPValue(tStat, df);
  }

  // 95% Confidence Interval using Fisher's z-transformation
  let ciLower = -1;
  let ciUpper = 1;
  if (n > 3 && Math.abs(r) < 0.999999) {
    const z = 0.5 * Math.log((1 + r) / (1 - r));
    const seZ = 1 / Math.sqrt(n - 3);
    const zCrit = 1.95996; // 95% standard normal quantile
    const zLower = z - zCrit * seZ;
    const zUpper = z + zCrit * seZ;
    ciLower = Math.tanh(zLower);
    ciUpper = Math.tanh(zUpper);
  } else if (Math.abs(r) >= 0.999999) {
    ciLower = r;
    ciUpper = r;
  }

  return {
    r,
    rSquared,
    tStat,
    pValue,
    df,
    n,
    ci95: [ciLower, ciUpper],
    isSignificant05: pValue < 0.05,
    isSignificant01: pValue < 0.01,
    isSignificant001: pValue < 0.001,
  };
}

// ---------------------------------------------------------------------------
// Spearman Rank Correlation
// ---------------------------------------------------------------------------

/**
 * Computes fractional ranks with ties assigned average ranks (standard statistical procedure)
 */
export function computeRanks(arr: number[]): number[] {
  const n = arr.length;
  // Create indexed array
  const indexed = arr.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    // Find block of tied values
    while (j < n - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    // Ranks are 1-based, average rank for tied elements
    const avgRank = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

export function calculateSpearman(x: number[], y: number[]): CorrelationResult {
  const n = Math.min(x.length, y.length);
  if (n < 3) {
    return {
      r: 0,
      rSquared: 0,
      tStat: 0,
      pValue: 1,
      df: Math.max(0, n - 2),
      n,
      ci95: [-1, 1],
      isSignificant05: false,
      isSignificant01: false,
      isSignificant001: false,
    };
  }

  const rankX = computeRanks(x);
  const rankY = computeRanks(y);

  // Spearman is Pearson correlation computed on fractional ranks
  return calculatePearson(rankX, rankY);
}

// ---------------------------------------------------------------------------
// Linear Regression & Bands (OLS)
// ---------------------------------------------------------------------------

export function calculateLinearRegression(x: number[], y: number[]): RegressionResult {
  const n = Math.min(x.length, y.length);
  if (n < 2) {
    return {
      slope: 0,
      intercept: 0,
      r: 0,
      rSquared: 0,
      pValue: 1,
      tStat: 0,
      seSlope: 0,
      seIntercept: 0,
      seResidual: 0,
      df: 0,
      n,
      meanX: 0,
      meanY: 0,
      sumSqXDiff: 0,
      predict: () => 0,
      confidenceBand: (_val) => ({ fit: 0, lower: 0, upper: 0 }),
      predictionBand: (_val) => ({ fit: 0, lower: 0, upper: 0 }),
      residuals: [],
    };
  }

  const meanX = computeMean(x);
  const meanY = computeMean(y);

  let sumDiffX2 = 0;
  let sumDiffY2 = 0;
  let sumDiffXY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumDiffXY += dx * dy;
    sumDiffX2 += dx * dx;
    sumDiffY2 += dy * dy;
  }

  let slope = 0;
  let intercept = meanY;
  if (sumDiffX2 > 1e-12) {
    slope = sumDiffXY / sumDiffX2;
    intercept = meanY - slope * meanX;
  }

  const predict = (xVal: number) => intercept + slope * xVal;

  const residuals: number[] = [];
  let ssResidual = 0;
  for (let i = 0; i < n; i++) {
    const fit = predict(x[i]);
    const res = y[i] - fit;
    residuals.push(res);
    ssResidual += res * res;
  }

  const df = Math.max(1, n - 2);
  const seResidual = Math.sqrt(ssResidual / df);

  let seSlope = 0;
  let seIntercept = 0;
  let tStat = 0;
  let pValue = 1;

  if (sumDiffX2 > 1e-12) {
    seSlope = seResidual / Math.sqrt(sumDiffX2);
    seIntercept = seResidual * Math.sqrt(1 / n + (meanX * meanX) / sumDiffX2);
    if (seSlope > 1e-12) {
      tStat = slope / seSlope;
      pValue = studentTTwoTailedPValue(tStat, df);
    }
  }

  const denomR = Math.sqrt(sumDiffX2 * sumDiffY2);
  let r = 0;
  if (denomR > 1e-12) {
    r = Math.max(-1, Math.min(1, sumDiffXY / denomR));
  }
  const rSquared = r * r;
  const tCrit = criticalT95(df);

  const confidenceBand = (xVal: number) => {
    const fit = predict(xVal);
    if (sumDiffX2 < 1e-12) return { fit, lower: fit, upper: fit };
    const seFit = seResidual * Math.sqrt(1 / n + Math.pow(xVal - meanX, 2) / sumDiffX2);
    const margin = tCrit * seFit;
    return {
      fit,
      lower: fit - margin,
      upper: fit + margin,
    };
  };

  const predictionBand = (xVal: number) => {
    const fit = predict(xVal);
    if (sumDiffX2 < 1e-12) return { fit, lower: fit, upper: fit };
    const sePred = seResidual * Math.sqrt(1 + 1 / n + Math.pow(xVal - meanX, 2) / sumDiffX2);
    const margin = tCrit * sePred;
    return {
      fit,
      lower: fit - margin,
      upper: fit + margin,
    };
  };

  return {
    slope,
    intercept,
    r,
    rSquared,
    pValue,
    tStat,
    seSlope,
    seIntercept,
    seResidual,
    df,
    n,
    meanX,
    meanY,
    sumSqXDiff: sumDiffX2,
    predict,
    confidenceBand,
    predictionBand,
    residuals,
  };
}

// ---------------------------------------------------------------------------
// Outlier Detection (IQR, Z-Score, Cook's Distance)
// ---------------------------------------------------------------------------

export function detectOutliers(
  x: number[],
  y: number[],
  method: OutlierMethod = 'cooks',
  thresholdMultiplier: number = 1.5
): OutlierResult {
  const n = Math.min(x.length, y.length);
  const flags = new Array<boolean>(n).fill(false);
  const scores = new Array<number>(n).fill(0);
  const indices = new Set<number>();

  if (n < 4) {
    return { indices, flags, scores, threshold: 0, method };
  }

  if (method === 'iqr') {
    // 2D Tukey IQR Fences
    const sortedX = [...x].sort((a, b) => a - b);
    const sortedY = [...y].sort((a, b) => a - b);

    const q1X = computeQuantile(sortedX, 0.25);
    const q3X = computeQuantile(sortedX, 0.75);
    const iqrX = q3X - q1X;
    const lowerX = q1X - thresholdMultiplier * iqrX;
    const upperX = q3X + thresholdMultiplier * iqrX;

    const q1Y = computeQuantile(sortedY, 0.25);
    const q3Y = computeQuantile(sortedY, 0.75);
    const iqrY = q3Y - q1Y;
    const lowerY = q1Y - thresholdMultiplier * iqrY;
    const upperY = q3Y + thresholdMultiplier * iqrY;

    for (let i = 0; i < n; i++) {
      const isXOut = x[i] < lowerX || x[i] > upperX;
      const isYOut = y[i] < lowerY || y[i] > upperY;
      // Score: max relative distance beyond fences in units of IQR
      const distRatioX = iqrX > 1e-12 ? Math.max(0, (lowerX - x[i]) / iqrX, (x[i] - upperX) / iqrX) : 0;
      const distRatioY = iqrY > 1e-12 ? Math.max(0, (lowerY - y[i]) / iqrY, (y[i] - upperY) / iqrY) : 0;
      const score = Math.max(distRatioX, distRatioY);
      scores[i] = score;

      if (isXOut || isYOut) {
        flags[i] = true;
        indices.add(i);
      }
    }
    return { indices, flags, scores, threshold: 0, method };
  }

  if (method === 'zscore') {
    // Standard Z-score threshold (default 2.5)
    const zLimit = thresholdMultiplier || 2.5;
    const meanX = computeMean(x);
    const meanY = computeMean(y);
    const stdX = computeStdDev(x, true) || 1e-9;
    const stdY = computeStdDev(y, true) || 1e-9;

    for (let i = 0; i < n; i++) {
      const zX = Math.abs(x[i] - meanX) / stdX;
      const zY = Math.abs(y[i] - meanY) / stdY;
      const maxZ = Math.max(zX, zY);
      scores[i] = maxZ;

      if (maxZ > zLimit) {
        flags[i] = true;
        indices.add(i);
      }
    }
    return { indices, flags, scores, threshold: zLimit, method };
  }

  // Default: Cook's Distance in Bivariate Linear Regression
  const reg = calculateLinearRegression(x, y);
  const p = 2; // intercept + slope
  const mse = (reg.seResidual * reg.seResidual) || 1e-12;
  const threshold = 4 / n;

  for (let i = 0; i < n; i++) {
    // Leverage h_ii
    let hii = 1 / n;
    if (reg.sumSqXDiff > 1e-12) {
      hii += Math.pow(x[i] - reg.meanX, 2) / reg.sumSqXDiff;
    }
    // Bound leverage
    hii = Math.min(0.99999, Math.max(1e-12, hii));

    const ei = reg.residuals[i] ?? (y[i] - reg.predict(x[i]));
    const cookD = (ei * ei) / (p * mse) * (hii / Math.pow(1 - hii, 2));
    scores[i] = cookD;

    if (cookD > threshold) {
      flags[i] = true;
      indices.add(i);
    }
  }

  return { indices, flags, scores, threshold, method };
}

// ---------------------------------------------------------------------------
// Simpson's Paradox Detection
// ---------------------------------------------------------------------------

export function detectSimpsonsParadox(
  x: number[],
  y: number[],
  groups: (string | null | undefined)[]
): SimpsonsParadoxResult {
  const n = Math.min(x.length, y.length, groups.length);
  if (n < 6) {
    return {
      isDetected: false,
      overallR: 0,
      overallDirection: 'neutral',
      groupResults: [],
      divergentGroupsCount: 0,
      description: '樣本數不足以檢驗辛普森悖論',
    };
  }

  // Filter valid data points
  const validData: { x: number; y: number; group: string }[] = [];
  for (let i = 0; i < n; i++) {
    const grp = groups[i]?.trim();
    if (grp) {
      validData.push({ x: x[i], y: y[i], group: grp });
    }
  }

  if (validData.length < 6) {
    return {
      isDetected: false,
      overallR: 0,
      overallDirection: 'neutral',
      groupResults: [],
      divergentGroupsCount: 0,
      description: '分組有效樣本數過少',
    };
  }

  const overall = calculatePearson(validData.map((d) => d.x), validData.map((d) => d.y));
  const overallDir: 'positive' | 'negative' | 'neutral' =
    Math.abs(overall.r) < 0.05 ? 'neutral' : overall.r > 0 ? 'positive' : 'negative';

  // Group by category
  const groupMap = new Map<string, { x: number[]; y: number[] }>();
  for (const d of validData) {
    let entry = groupMap.get(d.group);
    if (!entry) {
      entry = { x: [], y: [] };
      groupMap.set(d.group, entry);
    }
    entry.x.push(d.x);
    entry.y.push(d.y);
  }

  const groupResults: SimpsonsParadoxResult['groupResults'] = [];
  let divergentCount = 0;

  for (const [groupName, vals] of groupMap.entries()) {
    if (vals.x.length >= 3) {
      const gCorr = calculatePearson(vals.x, vals.y);
      const gDir: 'positive' | 'negative' | 'neutral' =
        Math.abs(gCorr.r) < 0.05 ? 'neutral' : gCorr.r > 0 ? 'positive' : 'negative';

      groupResults.push({
        group: groupName,
        r: gCorr.r,
        direction: gDir,
        n: vals.x.length,
      });

      if (overallDir !== 'neutral' && gDir !== 'neutral' && gDir !== overallDir) {
        divergentCount++;
      }
    }
  }

  // Simpson's paradox is flagged if overall correlation opposes the majority or multiple significant sub-groups!
  const isDetected = divergentCount >= 1 && groupResults.length >= 2 && overallDir !== 'neutral';

  let description = '未發現顯著辛普森悖論';
  if (isDetected) {
    const overallWord = overallDir === 'positive' ? '正相關 (r > 0)' : '負相關 (r < 0)';
    const oppWord = overallDir === 'positive' ? '負相關' : '正相關';
    description = `警告：整體資料呈現「${overallWord}」，但有 ${divergentCount} 個分組呈現相反的「${oppWord}」！此現象為典型的辛普森悖論（Simpson's Paradox），強烈暗示存在干擾變數（Confounding Variable）。`;
  }

  return {
    isDetected,
    overallR: overall.r,
    overallDirection: overallDir,
    groupResults,
    divergentGroupsCount: divergentCount,
    description,
  };
}

// ---------------------------------------------------------------------------
// Matrix Calculation & Hierarchical Clustering Order
// ---------------------------------------------------------------------------

export interface MatrixCell {
  xVar: string;
  yVar: string;
  r: number;
  rSquared: number;
  pValue: number;
  n: number;
  ci95: [number, number];
}

export function computeCorrelationMatrix(
  rows: Record<string, unknown>[],
  variables: string[],
  method: 'pearson' | 'spearman' = 'pearson',
  deletion: 'pairwise' | 'listwise' = 'pairwise'
): {
  matrix: MatrixCell[][];
  variables: string[];
} {
  const p = variables.length;
  if (p === 0) return { matrix: [], variables: [] };

  // If listwise deletion, filter out rows that have any missing value in the selected variables
  let processedRows = rows;
  if (deletion === 'listwise') {
    processedRows = rows.filter((r) =>
      variables.every((v) => toCleanNumber(r[v]) !== null)
    );
  }

  // Extract clean arrays
  const varData = new Map<string, (number | null)[]>();
  for (const v of variables) {
    varData.set(
      v,
      processedRows.map((r) => toCleanNumber(r[v]))
    );
  }

  const matrix: MatrixCell[][] = [];

  for (let i = 0; i < p; i++) {
    const rowCells: MatrixCell[] = [];
    const varI = variables[i];
    const dataI = varData.get(varI)!;

    for (let j = 0; j < p; j++) {
      const varJ = variables[j];
      const dataJ = varData.get(varJ)!;

      if (i === j) {
        // Diagonal cell is self-correlation: r = 1.0, p = 0
        const validN = dataI.filter((v) => v !== null).length;
        rowCells.push({
          xVar: varJ,
          yVar: varI,
          r: 1.0,
          rSquared: 1.0,
          pValue: 0.0,
          n: validN,
          ci95: [1.0, 1.0],
        });
      } else {
        // Pairwise clean extraction
        const pairX: number[] = [];
        const pairY: number[] = [];

        for (let k = 0; k < processedRows.length; k++) {
          const valX = dataJ[k];
          const valY = dataI[k];
          if (valX !== null && valY !== null) {
            pairX.push(valX);
            pairY.push(valY);
          }
        }

        const res =
          method === 'spearman'
            ? calculateSpearman(pairX, pairY)
            : calculatePearson(pairX, pairY);

        rowCells.push({
          xVar: varJ,
          yVar: varI,
          r: res.r,
          rSquared: res.rSquared,
          pValue: res.pValue,
          n: res.n,
          ci95: res.ci95,
        });
      }
    }
    matrix.push(rowCells);
  }

  return { matrix, variables };
}

/**
 * Seriation / Hierarchical Ordering for Correlation Matrix
 * Groups similar variables together by distance metric d = 1 - abs(r) or d = 1 - r
 */
export function seriateVariables(
  matrix: MatrixCell[][],
  variables: string[]
): string[] {
  const n = variables.length;
  if (n <= 2) return [...variables];

  // Distance matrix: d_ij = 1 - r_ij
  const dist: number[][] = [];
  for (let i = 0; i < n; i++) {
    dist[i] = [];
    for (let j = 0; j < n; j++) {
      dist[i][j] = 1 - matrix[i][j].r;
    }
  }

  // Simple and robust hierarchical agglomerative clustering (Average Linkage)
  interface Cluster {
    indices: number[];
  }
  let clusters: Cluster[] = variables.map((_, idx) => ({ indices: [idx] }));

  while (clusters.length > 1) {
    let minDist = Infinity;
    let mergeI = 0;
    let mergeJ = 1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        // Average distance between cluster i and cluster j
        let totalD = 0;
        let count = 0;
        for (const idxA of clusters[i].indices) {
          for (const idxB of clusters[j].indices) {
            totalD += dist[idxA][idxB];
            count++;
          }
        }
        const avgD = totalD / count;
        if (avgD < minDist) {
          minDist = avgD;
          mergeI = i;
          mergeJ = j;
        }
      }
    }

    // Merge clusters mergeI and mergeJ
    const newCluster: Cluster = {
      indices: [...clusters[mergeI].indices, ...clusters[mergeJ].indices],
    };
    clusters = clusters.filter((_, idx) => idx !== mergeI && idx !== mergeJ);
    clusters.push(newCluster);
  }

  return clusters[0].indices.map((idx) => variables[idx]);
}

import { describe, it, expect } from 'vitest';
import {
  computeMean,
  computeVariance,
  calculatePearson,
  calculateSpearman,
  calculateLinearRegression,
  detectOutliers,
  detectSimpsonsParadox,
  computeDescriptiveStats,
  computeRanks,
} from '../statistics';

describe('Statistical Engine Benchmarks', () => {
  // Classic Anscombe's Quartet - Dataset I
  const anscombeX1 = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
  const anscombeY1 = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];

  it('correctly calculates descriptive statistics for Anscombe Quartet I', () => {
    const meanX = computeMean(anscombeX1);
    const meanY = computeMean(anscombeY1);
    const varX = computeVariance(anscombeX1, true);
    const varY = computeVariance(anscombeY1, true);

    expect(meanX).toBeCloseTo(9.0, 3);
    expect(meanY).toBeCloseTo(7.50, 2);
    expect(varX).toBeCloseTo(11.0, 3);
    expect(varY).toBeCloseTo(4.127, 2);
  });

  it('matches NIST/R reference values for Pearson r & linear regression slope/intercept', () => {
    const pearson = calculatePearson(anscombeX1, anscombeY1);
    expect(pearson.r).toBeCloseTo(0.8164, 3);
    expect(pearson.rSquared).toBeCloseTo(0.6665, 3);
    expect(pearson.df).toBe(9);
    expect(pearson.pValue).toBeLessThan(0.01);
    expect(pearson.isSignificant05).toBe(true);
    expect(pearson.isSignificant01).toBe(true);

    const reg = calculateLinearRegression(anscombeX1, anscombeY1);
    expect(reg.slope).toBeCloseTo(0.500, 2);
    expect(reg.intercept).toBeCloseTo(3.00, 2);
    expect(reg.rSquared).toBeCloseTo(0.666, 2);

    // Predict band check
    const band = reg.confidenceBand(9.0);
    expect(band.fit).toBeCloseTo(7.50, 2);
    expect(band.lower).toBeLessThan(band.fit);
    expect(band.upper).toBeGreaterThan(band.fit);
  });

  it('correctly calculates Spearman rank correlation with ties', () => {
    // Monotonic nonlinear test: Spearman must be 1.0 even if Pearson is < 1.0
    const x = [1, 2, 3, 4, 5, 6, 7, 8];
    const yExp = x.map((v) => Math.exp(v)); // strictly increasing exponential

    const spearmanExp = calculateSpearman(x, yExp);
    expect(spearmanExp.r).toBeCloseTo(1.0, 6);

    // Check tie ranking
    const tiedArr = [10, 20, 20, 30, 40];
    const ranks = computeRanks(tiedArr);
    // 10 -> 1, tied 20s (positions 2 and 3) -> 2.5, 30 -> 4, 40 -> 5
    expect(ranks).toEqual([1, 2.5, 2.5, 4, 5]);
  });

  it('detects outliers accurately with Cook Distance and IQR', () => {
    // Normal line y = x, with one extreme outlier at index 4
    const x = [1, 2, 3, 4, 10, 6, 7, 8];
    const y = [1, 2, 3, 4, 50, 6, 7, 8];

    const cookOutliers = detectOutliers(x, y, 'cooks');
    expect(cookOutliers.indices.has(4)).toBe(true);

    const iqrOutliers = detectOutliers(x, y, 'iqr');
    expect(iqrOutliers.indices.has(4)).toBe(true);
  });

  it('detects Simpson’s Paradox correctly', () => {
    // Synthetic dataset:
    // Group A: X in [10, 20], Y in [40, 50] (positive correlation within A)
    // Group B: X in [50, 60], Y in [10, 20] (positive correlation within B)
    // Combined: Overall trend is strongly negative!
    const groupAX = [10, 12, 14, 16, 18, 20];
    const groupAY = [40, 42, 44, 46, 48, 50];
    const groupBX = [50, 52, 54, 56, 58, 60];
    const groupBY = [10, 12, 14, 16, 18, 20];

    const allX = [...groupAX, ...groupBX];
    const allY = [...groupAY, ...groupBY];
    const groups = [
      ...new Array(6).fill('Group A'),
      ...new Array(6).fill('Group B'),
    ];

    const simpson = detectSimpsonsParadox(allX, allY, groups);
    expect(simpson.isDetected).toBe(true);
    expect(simpson.overallDirection).toBe('negative');
    expect(simpson.groupResults.length).toBe(2);
    expect(simpson.groupResults[0].direction).toBe('positive');
    expect(simpson.groupResults[1].direction).toBe('positive');
  });

  it('computes robust descriptive stats with missing values', () => {
    const raw = [10, '20', null, 'NA', '?', 30, 40, 50, ''];
    const stats = computeDescriptiveStats(raw);
    expect(stats.count).toBe(9);
    expect(stats.validCount).toBe(5);
    expect(stats.missingCount).toBe(4);
    expect(stats.mean).toBe(30);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.median).toBe(30);
  });
});

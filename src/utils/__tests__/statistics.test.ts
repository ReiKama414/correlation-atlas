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
import { BENCHMARK_TEST_CASES } from '../../data/verificationBenchmarks';

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

  it('verifies all benchmark test cases in BENCHMARK_TEST_CASES', () => {
    for (const tc of BENCHMARK_TEST_CASES) {
      if (tc.id === 'nist-norris') {
        const reg = calculateLinearRegression(tc.x, tc.y);
        expect(reg.slope).toBeCloseTo(tc.expected.slope!, 3);
        expect(reg.intercept).toBeCloseTo(tc.expected.intercept!, 2);
      } else if (tc.id === 'anscombe-1') {
        const p = calculatePearson(tc.x, tc.y);
        expect(p.r).toBeCloseTo(tc.expected.r!, 3);
      } else if (tc.id === 'spearman-tied') {
        const s = calculateSpearman(tc.x, tc.y);
        expect(s.r).toBeCloseTo(tc.expected.r!, 3);
      } else if (tc.id === 'simpson-penguins') {
        const groups = [
          ...new Array(6).fill('Adelie'),
          ...new Array(6).fill('Gentoo'),
          ...new Array(6).fill('Chinstrap'),
        ];
        const res = detectSimpsonsParadox(tc.x, tc.y, groups);
        expect(res.isDetected).toBe(true);
      }
    }
  });

  it('correctly calculates Spearman rank correlation with ties', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8];
    const yExp = x.map((v) => Math.exp(v));

    const spearmanExp = calculateSpearman(x, yExp);
    expect(spearmanExp.r).toBeCloseTo(1.0, 6);

    const tiedArr = [10, 20, 20, 30, 40];
    const ranks = computeRanks(tiedArr);
    expect(ranks).toEqual([1, 2.5, 2.5, 4, 5]);
  });

  it('detects outliers accurately with Cook Distance and IQR', () => {
    const x = [1, 2, 3, 4, 10, 6, 7, 8];
    const y = [1, 2, 3, 4, 50, 6, 7, 8];

    const cookOutliers = detectOutliers(x, y, 'cooks');
    expect(cookOutliers.indices.has(4)).toBe(true);

    const iqrOutliers = detectOutliers(x, y, 'iqr');
    expect(iqrOutliers.indices.has(4)).toBe(true);
  });

  it('detects Simpson’s Paradox correctly', () => {
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

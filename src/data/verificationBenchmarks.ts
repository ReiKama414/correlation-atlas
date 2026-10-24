/**
 * NIST StRD & Reference Benchmarks for Live Statistical Engine Verification
 * These cases can be executed interactively in the browser to assure complete numerical fidelity.
 */

export interface BenchmarkTestCase {
  id: string;
  name: string;
  category: 'NIST StRD' | 'R Statistical Core' | 'Edge Cases' | 'Simpson Paradox';
  description: string;
  referenceSource: string;
  x: number[];
  y: number[];
  expected: {
    r?: number;
    rTol?: number;
    slope?: number;
    slopeTol?: number;
    intercept?: number;
    interceptTol?: number;
    rSquared?: number;
    rSquaredTol?: number;
    pValue?: number;
    pTol?: number;
    notes?: string;
  };
}

export const BENCHMARK_TEST_CASES: BenchmarkTestCase[] = [
  {
    id: 'nist-norris',
    name: 'NIST Norris Linear Regression Benchmark',
    category: 'NIST StRD',
    description: '美國國家標準與技術研究院 (NIST) 數值統計標準數據集 Norris，檢驗線性回歸斜率與截距的高精度計算。',
    referenceSource: 'NIST Statistical Reference Datasets (StRD) - Norris',
    x: [0.2, 337.4, 118.2, 884.6, 10.1, 226.5, 666.3, 9.9, 441.8, 110.6, 0.23, 10.3, 336.4, 440.5, 664.1, 883.6, 225.2, 0.25, 336.0, 10.0, 440.0, 108.9, 227.3, 885.4, 665.5, 0.28, 441.2, 11.0, 228.0, 111.0, 337.0, 666.0, 886.0, 0.3, 336.0, 12.0],
    y: [0.1, 338.8, 118.1, 888.0, 10.1, 228.1, 668.5, 9.8, 444.0, 110.5, 0.23, 10.4, 337.2, 442.7, 667.7, 887.1, 226.3, 0.25, 337.0, 10.0, 442.0, 109.1, 228.0, 889.0, 667.0, 0.29, 443.0, 11.1, 229.0, 111.5, 338.0, 669.0, 889.0, 0.31, 338.0, 12.2],
    expected: {
      slope: 1.00211681802045,
      slopeTol: 0.0001,
      intercept: -0.262323073774029,
      interceptTol: 0.005,
      rSquared: 0.999993745883712,
      rSquaredTol: 0.00001,
      notes: '極高相關性數據，檢驗極限浮點數運算下的截距與殘差標準誤精度。',
    },
  },
  {
    id: 'anscombe-1',
    name: "Anscombe's Quartet Dataset 1",
    category: 'R Statistical Core',
    description: '經典安斯庫姆第 1 組：檢驗皮爾森相關係數與 OLS 回歸參數。',
    referenceSource: "Anscombe, F. J. (1973) / R base `anscombe`",
    x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
    y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68],
    expected: {
      r: 0.8164205,
      rTol: 0.0005,
      slope: 0.5000909,
      slopeTol: 0.001,
      intercept: 3.0000909,
      interceptTol: 0.01,
      rSquared: 0.6665425,
      rSquaredTol: 0.001,
      pValue: 0.0021696,
      pTol: 0.0005,
      notes: 'R 軟體 cor.test(x, y) 基準值',
    },
  },
  {
    id: 'spearman-tied',
    name: '帶有重複值 (Ties) 的斯皮爾曼等級相關',
    category: 'R Statistical Core',
    description: '檢驗在存在並列排名 (Ties) 時的斯皮爾曼等級平均排名算法，避免簡單差值平方公式的偏差。',
    referenceSource: 'R `cor(x, y, method="spearman")`',
    x: [1, 2, 2, 4, 5, 6, 6, 8, 9, 10],
    y: [2, 1, 4, 3, 7, 5, 8, 8, 10, 9],
    expected: {
      r: 0.9422591,
      rTol: 0.001,
      notes: '包含多組 tied ranks (2, 6, 8)',
    },
  },
  {
    id: 'simpson-penguins',
    name: '南蠻企鵝 Simpson’s Paradox 檢驗',
    category: 'Simpson Paradox',
    description: '整體喙長度與喙深度呈現顯著負相關，但在 Adelie, Chinstrap, Gentoo 內部呈現顯著正相關。',
    referenceSource: 'Gorman, Williams & Fraser (2014) / palmerpenguins package',
    x: [39.1, 39.5, 40.3, 36.7, 39.3, 38.9, 46.1, 50.0, 48.7, 50.0, 47.6, 46.5, 46.5, 50.0, 51.3, 45.4, 52.7, 45.2],
    y: [18.7, 17.4, 18.0, 19.3, 20.6, 17.8, 13.2, 16.3, 14.1, 15.2, 14.5, 13.5, 17.9, 19.5, 19.2, 18.7, 19.8, 17.8],
    expected: {
      notes: '檢驗演算法是否成功偵測群組方向衝突 (Simpson’s Paradox Flag = true)',
    },
  },
];

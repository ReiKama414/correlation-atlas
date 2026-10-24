export type CorrelationMethod = 'pearson' | 'spearman';
export type DeletionMethod = 'pairwise' | 'listwise';
export type OutlierMethod = 'cooks' | 'iqr' | 'zscore';
export type MatrixOrder = 'original' | 'seriated' | 'alphabetical';
export type MatrixDisplayMode = 'full' | 'lower' | 'upper';

export interface ColumnMetadata {
  name: string;
  type: 'numeric' | 'categorical' | 'id';
  distinctCount: number;
  validCount: number;
  missingCount: number;
  missingRate: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  stdDev?: number;
  sampleValues: (string | number)[];
}

export interface WorkspaceConfig {
  version: string;
  datasetName: string;
  selectedVariables: string[];
  xVariable: string;
  yVariable: string;
  groupVariable: string | null;
  correlationMethod: CorrelationMethod;
  deletionMethod: DeletionMethod;
  outlierMethod: OutlierMethod;
  excludeOutliers: boolean;
  outlierThresholdMultiplier: number;
  showConfidenceBand: boolean;
  showPredictionBand: boolean;
  showResidualPlot: boolean;
  matrixOrder: MatrixOrder;
  matrixDisplayMode: MatrixDisplayMode;
  colorTheme: 'coolwarm' | 'emerald' | 'viridis' | 'sunset';
  filters: {
    numeric: Record<string, [number, number]>;
    categorical: Record<string, string[]>;
  };
}

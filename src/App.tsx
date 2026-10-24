import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CausationBanner } from './components/CausationBanner';
import { Sidebar } from './components/Sidebar';
import { ScatterPlot } from './components/ScatterPlot';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { VariableInspector } from './components/VariableInspector';
import { VerificationModal } from './components/VerificationModal';
import { CausationGuideModal } from './components/CausationGuideModal';
import { ShareConfigModal } from './components/ShareConfigModal';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import type { SampleDataset } from './data/sampleDatasets';
import { parseCSVString } from './utils/csvParser';
import type { ParsedDataset } from './utils/csvParser';
import {
  detectSimpsonsParadox,
  detectOutliers,
  toCleanNumber,
} from './utils/statistics';
import type { SimpsonsParadoxResult } from './utils/statistics';
import type {
  WorkspaceConfig,
  CorrelationMethod,
  DeletionMethod,
  OutlierMethod,
  MatrixOrder,
  MatrixDisplayMode,
} from './types';

export function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'scatter' | 'matrix' | 'variables' | 'verification'>('scatter');
  const [isCausationModalOpen, setIsCausationModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Active Dataset State
  const [currentDatasetId, setCurrentDatasetId] = useState<string>('penguins');
  const [parsedData, setParsedData] = useState<ParsedDataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Variables & Axes
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [xVariable, setXVariable] = useState<string>('');
  const [yVariable, setYVariable] = useState<string>('');
  const [groupVariable, setGroupVariable] = useState<string | null>(null);

  // Model & Methodology
  const [correlationMethod, setCorrelationMethod] = useState<CorrelationMethod>('pearson');
  const [deletionMethod, setDeletionMethod] = useState<DeletionMethod>('pairwise');
  const [outlierMethod, setOutlierMethod] = useState<OutlierMethod>('cooks');
  const [excludeOutliers, setExcludeOutliers] = useState<boolean>(false);
  const [outlierMultiplier] = useState<number>(1.5);

  // Visual Overlays & Display
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showPredictionBand, setShowPredictionBand] = useState<boolean>(false);
  const [showResidualPlot, setShowResidualPlot] = useState<boolean>(false);
  const [matrixOrder, setMatrixOrder] = useState<MatrixOrder>('original');
  const [matrixDisplayMode, setMatrixDisplayMode] = useState<MatrixDisplayMode>('full');
  const [colorTheme, setColorTheme] = useState<'coolwarm' | 'emerald' | 'viridis' | 'sunset'>('coolwarm');

  // Filters State
  const [filters, setFilters] = useState<{
    numeric: Record<string, [number, number]>;
    categorical: Record<string, string[]>;
  }>({ numeric: {}, categorical: {} });

  // 1. Initial Load of Default or Hash Dataset
  const loadDatasetFromCSV = useCallback(
    async (csvText: string, datasetMeta?: Partial<SampleDataset>) => {
      setIsLoading(true);
      try {
        const parsed = await parseCSVString(csvText);
        setParsedData(parsed);

        const numericCols = parsed.columns.filter((c) => c.type === 'numeric');
        const numNames = numericCols.map((c) => c.name);

        setSelectedVariables(numNames);

        // Pick reasonable defaults
        const defaultX = datasetMeta?.defaultX && numNames.includes(datasetMeta.defaultX)
          ? datasetMeta.defaultX
          : numNames[0] || '';
        const defaultY = datasetMeta?.defaultY && numNames.includes(datasetMeta.defaultY)
          ? datasetMeta.defaultY
          : numNames[1] || numNames[0] || '';
        const defaultGrp = datasetMeta?.defaultGroup || null;

        setXVariable(defaultX);
        setYVariable(defaultY);
        setGroupVariable(defaultGrp);
        setFilters({ numeric: {}, categorical: {} });
      } catch (err) {
        console.error('Failed to parse CSV', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // Check if there is a share config in URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('#config=')) {
      try {
        const jsonStr = decodeURIComponent(hash.split('#config=')[1]);
        const config = JSON.parse(jsonStr) as WorkspaceConfig;
        const foundDs = SAMPLE_DATASETS.find((d) => d.id === config.datasetName || d.name === config.datasetName);
        if (foundDs) {
          setCurrentDatasetId(foundDs.id);
          loadDatasetFromCSV(foundDs.csv, foundDs).then(() => {
            // Apply config overrides
            if (config.selectedVariables) setSelectedVariables(config.selectedVariables);
            if (config.xVariable) setXVariable(config.xVariable);
            if (config.yVariable) setYVariable(config.yVariable);
            if (config.groupVariable !== undefined) setGroupVariable(config.groupVariable);
            if (config.correlationMethod) setCorrelationMethod(config.correlationMethod);
            if (config.deletionMethod) setDeletionMethod(config.deletionMethod);
            if (config.outlierMethod) setOutlierMethod(config.outlierMethod);
            if (config.excludeOutliers !== undefined) setExcludeOutliers(config.excludeOutliers);
            if (config.filters) setFilters(config.filters);
          });
          return;
        }
      } catch (err) {
        console.error('Error parsing config from hash', err);
      }
    }

    // Default to Palmer Penguins
    const defaultDs = SAMPLE_DATASETS[0];
    setCurrentDatasetId(defaultDs.id);
    loadDatasetFromCSV(defaultDs.csv, defaultDs);
  }, [loadDatasetFromCSV]);

  // Switch to built-in dataset
  const handleSelectDataset = (ds: SampleDataset) => {
    setCurrentDatasetId(ds.id);
    loadDatasetFromCSV(ds.csv, ds);
  };

  // Upload custom CSV file
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCurrentDatasetId('custom');
        loadDatasetFromCSV(text);
      }
    };
    reader.readAsText(file);
  };

  // Filter Pipeline: Evaluate raw rows against active filters
  const filteredRows = useMemo(() => {
    if (!parsedData) return [];

    return parsedData.rawRows.filter((row) => {
      // Check numeric filters
      for (const [colName, [minVal, maxVal]] of Object.entries(filters.numeric)) {
        const val = toCleanNumber(row[colName]);
        if (val !== null) {
          if (val < minVal || val > maxVal) return false;
        }
      }

      // Check categorical filters
      for (const [colName, allowedVals] of Object.entries(filters.categorical)) {
        const val = String(row[colName] ?? '').trim();
        if (val && !allowedVals.includes(val)) return false;
      }

      return true;
    });
  }, [parsedData, filters]);

  // Calculate Missing & Valid Counts for current pair
  const { validCount, missingCount } = useMemo(() => {
    if (!xVariable || !yVariable) return { validCount: 0, missingCount: 0 };
    let valid = 0;
    let missing = 0;

    filteredRows.forEach((r) => {
      const vx = toCleanNumber(r[xVariable]);
      const vy = toCleanNumber(r[yVariable]);
      if (vx !== null && vy !== null) {
        valid++;
      } else {
        missing++;
      }
    });

    return { validCount: valid, missingCount: missing };
  }, [filteredRows, xVariable, yVariable]);

  // Outlier Count for current pair
  const currentOutlierCount = useMemo(() => {
    if (!xVariable || !yVariable) return 0;
    const xs: number[] = [];
    const ys: number[] = [];
    filteredRows.forEach((r) => {
      const vx = toCleanNumber(r[xVariable]);
      const vy = toCleanNumber(r[yVariable]);
      if (vx !== null && vy !== null) {
        xs.push(vx);
        ys.push(vy);
      }
    });
    const res = detectOutliers(xs, ys, outlierMethod);
    return res.indices.size;
  }, [filteredRows, xVariable, yVariable, outlierMethod]);

  // Simpson's Paradox Check
  const simpsonsParadoxResult: SimpsonsParadoxResult | null = useMemo(() => {
    if (!groupVariable || !xVariable || !yVariable) return null;
    const xs: number[] = [];
    const ys: number[] = [];
    const grps: string[] = [];

    filteredRows.forEach((r) => {
      const vx = toCleanNumber(r[xVariable]);
      const vy = toCleanNumber(r[yVariable]);
      if (vx !== null && vy !== null) {
        xs.push(vx);
        ys.push(vy);
        grps.push(String(r[groupVariable] ?? '未分組'));
      }
    });

    return detectSimpsonsParadox(xs, ys, grps);
  }, [filteredRows, xVariable, yVariable, groupVariable]);

  // Filter Handlers
  const handleUpdateNumericFilter = (colName: string, range: [number, number]) => {
    setFilters((prev) => ({
      ...prev,
      numeric: { ...prev.numeric, [colName]: range },
    }));
  };

  const handleUpdateCategoricalFilter = (colName: string, selectedValues: string[]) => {
    setFilters((prev) => ({
      ...prev,
      categorical: { ...prev.categorical, [colName]: selectedValues },
    }));
  };

  const handleResetFilters = () => {
    setFilters({ numeric: {}, categorical: {} });
  };

  // Switch pair from Matrix click
  const handleSelectPairFromMatrix = (x: string, y: string) => {
    setXVariable(x);
    setYVariable(y);
    setActiveTab('scatter');
  };

  // Full Workspace Configuration object for sharing/exporting
  const workspaceConfig: WorkspaceConfig = useMemo(() => {
    return {
      version: '1.0.0',
      datasetName: currentDatasetId,
      selectedVariables,
      xVariable,
      yVariable,
      groupVariable,
      correlationMethod,
      deletionMethod,
      outlierMethod,
      excludeOutliers,
      outlierThresholdMultiplier: outlierMultiplier,
      showConfidenceBand,
      showPredictionBand,
      showResidualPlot,
      matrixOrder,
      matrixDisplayMode,
      colorTheme,
      filters,
    };
  }, [
    currentDatasetId,
    selectedVariables,
    xVariable,
    yVariable,
    groupVariable,
    correlationMethod,
    deletionMethod,
    outlierMethod,
    excludeOutliers,
    outlierMultiplier,
    showConfidenceBand,
    showPredictionBand,
    showResidualPlot,
    matrixOrder,
    matrixDisplayMode,
    colorTheme,
    filters,
  ]);

  const handleApplyConfig = (cfg: WorkspaceConfig) => {
    if (cfg.selectedVariables) setSelectedVariables(cfg.selectedVariables);
    if (cfg.xVariable) setXVariable(cfg.xVariable);
    if (cfg.yVariable) setYVariable(cfg.yVariable);
    if (cfg.groupVariable !== undefined) setGroupVariable(cfg.groupVariable);
    if (cfg.correlationMethod) setCorrelationMethod(cfg.correlationMethod);
    if (cfg.deletionMethod) setDeletionMethod(cfg.deletionMethod);
    if (cfg.outlierMethod) setOutlierMethod(cfg.outlierMethod);
    if (cfg.excludeOutliers !== undefined) setExcludeOutliers(cfg.excludeOutliers);
    if (cfg.showConfidenceBand !== undefined) setShowConfidenceBand(cfg.showConfidenceBand);
    if (cfg.showPredictionBand !== undefined) setShowPredictionBand(cfg.showPredictionBand);
    if (cfg.showResidualPlot !== undefined) setShowResidualPlot(cfg.showResidualPlot);
    if (cfg.matrixOrder) setMatrixOrder(cfg.matrixOrder);
    if (cfg.matrixDisplayMode) setMatrixDisplayMode(cfg.matrixDisplayMode);
    if (cfg.colorTheme) setColorTheme(cfg.colorTheme);
    if (cfg.filters) setFilters(cfg.filters);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentDatasetId={currentDatasetId}
        onSelectDataset={handleSelectDataset}
        onFileUpload={handleFileUpload}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCausationGuide={() => setIsCausationModalOpen(true)}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        rowCount={parsedData?.rowCount || 0}
      />

      {/* Causation & Simpson's Paradox Alert Banner */}
      <CausationBanner
        totalRows={parsedData?.rowCount || 0}
        validRows={validCount}
        missingRows={missingCount}
        outliersExcludedCount={excludeOutliers ? currentOutlierCount : 0}
        simpsonsParadox={simpsonsParadoxResult}
        onOpenGuide={() => setIsCausationModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto">
        {/* Left Control Sidebar */}
        {parsedData && (
          <Sidebar
            columns={parsedData.columns}
            selectedVariables={selectedVariables}
            onChangeSelectedVariables={setSelectedVariables}
            xVariable={xVariable}
            onChangeXVariable={setXVariable}
            yVariable={yVariable}
            onChangeYVariable={setYVariable}
            groupVariable={groupVariable}
            onChangeGroupVariable={setGroupVariable}
            correlationMethod={correlationMethod}
            onChangeCorrelationMethod={setCorrelationMethod}
            deletionMethod={deletionMethod}
            onChangeDeletionMethod={setDeletionMethod}
            outlierMethod={outlierMethod}
            onChangeOutlierMethod={setOutlierMethod}
            excludeOutliers={excludeOutliers}
            onToggleExcludeOutliers={() => setExcludeOutliers(!excludeOutliers)}
            showConfidenceBand={showConfidenceBand}
            onToggleConfidenceBand={() => setShowConfidenceBand(!showConfidenceBand)}
            showPredictionBand={showPredictionBand}
            onTogglePredictionBand={() => setShowPredictionBand(!showPredictionBand)}
            showResidualPlot={showResidualPlot}
            onToggleResidualPlot={() => setShowResidualPlot(!showResidualPlot)}
            filters={filters}
            onUpdateNumericFilter={handleUpdateNumericFilter}
            onUpdateCategoricalFilter={handleUpdateCategoricalFilter}
            onResetFilters={handleResetFilters}
            rawRows={parsedData.rawRows}
          />
        )}

        {/* Center Main Stage Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">正在載入並解析統計資料庫...</p>
            </div>
          ) : !parsedData ? (
            <div className="text-center py-20 text-slate-400">尚無資料，請匯入 CSV 或選擇範例資料集</div>
          ) : (
            <>
              {/* Tab 1: Scatter & Regression Studio */}
              {activeTab === 'scatter' && (
                <ScatterPlot
                  data={filteredRows}
                  xVar={xVariable}
                  yVar={yVariable}
                  groupVar={groupVariable}
                  correlationMethod={correlationMethod}
                  outlierMethod={outlierMethod}
                  excludeOutliers={excludeOutliers}
                  showConfidenceBand={showConfidenceBand}
                  showPredictionBand={showPredictionBand}
                  showResidualPlot={showResidualPlot}
                  onOpenGuide={() => setIsCausationModalOpen(true)}
                />
              )}

              {/* Tab 2: Correlation Matrix Heatmap */}
              {activeTab === 'matrix' && (
                <CorrelationMatrix
                  data={filteredRows}
                  selectedVariables={selectedVariables}
                  correlationMethod={correlationMethod}
                  onChangeCorrelationMethod={setCorrelationMethod}
                  deletionMethod={deletionMethod}
                  onChangeDeletionMethod={setDeletionMethod}
                  onSelectPair={handleSelectPairFromMatrix}
                  activeColorTheme={colorTheme}
                  onChangeColorTheme={setColorTheme}
                />
              )}

              {/* Tab 3: Data Schema & Descriptive Stats */}
              {activeTab === 'variables' && (
                <VariableInspector
                  columns={parsedData.columns}
                  selectedVariables={selectedVariables}
                  onToggleVariable={(vName) => {
                    if (selectedVariables.includes(vName)) {
                      if (selectedVariables.length > 2) {
                        setSelectedVariables(selectedVariables.filter((v) => v !== vName));
                      }
                    } else {
                      setSelectedVariables([...selectedVariables, vName]);
                    }
                  }}
                  onSetAsX={(vName) => {
                    setXVariable(vName);
                    setActiveTab('scatter');
                  }}
                  onSetAsY={(vName) => {
                    setYVariable(vName);
                    setActiveTab('scatter');
                  }}
                  onSetAsGroup={(vName) => {
                    setGroupVariable(vName);
                    setActiveTab('scatter');
                  }}
                  xVar={xVariable}
                  yVar={yVariable}
                  groupVar={groupVariable}
                />
              )}

              {/* Tab 4: Benchmark Tests */}
              {activeTab === 'verification' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        統計函式庫與國際標準基準檢驗 (Numerical Benchmark Suite)
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        實時運行 NIST StRD（美國國家標準與技術研究院）與 R 語言標準參考數據集，驗證 OLS 回歸、Pearson r、Spearman ρ 與 Simpson 悖論辨識的數值精度。
                      </p>
                    </div>
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                    >
                      開啟全螢幕檢驗視窗
                    </button>
                  </div>
                  <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                    <p className="text-slate-300 text-sm mb-4">
                      點擊下方按鈕以啟動驗證互動面板，即刻檢驗所有統計數學公式：
                    </p>
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
                    >
                      🚀 執行 NIST / R 統計基準驗證
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      <CausationGuideModal
        isOpen={isCausationModalOpen}
        onClose={() => setIsCausationModalOpen(false)}
      />

      <ShareConfigModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        config={workspaceConfig}
        onApplyConfig={handleApplyConfig}
      />
    </div>
  );
}
export default App;

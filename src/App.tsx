import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from './utils/theme';
import { Navbar } from './components/Navbar';
import { CausationBanner } from './components/CausationBanner';
import { Sidebar } from './components/Sidebar';
import { EChartsScatterPlot } from './components/EChartsScatterPlot';
import { ScatterPlot } from './components/ScatterPlot';
import { EChartsMatrix } from './components/EChartsMatrix';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { VariableInspector } from './components/VariableInspector';
import { VerificationModal } from './components/VerificationModal';
import { CausationGuideModal } from './components/CausationGuideModal';
import { ShareConfigModal } from './components/ShareConfigModal';
import { DatasetStorageModal } from './components/DatasetStorageModal';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import type { SampleDataset } from './data/sampleDatasets';
import { parseCSVString } from './utils/csvParser';
import type { ParsedDataset } from './utils/csvParser';
import {
  saveDataset,
  saveWorkspaceState,
  getWorkspaceState,
} from './utils/db';
import type { StoredDataset } from './utils/db';
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
  // Theme hook
  const { theme, setTheme, isDark } = useTheme();

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'scatter' | 'matrix' | 'variables' | 'verification'>('scatter');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCausationModalOpen, setIsCausationModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Active Dataset & Chart Engine State
  const [chartEngine, setChartEngine] = useState<'echarts' | 'svg'>('echarts');
  const [currentDatasetId, setCurrentDatasetId] = useState<string>('penguins');
  const [parsedData, setParsedData] = useState<ParsedDataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);

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

  // 1. Load Dataset From CSV String
  const loadDatasetFromCSV = useCallback(
    async (csvText: string, datasetMeta?: Partial<SampleDataset>, persistInDB = false) => {
      setIsLoading(true);
      try {
        const parsed = await parseCSVString(csvText);
        setParsedData(parsed);
        setCsvWarnings(parsed.warnings || []);

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

        // Save into IndexedDB if user uploaded custom dataset
        if (persistInDB && datasetMeta?.id) {
          await saveDataset({
            id: datasetMeta.id,
            name: datasetMeta.name || '自訂資料集',
            description: datasetMeta.description || '使用者本地上傳之 CSV',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            rowCount: parsed.rowCount,
            columnCount: parsed.columns.length,
            rawCsv: csvText,
            columns: parsed.columns,
            isBuiltin: false,
          });
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : '載入 CSV 失敗');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 2. Initial Setup: Check IndexedDB or URL Hash or Defaults
  useEffect(() => {
    const initApp = async () => {
      // Check if URL hash has config
      const hash = window.location.hash;
      if (hash && hash.includes('#config=')) {
        try {
          const jsonStr = decodeURIComponent(hash.split('#config=')[1]);
          const config = JSON.parse(jsonStr) as WorkspaceConfig;
          const foundDs = SAMPLE_DATASETS.find((d) => d.id === config.datasetName || d.name === config.datasetName);
          if (foundDs) {
            setCurrentDatasetId(foundDs.id);
            await loadDatasetFromCSV(foundDs.csv, foundDs);
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
            return;
          }
        } catch (err) {
          console.error('Error parsing config from hash', err);
        }
      }

      // Check if previous session state was saved in IndexedDB
      try {
        const savedState = await getWorkspaceState();
        if (savedState && savedState.activeDatasetId) {
          const foundDs = SAMPLE_DATASETS.find((d) => d.id === savedState.activeDatasetId);
          if (foundDs) {
            setCurrentDatasetId(foundDs.id);
            await loadDatasetFromCSV(foundDs.csv, foundDs);
            handleApplyConfig(savedState.config);
            return;
          }
        }
      } catch (err) {
        console.error('Failed reading IndexedDB state', err);
      }

      // Default: Palmer Penguins
      const defaultDs = SAMPLE_DATASETS[0];
      setCurrentDatasetId(defaultDs.id);
      await loadDatasetFromCSV(defaultDs.csv, defaultDs);
    };

    initApp();
  }, [loadDatasetFromCSV]);

  // Save current workspace state to IndexedDB on key changes
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

  useEffect(() => {
    if (parsedData && currentDatasetId) {
      saveWorkspaceState(currentDatasetId, workspaceConfig).catch(() => {});
    }
  }, [currentDatasetId, workspaceConfig, parsedData]);

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
        const customId = `custom_${Date.now()}`;
        const customName = file.name.replace(/\.[^/.]+$/, '');
        setCurrentDatasetId(customId);
        loadDatasetFromCSV(text, { id: customId, name: customName }, true);
      }
    };
    reader.readAsText(file);
  };

  // Load dataset from IndexedDB storage
  const handleLoadStoredDataset = (stored: StoredDataset) => {
    setCurrentDatasetId(stored.id);
    loadDatasetFromCSV(stored.rawCsv, {
      id: stored.id,
      name: stored.name,
      description: stored.description,
    });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
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
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileDrawerOpen((prev) => !prev)}
        rowCount={parsedData?.rowCount || 0}
        chartEngine={chartEngine}
        onChangeChartEngine={setChartEngine}
        theme={theme}
        onSetTheme={setTheme}
        isDark={isDark}
        xVar={xVariable}
        yVar={yVariable}
      />

      {/* CSV Parser Warnings (e.g. large file truncation notice) */}
      {csvWarnings.length > 0 && (
        <div className="bg-amber-100 dark:bg-amber-950 border-b border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️ {csvWarnings.join('；')}</span>
          </div>
          <button
            onClick={() => setCsvWarnings([])}
            className="text-amber-600 dark:text-amber-400 hover:underline text-[11px] cursor-pointer"
          >
            知道了
          </button>
        </div>
      )}

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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto min-w-0">
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
            isMobileDrawerOpen={isMobileDrawerOpen}
            onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          />
        )}

        {/* Center Main Stage Content */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto min-w-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">正在載入並解析統計資料庫...</p>
            </div>
          ) : !parsedData ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-xs">尚無資料，請匯入 CSV 或選擇範例資料集</div>
          ) : (
            <>
              {/* Tab 1: Scatter & Regression Studio */}
              {activeTab === 'scatter' && (
                chartEngine === 'echarts' ? (
                  <EChartsScatterPlot
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
                    isDark={isDark}
                  />
                ) : (
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
                    isDark={isDark}
                  />
                )
              )}

              {/* Tab 2: Correlation Matrix Heatmap */}
              {activeTab === 'matrix' && (
                chartEngine === 'echarts' ? (
                  <EChartsMatrix
                    data={filteredRows}
                    selectedVariables={selectedVariables}
                    correlationMethod={correlationMethod}
                    onChangeCorrelationMethod={setCorrelationMethod}
                    deletionMethod={deletionMethod}
                    onChangeDeletionMethod={setDeletionMethod}
                    onSelectPair={handleSelectPairFromMatrix}
                    activeColorTheme={colorTheme}
                    onChangeColorTheme={setColorTheme}
                    isDark={isDark}
                  />
                ) : (
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
                    isDark={isDark}
                  />
                )
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
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        數值基準檢驗套件 (NIST StRD & R Benchmarks)
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        即時運行美國國家標準局 (NIST) 與 R 語言標準參考資料集，全面驗證線性回歸、相關係數與辛普森悖論之數值精度。
                      </p>
                    </div>
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium cursor-pointer shadow-sm transition-colors whitespace-nowrap"
                    >
                      開啟驗證視窗
                    </button>
                  </div>
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
                    <p className="text-slate-700 dark:text-slate-300 text-xs">
                      所有統計演算法皆完全在純 TypeScript 內部實作，不依賴外部不透明 API：
                    </p>
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md transition-colors"
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

      <DatasetStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        activeDatasetId={currentDatasetId}
        currentConfig={workspaceConfig}
        onLoadDataset={handleLoadStoredDataset}
        onRestoreSnapshot={handleApplyConfig}
      />
    </div>
  );
}
export default App;

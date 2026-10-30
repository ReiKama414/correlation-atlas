import React, { useState } from 'react';
import {
  Layers,
  Activity,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';
import type { ColumnMetadata, CorrelationMethod, DeletionMethod, OutlierMethod } from '../types';

interface SidebarProps {
  columns: ColumnMetadata[];
  selectedVariables: string[];
  onChangeSelectedVariables: (vars: string[]) => void;
  xVariable: string;
  onChangeXVariable: (x: string) => void;
  yVariable: string;
  onChangeYVariable: (y: string) => void;
  groupVariable: string | null;
  onChangeGroupVariable: (grp: string | null) => void;
  correlationMethod: CorrelationMethod;
  onChangeCorrelationMethod: (m: CorrelationMethod) => void;
  deletionMethod: DeletionMethod;
  onChangeDeletionMethod: (d: DeletionMethod) => void;
  outlierMethod: OutlierMethod;
  onChangeOutlierMethod: (o: OutlierMethod) => void;
  excludeOutliers: boolean;
  onToggleExcludeOutliers: () => void;
  showConfidenceBand: boolean;
  onToggleConfidenceBand: () => void;
  showPredictionBand: boolean;
  onTogglePredictionBand: () => void;
  showResidualPlot: boolean;
  onToggleResidualPlot: () => void;
  filters: {
    numeric: Record<string, [number, number]>;
    categorical: Record<string, string[]>;
  };
  onUpdateNumericFilter: (colName: string, range: [number, number]) => void;
  onUpdateCategoricalFilter: (colName: string, selectedValues: string[]) => void;
  onResetFilters: () => void;
  rawRows: Record<string, unknown>[];
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  columns,
  selectedVariables,
  onChangeSelectedVariables,
  xVariable,
  onChangeXVariable,
  yVariable,
  onChangeYVariable,
  groupVariable,
  onChangeGroupVariable,
  correlationMethod,
  onChangeCorrelationMethod,
  deletionMethod,
  onChangeDeletionMethod,
  outlierMethod,
  onChangeOutlierMethod,
  excludeOutliers,
  onToggleExcludeOutliers,
  showConfidenceBand,
  onToggleConfidenceBand,
  showPredictionBand,
  onTogglePredictionBand,
  showResidualPlot,
  onToggleResidualPlot,
  filters,
  onUpdateNumericFilter,
  onUpdateCategoricalFilter,
  onResetFilters,
  rawRows,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
}) => {
  const [activeAccordion, setActiveAccordion] = useState<'variables' | 'model' | 'filters'>('variables');

  const numericColumns = columns.filter((c) => c.type === 'numeric');
  const categoricalColumns = columns.filter((c) => c.type === 'categorical' || c.distinctCount <= 15);

  const handleToggleVariableInMatrix = (varName: string) => {
    if (selectedVariables.includes(varName)) {
      if (selectedVariables.length > 2) {
        onChangeSelectedVariables(selectedVariables.filter((v) => v !== varName));
      }
    } else {
      onChangeSelectedVariables([...selectedVariables, varName]);
    }
  };

  const handleSelectAllMatrixVariables = () => {
    onChangeSelectedVariables(numericColumns.map((c) => c.name));
  };

  const handleClearMatrixVariables = () => {
    if (numericColumns.length >= 2) {
      onChangeSelectedVariables([numericColumns[0].name, numericColumns[1].name]);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 text-xs w-full">
      {/* Mobile Drawer Header with Close Button */}
      <div className="lg:hidden flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 font-semibold">
        <span>分析參數與篩選設定</span>
        <button
          onClick={onCloseMobileDrawer}
          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="關閉參數抽屜"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Accordion Tabs */}
      <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 font-medium shrink-0">
        <button
          onClick={() => setActiveAccordion('variables')}
          className={`py-2.5 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 text-[11px] ${
            activeAccordion === 'variables'
              ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>變數選取</span>
        </button>

        <button
          onClick={() => setActiveAccordion('model')}
          className={`py-2.5 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 text-[11px] ${
            activeAccordion === 'model'
              ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>模型與離群</span>
        </button>

        <button
          onClick={() => setActiveAccordion('filters')}
          className={`py-2.5 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 text-[11px] ${
            activeAccordion === 'filters'
              ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>動態篩選</span>
        </button>
      </div>

      {/* Accordion Panels */}
      <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {/* Accordion 1: Variable Selection */}
        {activeAccordion === 'variables' && (
          <div className="space-y-3.5">
            {/* Scatter Axes */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between text-xs">
                <span>散佈圖座標軸 (Scatter Axes)</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">X vs Y</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                  X 軸變數 (自變數 / 橫軸):
                </label>
                <select
                  value={xVariable}
                  onChange={(e) => onChangeXVariable(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                >
                  {numericColumns.map((c) => (
                    <option key={`x-${c.name}`} value={c.name}>
                      {c.name} {c.mean !== undefined ? `(μ=${c.mean.toFixed(1)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                  Y 軸變數 (應變數 / 縱軸):
                </label>
                <select
                  value={yVariable}
                  onChange={(e) => onChangeYVariable(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                >
                  {numericColumns.map((c) => (
                    <option key={`y-${c.name}`} value={c.name}>
                      {c.name} {c.mean !== undefined ? `(μ=${c.mean.toFixed(1)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grouping variable */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">
                    分組變數 (Simpson's Paradox):
                  </label>
                  {groupVariable && (
                    <button
                      onClick={() => onChangeGroupVariable(null)}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      清除分組
                    </button>
                  )}
                </div>
                <select
                  value={groupVariable || ''}
                  onChange={(e) => onChangeGroupVariable(e.target.value || null)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                >
                  <option value="">-- 無分組 (全體資料) --</option>
                  {categoricalColumns.map((c) => (
                    <option key={`grp-${c.name}`} value={c.name}>
                      {c.name} ({c.distinctCount} 個分組)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Matrix Variables Selector */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  相關矩陣納入 ({selectedVariables.length}/{numericColumns.length})
                </span>
                <div className="flex gap-2 text-[10px]">
                  <button
                    onClick={handleSelectAllMatrixVariables}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    全選
                  </button>
                  <span className="text-slate-400">|</span>
                  <button
                    onClick={handleClearMatrixVariables}
                    className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    重設
                  </button>
                </div>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {numericColumns.map((c) => {
                  const isChecked = selectedVariables.includes(c.name);
                  return (
                    <label
                      key={`matrix-chk-${c.name}`}
                      className="flex items-center justify-between px-2 py-1.5 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleVariableInMatrix(c.name)}
                          className="rounded text-indigo-600 focus:ring-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 cursor-pointer h-3.5 w-3.5"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap ml-2">
                        {c.missingCount > 0 ? `缺${c.missingCount}` : '完整'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Accordion 2: Statistical Model & Outliers */}
        {activeAccordion === 'model' && (
          <div className="space-y-3.5">
            {/* Correlation Method */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                相關係數演算法 (Correlation Type)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeCorrelationMethod('pearson')}
                  className={`py-1.5 px-2 rounded border text-center transition-all cursor-pointer font-medium text-xs ${
                    correlationMethod === 'pearson'
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-400 text-indigo-700 dark:text-indigo-200 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>Pearson (r)</div>
                  <div className="text-[9px] text-slate-500">線性關聯</div>
                </button>

                <button
                  onClick={() => onChangeCorrelationMethod('spearman')}
                  className={`py-1.5 px-2 rounded border text-center transition-all cursor-pointer font-medium text-xs ${
                    correlationMethod === 'spearman'
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-400 text-indigo-700 dark:text-indigo-200 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>Spearman (ρ)</div>
                  <div className="text-[9px] text-slate-500">單調等級</div>
                </button>
              </div>
            </div>

            {/* Missing Value Handling */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                缺失值處理策略 (Missing Deletion)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeDeletionMethod('pairwise')}
                  className={`py-1 px-1.5 rounded border text-center transition-all cursor-pointer text-xs ${
                    deletionMethod === 'pairwise'
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-400 text-indigo-700 dark:text-indigo-200 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  成對剔除 (Pairwise)
                </button>
                <button
                  onClick={() => onChangeDeletionMethod('listwise')}
                  className={`py-1 px-1.5 rounded border text-center transition-all cursor-pointer text-xs ${
                    deletionMethod === 'listwise'
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-400 text-indigo-700 dark:text-indigo-200 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  整列剔除 (Listwise)
                </button>
              </div>
            </div>

            {/* Outlier Detection */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                離群值檢驗演算法 (Outliers)
              </span>

              <div className="space-y-1.5">
                {[
                  { id: 'cooks', title: "Cook's 距離 (迴歸影響點)", desc: 'Di > 4/n 槓桿影響力' },
                  { id: 'iqr', title: 'Tukey IQR 四分位距', desc: '超出 1.5×IQR 圍欄' },
                  { id: 'zscore', title: '標準化 Z 分數', desc: '|Z| > 2.5 個標準差' },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                      outlierMethod === m.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-xs">{m.title}</div>
                      <div className="text-[10px] text-slate-500">{m.desc}</div>
                    </div>
                    <input
                      type="radio"
                      name="outlierMethod"
                      checked={outlierMethod === m.id}
                      onChange={() => onChangeOutlierMethod(m.id as OutlierMethod)}
                      className="text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              {/* Exclude Outliers Toggle */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-900 dark:text-slate-200 text-xs">
                    從回歸與相關中剔除離群值
                  </span>
                  <input
                    type="checkbox"
                    checked={excludeOutliers}
                    onChange={onToggleExcludeOutliers}
                    className="rounded text-rose-600 focus:ring-0 h-4 w-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  勾選後，所有回歸線、斜率與 R² 將即時排除離群點重算。
                </p>
              </div>
            </div>

            {/* Chart Overlays */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">圖表輔助區間帶</span>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300 text-xs">95% 信賴區間帶 (CI Band)</span>
                <input
                  type="checkbox"
                  checked={showConfidenceBand}
                  onChange={onToggleConfidenceBand}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300 text-xs">95% 預測區間帶 (Prediction Band)</span>
                <input
                  type="checkbox"
                  checked={showPredictionBand}
                  onChange={onTogglePredictionBand}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300 text-xs">殘差診斷圖 (Residual Plot)</span>
                <input
                  type="checkbox"
                  checked={showResidualPlot}
                  onChange={onToggleResidualPlot}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Accordion 3: Dynamic Data Filters */}
        {activeAccordion === 'filters' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">條件篩選器</span>
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> 重設
              </button>
            </div>

            {/* Numeric Sliders */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider block">
                連續數值範圍
              </span>

              {numericColumns.slice(0, 5).map((col) => {
                if (col.min === undefined || col.max === undefined) return null;
                const currentRange = filters.numeric[col.name] || [col.min, col.max];

                return (
                  <div
                    key={`num-filter-${col.name}`}
                    className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 text-xs">
                      <span className="font-medium truncate">{col.name}</span>
                      <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                        [{currentRange[0].toFixed(1)} ~ {currentRange[1].toFixed(1)}]
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-500">最小值:</span>
                        <input
                          type="range"
                          min={col.min}
                          max={col.max}
                          step={(col.max - col.min) / 100 || 0.1}
                          value={currentRange[0]}
                          onChange={(e) =>
                            onUpdateNumericFilter(col.name, [
                              parseFloat(e.target.value),
                              Math.max(parseFloat(e.target.value), currentRange[1]),
                            ])
                          }
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500">最大值:</span>
                        <input
                          type="range"
                          min={col.min}
                          max={col.max}
                          step={(col.max - col.min) / 100 || 0.1}
                          value={currentRange[1]}
                          onChange={(e) =>
                            onUpdateNumericFilter(col.name, [
                              Math.min(currentRange[0], parseFloat(e.target.value)),
                              parseFloat(e.target.value),
                            ])
                          }
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Categorical Select Filter */}
            {categoricalColumns.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider block">
                  類別群組篩選
                </span>

                {categoricalColumns.slice(0, 3).map((col) => {
                  const uniqueVals = Array.from(
                    new Set(
                      rawRows
                        .map((r) => String(r[col.name] ?? '').trim())
                        .filter((v) => v !== '')
                    )
                  ).slice(0, 8);

                  const selectedVals = filters.categorical[col.name] || uniqueVals;

                  return (
                    <div
                      key={`cat-filter-${col.name}`}
                      className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">{col.name}</div>
                      <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                        {uniqueVals.map((val) => {
                          const isSel = selectedVals.includes(val);
                          return (
                            <button
                              key={val}
                              onClick={() => {
                                const next = isSel
                                  ? selectedVals.filter((v) => v !== val)
                                  : [...selectedVals, val];
                                onUpdateCategoricalFilter(col.name, next);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                                isSel
                                  ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-400 text-indigo-700 dark:text-indigo-200'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 line-through opacity-60'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Inline Sidebar (lg: and wider) */}
      <aside className="hidden lg:flex lg:w-80 shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-Over (screens < lg) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileDrawer}
          />
          {/* Drawer container */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

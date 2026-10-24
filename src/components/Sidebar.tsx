import React, { useState } from 'react';
import {
  Layers,
  Activity,
  Filter,
  RefreshCw,
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

  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col shrink-0 text-xs">
      {/* Sidebar Navigation Tabs */}
      <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 font-medium">
        <button
          onClick={() => setActiveAccordion('variables')}
          className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeAccordion === 'variables'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>變數選取</span>
        </button>

        <button
          onClick={() => setActiveAccordion('model')}
          className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeAccordion === 'model'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>模型與離群</span>
        </button>

        <button
          onClick={() => setActiveAccordion('filters')}
          className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeAccordion === 'filters'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>動態篩選</span>
        </button>
      </div>

      <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-slate-700">
        {/* Accordion 1: Variable Selection */}
        {activeAccordion === 'variables' && (
          <div className="space-y-4">
            {/* Scatter Axis Selectors */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
              <div className="font-semibold text-slate-100 flex items-center justify-between">
                <span>散佈圖座標軸 (Scatter Axes)</span>
                <span className="text-[10px] text-indigo-400 font-mono">X vs Y</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  X 軸變數 (自變數 / 橫軸):
                </label>
                <select
                  value={xVariable}
                  onChange={(e) => onChangeXVariable(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {numericColumns.map((c) => (
                    <option key={`x-${c.name}`} value={c.name}>
                      {c.name} {c.mean !== undefined ? `(μ=${c.mean.toFixed(1)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Y 軸變數 (應變數 / 縱軸):
                </label>
                <select
                  value={yVariable}
                  onChange={(e) => onChangeYVariable(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {numericColumns.map((c) => (
                    <option key={`y-${c.name}`} value={c.name}>
                      {c.name} {c.mean !== undefined ? `(μ=${c.mean.toFixed(1)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grouping variable (Categorical) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400">
                    分組比較變數 (Simpson's Paradox):
                  </label>
                  {groupVariable && (
                    <button
                      onClick={() => onChangeGroupVariable(null)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      清除分組
                    </button>
                  )}
                </div>
                <select
                  value={groupVariable || ''}
                  onChange={(e) => onChangeGroupVariable(e.target.value || null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100">
                  相關矩陣變數 ({selectedVariables.length}/{numericColumns.length})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllMatrixVariables}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    全選
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={handleClearMatrixVariables}
                    className="text-[10px] text-slate-400 hover:text-slate-300 cursor-pointer"
                  >
                    重設
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {numericColumns.map((c) => {
                  const isChecked = selectedVariables.includes(c.name);
                  return (
                    <label
                      key={`matrix-chk-${c.name}`}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleVariableInMatrix(c.name)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-800 border-slate-600"
                        />
                        <span className="font-medium text-slate-200 truncate">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
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
          <div className="space-y-4">
            {/* Correlation Method */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <span className="font-semibold text-slate-100 block">
                相關係數演算法 (Correlation Type)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeCorrelationMethod('pearson')}
                  className={`py-2 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                    correlationMethod === 'pearson'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold">Pearson (r)</div>
                  <div className="text-[10px] text-slate-400">線性關聯</div>
                </button>

                <button
                  onClick={() => onChangeCorrelationMethod('spearman')}
                  className={`py-2 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                    correlationMethod === 'spearman'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold">Spearman (ρ)</div>
                  <div className="text-[10px] text-slate-400">等級單調關聯</div>
                </button>
              </div>
            </div>

            {/* Missing Value Strategy */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <span className="font-semibold text-slate-100 block">
                缺失值刪除機制 (Missing Deletion)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeDeletionMethod('pairwise')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    deletionMethod === 'pairwise'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400'
                  }`}
                >
                  成對剔除 (Pairwise)
                </button>
                <button
                  onClick={() => onChangeDeletionMethod('listwise')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    deletionMethod === 'listwise'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400'
                  }`}
                >
                  整列剔除 (Listwise)
                </button>
              </div>
            </div>

            {/* Outlier Detection */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
              <span className="font-semibold text-slate-100 block">
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
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      outlierMethod === m.id
                        ? 'bg-indigo-600/20 border-indigo-500/80 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-[10px] text-slate-400">{m.desc}</div>
                    </div>
                    <input
                      type="radio"
                      name="outlierMethod"
                      checked={outlierMethod === m.id}
                      onChange={() => onChangeOutlierMethod(m.id as OutlierMethod)}
                      className="text-indigo-600 focus:ring-0"
                    />
                  </label>
                ))}
              </div>

              {/* Exclude Outliers Toggle */}
              <div className="pt-2 border-t border-slate-700/60">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-200">
                    從回歸與相關中剔除離群值
                  </span>
                  <input
                    type="checkbox"
                    checked={excludeOutliers}
                    onChange={onToggleExcludeOutliers}
                    className="rounded text-rose-600 focus:ring-0 h-4 w-4 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">
                  勾選後，所有回歸線、斜率與 R² 將動態移除離群點重算，展示強健性差異。
                </p>
              </div>
            </div>

            {/* Chart Overlays */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <span className="font-semibold text-slate-100 block">圖表輔助區間帶</span>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">95% 信賴區間帶 (CI Band)</span>
                <input
                  type="checkbox"
                  checked={showConfidenceBand}
                  onChange={onToggleConfidenceBand}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">95% 預測區間帶 (Prediction Band)</span>
                <input
                  type="checkbox"
                  checked={showPredictionBand}
                  onChange={onTogglePredictionBand}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-slate-300">殘差診斷圖 (Residual Plot)</span>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">條件篩選器</span>
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> 重設所有篩選
              </button>
            </div>

            {/* Numeric Columns Range Sliders */}
            <div className="space-y-3">
              <span className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider block">
                數值範圍篩選
              </span>

              {numericColumns.slice(0, 5).map((col) => {
                if (col.min === undefined || col.max === undefined) return null;
                const currentRange = filters.numeric[col.name] || [col.min, col.max];

                return (
                  <div
                    key={`num-filter-${col.name}`}
                    className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-medium truncate">{col.name}</span>
                      <span className="font-mono text-[10px] text-indigo-300">
                        [{currentRange[0].toFixed(1)} ~ {currentRange[1].toFixed(1)}]
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400">最小值:</span>
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
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400">最大值:</span>
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
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Categorical Filter */}
            {categoricalColumns.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider block">
                  類別篩選
                </span>

                {categoricalColumns.slice(0, 3).map((col) => {
                  // Find all unique values in this column
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
                      className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 space-y-1.5"
                    >
                      <div className="font-medium text-slate-300">{col.name}</div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
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
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                                isSel
                                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 line-through opacity-60'
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
    </aside>
  );
};

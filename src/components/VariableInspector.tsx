import React from 'react';
import type { ColumnMetadata } from '../types';
import { formatNumber } from '../utils/colors';

interface VariableInspectorProps {
  columns: ColumnMetadata[];
  selectedVariables: string[];
  onToggleVariable: (colName: string) => void;
  onSetAsX: (colName: string) => void;
  onSetAsY: (colName: string) => void;
  onSetAsGroup: (colName: string) => void;
  xVar: string;
  yVar: string;
  groupVar: string | null;
}

export const VariableInspector: React.FC<VariableInspectorProps> = ({
  columns,
  selectedVariables,
  onToggleVariable,
  onSetAsX,
  onSetAsY,
  onSetAsGroup,
  xVar,
  yVar,
  groupVar,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              變數資料結構與描述統計總覽 (Data Schema & Descriptive Statistics)
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 whitespace-nowrap shrink-0">
              {columns.length} 個欄位
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            檢視各變數的統計分佈、四分位距、偏度與缺失值比例，並可指派為座標軸或分組因子
          </p>
        </div>
      </div>

      {/* Variables Table */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[880px]">
            <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                <th className="py-2.5 px-2 text-center whitespace-nowrap w-12 shrink-0">納入</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[140px]">欄位名稱 (Variable)</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[110px]">類型 (Type)</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[105px]">缺失值 (Missing)</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap min-w-[65px]">平均數</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap min-w-[65px]">中位數</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[100px]">極值 [Min, Max]</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap min-w-[65px]">標準差 (SD)</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[60px]">偏度</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[140px] pr-4">設為分析座標</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {columns.map((col) => {
                const isChecked = selectedVariables.includes(col.name);
                const isCurrentX = col.name === xVar;
                const isCurrentY = col.name === yVar;
                const isCurrentGroup = col.name === groupVar;

                return (
                  <tr
                    key={`col-row-${col.name}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Active Matrix Checkbox */}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      {col.type === 'numeric' ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleVariable(col.name)}
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer h-3.5 w-3.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Name & Active Tags */}
                    <td className="py-2 px-2.5 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-slate-900 dark:text-white font-mono text-xs font-semibold tracking-tight">{col.name}</span>
                        {isCurrentX && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shrink-0 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/40">
                            X 軸
                          </span>
                        )}
                        {isCurrentY && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shrink-0 bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-400/40">
                            Y 軸
                          </span>
                        )}
                        {isCurrentGroup && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shrink-0 bg-pink-100 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-400/40">
                            分組
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                          col.type === 'numeric'
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : col.type === 'categorical'
                            ? 'bg-pink-50 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30'
                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.type === 'numeric' ? 'bg-emerald-500' : 'bg-pink-500'}`} />
                        <span>{col.type === 'numeric' ? '數值 (Numeric)' : '類別 (Category)'}</span>
                      </span>
                    </td>

                    {/* Missing Value Bar */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-10 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shrink-0">
                          <div
                            className={`h-full ${
                              col.missingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, col.missingRate * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                          {col.missingCount > 0
                            ? `${col.missingCount} (${(col.missingRate * 100).toFixed(1)}%)`
                            : '0% 完整'}
                        </span>
                      </div>
                    </td>

                    {/* Mean */}
                    <td className="py-2 px-2 font-mono text-right whitespace-nowrap text-slate-800 dark:text-slate-200">
                      {col.mean !== undefined ? formatNumber(col.mean, 2) : '—'}
                    </td>

                    {/* Median */}
                    <td className="py-2 px-2 font-mono text-right whitespace-nowrap text-slate-800 dark:text-slate-200">
                      {col.median !== undefined ? formatNumber(col.median, 2) : '—'}
                    </td>

                    {/* [Min, Max] */}
                    <td className="py-2 px-2 font-mono text-center whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {col.min !== undefined && col.max !== undefined
                        ? `[${formatNumber(col.min, 1)}, ${formatNumber(col.max, 1)}]`
                        : `${col.distinctCount} 類別`}
                    </td>

                    {/* StdDev */}
                    <td className="py-2 px-2 font-mono text-right whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {col.stdDev !== undefined ? formatNumber(col.stdDev, 2) : '—'}
                    </td>

                    {/* Skewness */}
                    <td className="py-2 px-2 font-mono text-center whitespace-nowrap">
                      {col.type === 'numeric' ? (
                        col.mean !== undefined && col.median !== undefined ? (
                          col.mean > col.median ? (
                            <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">右偏 (+)</span>
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">左偏 (-)</span>
                          )
                        ) : (
                          '—'
                        )
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap pr-4">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                        {col.type === 'numeric' && (
                          <>
                            <button
                              onClick={() => onSetAsX(col.name)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors font-medium ${
                                isCurrentX
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              設為 X
                            </button>
                            <button
                              onClick={() => onSetAsY(col.name)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors font-medium ${
                                isCurrentY
                                  ? 'bg-cyan-600 text-white font-bold'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              設為 Y
                            </button>
                          </>
                        )}

                        {(col.type === 'categorical' || col.distinctCount <= 15) && (
                          <button
                            onClick={() => onSetAsGroup(col.name)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors font-medium ${
                              isCurrentGroup
                                ? 'bg-pink-600 text-white font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            設為分組
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

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
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight min-w-0">
              變數資料結構與描述統計總覽 (Data Schema & Descriptive Statistics)
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 whitespace-nowrap shrink-0">
              {columns.length} 個欄位
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            檢視各變數的統計分佈、四分位距、偏度與缺失值比例，並可指派為座標軸或分組因子
          </p>
        </div>
      </div>

      {/* Variables Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden min-w-0 max-w-full">
        <div className="overflow-x-auto min-w-0 max-w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[840px]">
            <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 font-semibold border-b border-zinc-200 dark:border-zinc-700 text-[11px] select-none">
              <tr>
                <th className="py-2.5 px-2 text-center whitespace-nowrap w-9 shrink-0">納入</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[140px]">欄位名稱 (Variable)</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[110px]">類型 (Type)</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[85px]">缺失率</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap min-w-[55px]">平均數</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap min-w-[55px]">中位數</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[95px]">極值 [Min, Max]</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap min-w-[55px]">標準差</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[60px]">偏度</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[130px] pr-4">指派角色</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px] text-zinc-800 dark:text-zinc-200">
              {columns.map((col) => {
                const isChecked = selectedVariables.includes(col.name);
                const isCurrentX = col.name === xVar;
                const isCurrentY = col.name === yVar;
                const isCurrentGroup = col.name === groupVar;

                return (
                  <tr
                    key={`col-row-${col.name}`}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Active Matrix Checkbox */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {col.type === 'numeric' ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleVariable(col.name)}
                          className="rounded text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer h-3.5 w-3.5 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                        />
                      ) : (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Name & Active Tags */}
                    <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs font-semibold tracking-tight whitespace-nowrap">
                          {col.name}
                        </span>
                        {isCurrentX && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shrink-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                            X 軸
                          </span>
                        )}
                        {isCurrentY && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shrink-0 bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900">
                            Y 軸
                          </span>
                        )}
                        {isCurrentGroup && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shrink-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-400 dark:border-zinc-600">
                            分組
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type Badge (Insight-Canvas Monochrome) */}
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shrink-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                        {col.type === 'numeric' ? '# 數值 (Numeric)' : '類別 (Categorical)'}
                      </span>
                    </td>

                    {/* Missing Value Bar */}
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <div className="w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden shrink-0">
                          <div
                            className={`h-full ${
                              col.missingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(col.missingRate * 100, col.missingCount > 0 ? 10 : 100))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap shrink-0">
                          {col.missingCount > 0
                            ? `${col.missingCount} (${(col.missingRate * 100).toFixed(1)}%)`
                            : '0%'}
                        </span>
                      </div>
                    </td>

                    {/* Mean */}
                    <td className="py-2.5 px-2 font-mono text-right whitespace-nowrap text-zinc-800 dark:text-zinc-200">
                      {col.mean !== undefined ? formatNumber(col.mean, 2) : '—'}
                    </td>

                    {/* Median */}
                    <td className="py-2.5 px-2 font-mono text-right whitespace-nowrap text-zinc-800 dark:text-zinc-200">
                      {col.median !== undefined ? formatNumber(col.median, 2) : '—'}
                    </td>

                    {/* [Min, Max] */}
                    <td className="py-2.5 px-2 font-mono text-center whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                      {col.min !== undefined && col.max !== undefined
                        ? `[${formatNumber(col.min, 1)}, ${formatNumber(col.max, 1)}]`
                        : `${col.distinctCount} 類別`}
                    </td>

                    {/* StdDev */}
                    <td className="py-2.5 px-2 font-mono text-right whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                      {col.stdDev !== undefined ? formatNumber(col.stdDev, 2) : '—'}
                    </td>

                    {/* Skewness */}
                    <td className="py-2.5 px-2 font-mono text-center whitespace-nowrap">
                      {col.type === 'numeric' ? (
                        col.mean !== undefined && col.median !== undefined ? (
                          col.mean > col.median ? (
                            <span className="text-zinc-700 dark:text-zinc-300 whitespace-nowrap">右偏 (正)</span>
                          ) : (
                            <span className="text-zinc-700 dark:text-zinc-300 whitespace-nowrap">左偏 (負)</span>
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
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap shrink-0">
                        {col.type === 'numeric' && (
                          <>
                            <button
                              onClick={() => onSetAsX(col.name)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors font-medium ${
                                isCurrentX
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs'
                                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              設為 X
                            </button>
                            <button
                              onClick={() => onSetAsY(col.name)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors font-medium ${
                                isCurrentY
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs'
                                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
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
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs'
                                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
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

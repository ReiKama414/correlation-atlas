import React, { useState, useMemo, useRef } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import {
  computeCorrelationMatrix,
  seriateVariables,
} from '../utils/statistics';
import type { MatrixCell } from '../utils/statistics';
import { getCorrelationColor, formatNumber, formatPValue } from '../utils/colors';
import { exportToCSV } from '../utils/csvParser';
import type {
  CorrelationMethod,
  DeletionMethod,
  MatrixDisplayMode,
  MatrixOrder,
} from '../types';
import * as htmlToImage from 'html-to-image';

interface CorrelationMatrixProps {
  data: Record<string, unknown>[];
  selectedVariables: string[];
  correlationMethod: CorrelationMethod;
  onChangeCorrelationMethod: (m: CorrelationMethod) => void;
  deletionMethod: DeletionMethod;
  onChangeDeletionMethod: (d: DeletionMethod) => void;
  onSelectPair: (xVar: string, yVar: string) => void;
  activeColorTheme: 'coolwarm' | 'emerald' | 'viridis' | 'sunset';
  onChangeColorTheme: (theme: 'coolwarm' | 'emerald' | 'viridis' | 'sunset') => void;
  isDark?: boolean;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  data,
  selectedVariables,
  correlationMethod,
  onChangeCorrelationMethod,
  deletionMethod,
  onChangeDeletionMethod,
  onSelectPair,
  activeColorTheme,
  onChangeColorTheme,
  isDark = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayMode, setDisplayMode] = useState<MatrixDisplayMode>('full');
  const [orderMode, setOrderMode] = useState<MatrixOrder>('original');
  const [hoveredCell, setHoveredCell] = useState<MatrixCell | null>(null);

  // Compute Base Matrix
  const baseResult = useMemo(() => {
    return computeCorrelationMatrix(data, selectedVariables, correlationMethod, deletionMethod);
  }, [data, selectedVariables, correlationMethod, deletionMethod]);

  // Order Variables based on orderMode
  const orderedVariables = useMemo(() => {
    if (orderMode === 'alphabetical') {
      return [...selectedVariables].sort();
    }
    if (orderMode === 'seriated' && baseResult.matrix.length > 2) {
      return seriateVariables(baseResult.matrix, selectedVariables);
    }
    return selectedVariables;
  }, [selectedVariables, orderMode, baseResult.matrix]);

  // Re-compute or re-order matrix according to orderedVariables
  const currentMatrix = useMemo(() => {
    return computeCorrelationMatrix(data, orderedVariables, correlationMethod, deletionMethod).matrix;
  }, [data, orderedVariables, correlationMethod, deletionMethod]);

  // Significance star symbol
  const getSigStars = (p: number) => {
    if (p < 0.001) return '***';
    if (p < 0.01) return '**';
    if (p < 0.05) return '*';
    return '';
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Variable', ...orderedVariables];
    const rows = orderedVariables.map((vRow, i) => {
      const rowData = [vRow];
      for (let j = 0; j < orderedVariables.length; j++) {
        rowData.push(currentMatrix[i][j].r.toFixed(4));
      }
      return rowData;
    });
    exportToCSV(`Correlation_Matrix_${correlationMethod}.csv`, headers, rows);
  };

  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(containerRef.current, {
        backgroundColor: isDark ? '#09090b' : '#ffffff',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Correlation_Matrix_${correlationMethod}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export matrix PNG', err);
    }
  };

  return (
    <div className="space-y-4 min-w-0 max-w-full" data-testid="matrix-container">
      {/* Matrix Controls & Toolbar */}
      <div
        data-testid="matrix-header"
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 data-testid="matrix-title" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              相關係數矩陣熱圖 ({correlationMethod === 'spearman' ? 'Spearman ρ' : 'Pearson r'})
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {orderedVariables.length} × {orderedVariables.length} 維度
            </span>
          </div>
          <p data-testid="matrix-description" className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            點擊任一熱圖方格可立即跳轉至該變數成對之散佈圖與回歸分析視圖
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Method Selector */}
          <select
            value={correlationMethod}
            onChange={(e) => onChangeCorrelationMethod(e.target.value as CorrelationMethod)}
            aria-label="選擇相關係數類型"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="pearson">Pearson 線性相關 (r)</option>
            <option value="spearman">Spearman 等級相關 (ρ)</option>
          </select>

          {/* Deletion Strategy */}
          <select
            value={deletionMethod}
            onChange={(e) => onChangeDeletionMethod(e.target.value as DeletionMethod)}
            aria-label="選擇缺失值刪除機制"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="pairwise">成對刪除 (Pairwise)</option>
            <option value="listwise">整列刪除 (Listwise)</option>
          </select>

          {/* Display Mode: Full / Lower / Upper */}
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as MatrixDisplayMode)}
            aria-label="選擇矩陣顯示模式"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="full">全對稱矩陣 (Full)</option>
            <option value="lower">下三角矩陣 (Lower)</option>
            <option value="upper">上三角矩陣 (Upper)</option>
          </select>

          {/* Ordering Mode */}
          <select
            value={orderMode}
            onChange={(e) => setOrderMode(e.target.value as MatrixOrder)}
            aria-label="選擇矩陣排序規則"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="original">原始順序 (Original)</option>
            <option value="seriated">分群排序 (Clustered Seriation)</option>
            <option value="alphabetical">字母順序 (A-Z)</option>
          </select>

          {/* Color Palette */}
          <select
            value={activeColorTheme}
            onChange={(e) =>
              onChangeColorTheme(e.target.value as 'coolwarm' | 'emerald' | 'viridis' | 'sunset')
            }
            aria-label="選擇色階調色盤"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="coolwarm">藍白紅 (Cool-Warm)</option>
            <option value="emerald">紫白綠 (Emerald-Purple)</option>
            <option value="sunset">靛白橙 (Sunset)</option>
            <option value="viridis">翠綠 (Viridis)</option>
          </select>

          {/* Download Buttons */}
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors shadow-xs"
            title="下載矩陣 PNG 圖片"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>PNG</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors shadow-xs"
            title="下載相關矩陣 CSV 表格"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Matrix Table & Heatmap Display */}
      <div
        ref={containerRef}
        className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-x-auto"
      >
        <div className="inline-block min-w-full align-middle">
          <table className="border-collapse table-auto text-xs font-mono select-none">
            <thead>
              <tr>
                <th className="p-2 text-zinc-500 dark:text-zinc-400 font-normal text-left sticky left-0 bg-white dark:bg-zinc-900 z-10 min-w-[120px]">
                  變數矩陣
                </th>
                {orderedVariables.map((v) => (
                  <th
                    key={`header-${v}`}
                    className="p-2 text-zinc-700 dark:text-zinc-300 font-semibold text-center truncate max-w-[110px]"
                    title={v}
                  >
                    <div className="truncate">{v}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedVariables.map((rowVar, i) => (
                <tr key={`row-${rowVar}`}>
                  <td className="p-2 text-zinc-800 dark:text-zinc-200 font-semibold truncate sticky left-0 bg-white dark:bg-zinc-900 z-10 max-w-[130px] border-r border-zinc-200 dark:border-zinc-800">
                    <span title={rowVar}>{rowVar}</span>
                  </td>
                  {orderedVariables.map((colVar, j) => {
                    const cell = currentMatrix[i]?.[j];
                    if (!cell) return <td key={`cell-${i}-${j}`}></td>;

                    // Filter triangles if requested
                    if (displayMode === 'lower' && j > i) {
                      return (
                        <td
                          key={`empty-${i}-${j}`}
                          className="p-2 bg-zinc-100/30 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-800"
                        ></td>
                      );
                    }
                    if (displayMode === 'upper' && j < i) {
                      return (
                        <td
                          key={`empty-${i}-${j}`}
                          className="p-2 bg-zinc-100/30 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-800"
                        ></td>
                      );
                    }

                    const isDiagonal = i === j;
                    const { bg, text } = isDiagonal
                      ? { bg: isDark ? '#27272a' : '#f4f4f5', text: isDark ? '#a1a1aa' : '#71717a' }
                      : getCorrelationColor(cell.r, activeColorTheme);

                    const stars = getSigStars(cell.pValue);

                    return (
                      <td
                        key={`cell-${i}-${j}`}
                        onClick={() => {
                          if (rowVar !== colVar) {
                            onSelectPair(colVar, rowVar);
                          }
                        }}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{ backgroundColor: bg, color: text }}
                        className={`p-2.5 text-center transition-transform duration-100 border border-zinc-200 dark:border-zinc-800 font-semibold cursor-pointer relative group min-w-[70px] ${
                          isDiagonal ? 'cursor-default' : 'hover:scale-105 hover:z-20 hover:shadow-lg'
                        }`}
                        title={`${colVar} vs ${rowVar}: r = ${cell.r.toFixed(3)}`}
                      >
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="font-bold text-[12px]">{formatNumber(cell.r, 2)}</span>
                          {stars && !isDiagonal && (
                            <span className="text-[10px] -mt-0.5 opacity-90">{stars}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Color Scale Legend */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">相關係數色階：</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-blue-600 dark:text-blue-400 font-bold">-1.0 (強烈負相關)</span>
              <div
                className="w-36 h-3 rounded-full border border-zinc-300 dark:border-zinc-700"
                style={{
                  background:
                    activeColorTheme === 'coolwarm'
                      ? 'linear-gradient(to right, rgb(37,99,235), rgb(255,255,255), rgb(225,29,72))'
                      : activeColorTheme === 'emerald'
                      ? 'linear-gradient(to right, rgb(147,51,234), rgb(255,255,255), rgb(16,185,129))'
                      : activeColorTheme === 'sunset'
                      ? 'linear-gradient(to right, rgb(67,56,202), rgb(255,255,255), rgb(234,88,12))'
                      : 'linear-gradient(to right, rgb(68,1,84), rgb(33,145,140), rgb(253,231,37))',
                }}
              ></div>
              <span className="text-rose-600 dark:text-rose-400 font-bold">+1.0 (強烈正相關)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
            <span>顯著性標記：</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-mono">* p &lt; 0.05</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-mono">** p &lt; 0.01</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-mono">*** p &lt; 0.001</span>
          </div>
        </div>
      </div>

      {/* Selected Hover Detail Card */}
      {hoveredCell && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">聚焦分析格：</span>
            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">
              {hoveredCell.xVar} × {hoveredCell.yVar}
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">相關係數 r:</span>{' '}
              <strong className="text-blue-600 dark:text-blue-400 text-sm">
                {formatNumber(hoveredCell.r, 4)}
              </strong>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">判定係數 R²:</span>{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {formatNumber(hoveredCell.rSquared, 4)}
              </strong>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">顯著性 p-value:</span>{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{formatPValue(hoveredCell.pValue)}</strong>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">樣本數 n:</span>{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{hoveredCell.n}</strong>
            </div>
          </div>

          {hoveredCell.xVar !== hoveredCell.yVar && (
            <button
              onClick={() => onSelectPair(hoveredCell.xVar, hoveredCell.yVar)}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs ml-auto transition-colors"
            >
              <span>繪製散佈圖</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

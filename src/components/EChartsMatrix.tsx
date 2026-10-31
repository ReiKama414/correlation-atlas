import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { Download, ExternalLink } from 'lucide-react';
import {
  computeCorrelationMatrix,
  seriateVariables,
} from '../utils/statistics';
import type { MatrixCell } from '../utils/statistics';
import { formatNumber, formatPValue } from '../utils/colors';
import { exportToCSV } from '../utils/csvParser';
import type {
  CorrelationMethod,
  DeletionMethod,
  MatrixDisplayMode,
  MatrixOrder,
} from '../types';

interface EChartsMatrixProps {
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

export const EChartsMatrix: React.FC<EChartsMatrixProps> = ({
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
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const [displayMode, setDisplayMode] = useState<MatrixDisplayMode>('full');
  const [orderMode, setOrderMode] = useState<MatrixOrder>('original');
  const [hoveredCell, setHoveredCell] = useState<MatrixCell | null>(null);

  // Compute Base Matrix
  const baseResult = useMemo(() => {
    return computeCorrelationMatrix(data, selectedVariables, correlationMethod, deletionMethod);
  }, [data, selectedVariables, correlationMethod, deletionMethod]);

  // Order Variables
  const orderedVariables = useMemo(() => {
    if (orderMode === 'alphabetical') {
      return [...selectedVariables].sort();
    }
    if (orderMode === 'seriated' && baseResult.matrix.length > 2) {
      return seriateVariables(baseResult.matrix, selectedVariables);
    }
    return selectedVariables;
  }, [selectedVariables, orderMode, baseResult.matrix]);

  // Matrix values
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

  // Convert matrix data into ECharts format { value: [xIdx, yIdx, r], cell }
  const heatmapData = useMemo(() => {
    const list: { value: [number, number, number]; cell: MatrixCell }[] = [];
    const n = orderedVariables.length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // Triangular filters
        if (displayMode === 'lower' && j > i) continue;
        if (displayMode === 'upper' && j < i) continue;

        const cell = currentMatrix[i][j];
        if (cell) {
          list.push({ value: [j, i, Number(cell.r.toFixed(3))], cell });
        }
      }
    }
    return list;
  }, [orderedVariables, currentMatrix, displayMode]);

  // Theme color stops
  const themeColors = useMemo(() => {
    switch (activeColorTheme) {
      case 'coolwarm':
        return ['#2563eb', '#ffffff', '#e11d48'];
      case 'emerald':
        return ['#9333ea', '#ffffff', '#10b981'];
      case 'sunset':
        return ['#4338ca', '#ffffff', '#ea580c'];
      case 'viridis':
        return ['#440154', '#21918c', '#fde725'];
    }
  }, [activeColorTheme]);

  // Recreate chart instance when isDark changes
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }
  }, [isDark]);

  // Initialize and update ECharts
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
        renderer: 'canvas',
      });

      // Bind click
      chartInstance.current.on('click', (params) => {
        const item = params.data as { value: [number, number, number]; cell: MatrixCell };
        const cell = item?.cell;
        if (cell && cell.xVar !== cell.yVar) {
          onSelectPair(cell.xVar, cell.yVar);
        }
      });

      // Bind hover
      chartInstance.current.on('mouseover', (params) => {
        const item = params.data as { value: [number, number, number]; cell: MatrixCell };
        const cell = item?.cell;
        if (cell) {
          setHoveredCell(cell);
        }
      });
    }

    const chart = chartInstance.current;

    const option: echarts.EChartsOption = {
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      tooltip: {
        position: 'top',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#334155' : '#cbd5e1',
        borderWidth: 1,
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 11 },
        formatter: (params: unknown) => {
          const item = params as { data: { value: [number, number, number]; cell: MatrixCell } };
          const cell = item.data?.cell;
          if (!cell) return '';
          return `
            <div style="font-family: monospace; line-height: 1.5;">
              <strong style="color: ${isDark ? '#ffffff' : '#0f172a'};">${cell.xVar} × ${cell.yVar}</strong><br/>
              相關係數 r: <span style="color: #6366f1; font-weight: bold;">${cell.r.toFixed(4)}</span><br/>
              判定係數 R²: ${cell.rSquared.toFixed(4)}<br/>
              p-value: ${formatPValue(cell.pValue)}<br/>
              有效樣本 n: ${cell.n}<br/>
              95% CI: [${cell.ci95[0].toFixed(3)}, ${cell.ci95[1].toFixed(3)}]
            </div>
          `;
        },
      },
      grid: {
        left: 20,
        right: 80,
        top: 25,
        bottom: 30,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: orderedVariables,
        splitArea: { show: true },
        axisLabel: {
          interval: 0,
          rotate: 35,
          color: isDark ? '#a1a1aa' : '#71717a',
          fontFamily: 'monospace',
          fontSize: 10,
        },
        axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#e4e4e7' } },
      },
      yAxis: {
        type: 'category',
        data: orderedVariables,
        splitArea: { show: true },
        axisLabel: {
          interval: 0,
          color: isDark ? '#a1a1aa' : '#71717a',
          fontFamily: 'monospace',
          fontSize: 10,
        },
        axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#e4e4e7' } },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: 'vertical',
        right: 15,
        top: 'center',
        inRange: {
          color: themeColors,
        },
        textStyle: {
          color: isDark ? '#a1a1aa' : '#71717a',
          fontSize: 10,
          fontFamily: 'monospace',
        },
      },
      toolbox: {
        right: 15,
        bottom: 10,
        itemSize: 12,
        feature: {
          saveAsImage: {
            title: '下載矩陣圖片',
            pixelRatio: 2,
            backgroundColor: isDark ? '#09090b' : '#ffffff',
          },
        },
        iconStyle: { borderColor: isDark ? '#71717a' : '#a1a1aa' },
      },
      series: [
        {
          name: '相關係數',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: orderedVariables.length <= 15,
            formatter: (params: unknown) => {
              const item = params as { data: { value: [number, number, number]; cell: MatrixCell } };
              const cell = item.data?.cell;
              if (!cell) return '';
              const stars = getSigStars(cell.pValue);
              return `${cell.r.toFixed(2)}${stars ? '\n' + stars : ''}`;
            },
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#0f172a',
            fontWeight: 'bold',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          },
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [
    orderedVariables,
    heatmapData,
    themeColors,
    onSelectPair,
    isDark,
  ]);

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

  const handleDownloadPNG = () => {
    if (!chartInstance.current) return;
    const url = chartInstance.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: isDark ? '#09090b' : '#ffffff',
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `Correlation_Matrix_${correlationMethod}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-3 min-w-0 max-w-full" data-testid="matrix-container">
      {/* Controls Bar */}
      <div
        data-testid="matrix-header"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs"
      >
        <div className="min-w-0 flex-1 basis-full lg:basis-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 data-testid="matrix-title" className="font-bold text-zinc-900 dark:text-zinc-100 text-sm min-w-0">
              ECharts 相關係數矩陣熱圖 ({correlationMethod === 'spearman' ? 'Spearman ρ' : 'Pearson r'})
            </h2>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {orderedVariables.length} × {orderedVariables.length} 維度
            </span>
          </div>
          <p data-testid="matrix-description" className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            點擊任一熱圖方格可立即指定為 X/Y 軸切換至散佈圖分析視圖
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Method */}
          <select
            value={correlationMethod}
            onChange={(e) => onChangeCorrelationMethod(e.target.value as CorrelationMethod)}
            aria-label="選擇相關係數類型"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="pearson">Pearson (r)</option>
            <option value="spearman">Spearman (ρ)</option>
          </select>

          {/* Deletion */}
          <select
            value={deletionMethod}
            onChange={(e) => onChangeDeletionMethod(e.target.value as DeletionMethod)}
            aria-label="選擇缺失值刪除機制"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="pairwise">成對刪除 (Pairwise)</option>
            <option value="listwise">整列刪除 (Listwise)</option>
          </select>

          {/* Display Mode */}
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as MatrixDisplayMode)}
            aria-label="選擇矩陣顯示模式"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="full">全對稱矩陣</option>
            <option value="lower">下三角 (Lower)</option>
            <option value="upper">上三角 (Upper)</option>
          </select>

          {/* Ordering Mode */}
          <select
            value={orderMode}
            onChange={(e) => setOrderMode(e.target.value as MatrixOrder)}
            aria-label="選擇矩陣排序規則"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="original">原始順序</option>
            <option value="seriated">分群關聯排序</option>
            <option value="alphabetical">字母排序 (A-Z)</option>
          </select>

          {/* Theme Palette */}
          <select
            value={activeColorTheme}
            onChange={(e) =>
              onChangeColorTheme(e.target.value as 'coolwarm' | 'emerald' | 'viridis' | 'sunset')
            }
            aria-label="選擇色階調色盤"
            className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="coolwarm">藍白紅 (Cool-Warm)</option>
            <option value="emerald">紫白綠 (Emerald)</option>
            <option value="sunset">靛白橙 (Sunset)</option>
            <option value="viridis">翠綠 (Viridis)</option>
          </select>

          {/* Downloads */}
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
            title="下載 PNG"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>PNG</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
            title="下載 CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Main ECharts Heatmap Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 sm:p-3 overflow-hidden shadow-xs">
        <div ref={chartRef} className="w-full h-[480px]" />
      </div>

      {/* Hovered Cell Detail Card */}
      {hoveredCell && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">目前選取變數對：</span>
            <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
              {hoveredCell.xVar} × {hoveredCell.yVar}
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">r:</span>{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-bold">{formatNumber(hoveredCell.r, 4)}</strong>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">R²:</span>{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{formatNumber(hoveredCell.rSquared, 4)}</strong>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">p:</span>{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{formatPValue(hoveredCell.pValue)}</strong>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">n:</span>{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{hoveredCell.n}</strong>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">95% CI:</span>{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                [{formatNumber(hoveredCell.ci95[0], 3)}, {formatNumber(hoveredCell.ci95[1], 3)}]
              </strong>
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

import React from 'react';
import { ShieldCheck, Filter, Cpu } from 'lucide-react';

interface StatusBarProps {
  totalRows: number;
  validRows: number;
  missingRows: number;
  variableCount: number;
  chartEngine: 'echarts' | 'svg';
  onChangeChartEngine: (engine: 'echarts' | 'svg') => void;
  activeFilterCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  totalRows,
  validRows,
  missingRows,
  variableCount,
  chartEngine,
  onChangeChartEngine,
  activeFilterCount,
}) => {
  const isFiltered = validRows !== totalRows;

  return (
    <footer className="bg-zinc-900 dark:bg-black text-zinc-400 border-t border-zinc-800 text-[11px] py-2 px-3 sm:px-4 sticky bottom-0 z-30 select-none transition-colors">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Left Stats: Records and Variables */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <span className="text-zinc-400">總列數:</span>
            <span className="font-mono font-semibold text-zinc-100">{totalRows}</span>
            {isFiltered && (
              <span className="text-amber-400 font-mono text-[10px] sm:text-xs">
                (已篩選: {validRows})
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <span className="text-zinc-400">分析變數:</span>
            <span className="font-mono text-zinc-300 font-semibold">{variableCount}</span>
            <span className="text-[10px] text-zinc-500">個欄位</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <span className="text-zinc-400">缺失值:</span>
            <span className={`font-mono font-medium ${missingRows > 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
              {missingRows} 筆
            </span>
          </div>

          {/* Engine Selector */}
          <div className="hidden lg:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            <span>繪圖引擎:</span>
            <button
              onClick={() => onChangeChartEngine(chartEngine === 'echarts' ? 'svg' : 'echarts')}
              className="text-zinc-300 hover:text-white font-mono bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-700 transition-colors cursor-pointer text-[10px]"
              title="點擊切換圖表渲染引擎"
            >
              {chartEngine === 'echarts' ? 'ECharts 畫布' : 'SVG 向量'}
            </button>
          </div>
        </div>

        {/* Right Status: Privacy and Filter Active Status */}
        <div className="flex items-center gap-3 shrink-0">
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1 text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>{activeFilterCount} 個篩選作用中</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-medium text-[10px] sm:text-[11px] hidden sm:inline">
              本地 Sandbox 零傳輸
            </span>
            <span className="font-mono font-medium text-[10px] sm:hidden">
              本地沙盒
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
} from 'lucide-react';
import type { SimpsonsParadoxResult } from '../utils/statistics';

interface CausationBannerProps {
  totalRows: number;
  validRows: number;
  missingRows: number;
  outliersExcludedCount: number;
  simpsonsParadox: SimpsonsParadoxResult | null;
  onOpenGuide: () => void;
}

export const CausationBanner: React.FC<CausationBannerProps> = ({
  totalRows,
  validRows,
  missingRows,
  outliersExcludedCount,
  simpsonsParadox,
  onOpenGuide,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const missingRate = totalRows > 0 ? ((missingRows / totalRows) * 100).toFixed(1) : '0';

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
        {/* Simpson's Paradox Alert Banner */}
        {simpsonsParadox?.isDetected && (
          <div className="mb-2 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-lg p-2.5 sm:p-3 text-rose-900 dark:text-rose-200 shadow-xs flex items-start gap-2.5">
            <div className="p-1.5 bg-rose-200/80 dark:bg-rose-900/60 rounded text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                  ⚠️ 偵測到辛普森悖論 (Simpson's Paradox)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 font-semibold">
                  方向逆轉
                </span>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                {simpsonsParadox.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-mono">
                  整體: <strong className={simpsonsParadox.overallR > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}>
                    r = {simpsonsParadox.overallR.toFixed(3)}
                  </strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">分組內部:</span>
                {simpsonsParadox.groupResults.slice(0, 3).map((g) => (
                  <span
                    key={g.group}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {g.group}: r={g.r.toFixed(2)}
                  </span>
                ))}
                <button
                  onClick={onOpenGuide}
                  className="ml-auto inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-300 hover:underline font-medium cursor-pointer text-[11px]"
                >
                  深入瞭解 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Strip & Causation Alert */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Sample count & missing values badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
              <span>總樣本數:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{totalRows}</strong>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
              <span>有效分析樣本:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{validRows}</strong>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
              <span>缺失值:</span>
              <strong className={missingRows > 0 ? 'text-amber-600 dark:text-amber-400 font-mono' : 'text-slate-600 dark:text-slate-300 font-mono'}>
                {missingRows} 筆 ({missingRate}%)
              </strong>
            </div>

            {outliersExcludedCount > 0 && (
              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px]">
                <span>已排除離群:</span>
                <strong className="font-mono">{outliersExcludedCount} 筆</strong>
              </div>
            )}
          </div>

          {/* Central Scientific Reminder & Accordion Toggle */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-medium text-[11px]">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              <span>「相關不代表因果 (Correlation ≠ Causation)」</span>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="展開因果分析重點提醒"
              aria-label="展開因果說明"
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable causality drawer */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-white dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <div className="font-semibold text-indigo-700 dark:text-indigo-400">1. 干擾因子 (Confounders)</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                兩變數高度相關常因同受第三個隱藏變數（如氣溫、年齡、GDP）驅動。
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-indigo-700 dark:text-indigo-400">2. 逆向因果 (Reverse Causality)</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                相關係數對稱，無法判別是 X 影響 Y 還是 Y 影響 X。
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-indigo-700 dark:text-indigo-400">3. 選擇偏差 (Selection Bias)</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                特定條件樣本納入可能人為造成偽相關（伯克森悖論）。
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-indigo-700 dark:text-indigo-400">4. 偽相關 (Spurious)</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                小樣本隨機機率波動可能產生虛假的極低 p 值。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

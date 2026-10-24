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
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Simpson's Paradox Alert (when detected) */}
        {simpsonsParadox?.isDetected && (
          <div className="mb-2 bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-amber-950/70 border border-rose-500/50 rounded-xl p-3 text-rose-200 shadow-md flex items-start gap-3 animate-pulse">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-300 shrink-0">
              <Flame className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-300 uppercase tracking-wide">
                  ⚠️ 偵測到辛普森悖論 (Simpson's Paradox Detected)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/30 text-rose-200 border border-rose-400/30 font-semibold">
                  統計方向逆轉
                </span>
              </div>
              <p className="mt-1 text-slate-200 leading-relaxed">
                {simpsonsParadox.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-black/30 px-2 py-1 rounded text-slate-300">
                  整體相關係數：<strong className={simpsonsParadox.overallR > 0 ? 'text-rose-300' : 'text-blue-300'}>
                    r = {simpsonsParadox.overallR.toFixed(3)}
                  </strong>
                </span>
                <span className="text-slate-400">分組內部：</span>
                {simpsonsParadox.groupResults.map((g) => (
                  <span
                    key={g.group}
                    className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                      g.direction !== simpsonsParadox.overallDirection
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                        : 'bg-black/30 text-slate-300'
                    }`}
                  >
                    {g.group}: r = {g.r.toFixed(3)} ({g.n}筆)
                  </span>
                ))}
                <button
                  onClick={onOpenGuide}
                  className="ml-auto flex items-center gap-1 text-rose-300 hover:text-white underline font-medium cursor-pointer"
                >
                  深入瞭解辛普森悖論 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Status & Causation Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Sample count & missing values badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700/80">
              <span className="text-slate-400">總樣本數:</span>
              <strong className="text-white font-mono">{totalRows}</strong>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700/80">
              <span className="text-slate-400">有效分析樣本:</span>
              <strong className="text-emerald-400 font-mono">{validRows}</strong>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700/80">
              <span className="text-slate-400">缺失值:</span>
              <strong className={missingRows > 0 ? 'text-amber-400 font-mono' : 'text-slate-300 font-mono'}>
                {missingRows} 筆 ({missingRate}%)
              </strong>
            </div>

            {outliersExcludedCount > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-800/50 text-rose-300">
                <span>剔除離群值:</span>
                <strong className="font-mono text-rose-200">{outliersExcludedCount} 筆</strong>
              </div>
            )}
          </div>

          {/* Central Scientific Reminder */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-md font-medium text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>「相關不代表因果 (Correlation ≠ Causation)」</span>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="展開因果分析重點提醒"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable causality guidance drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-800/40 p-3 rounded-lg">
            <div className="space-y-1">
              <div className="font-semibold text-indigo-300 flex items-center gap-1">
                <span>1. 干擾變數 (Confounders)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                兩變數高度相關可能僅因同受第三個隱藏變數（如氣溫、年齡、GDP）驅動。
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-indigo-300 flex items-center gap-1">
                <span>2. 逆向因果 (Reverse Causality)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                到底是 X 導致 Y，還是 Y 導致 X？或是兩者互為反饋迴路？相關係數完全對稱無法辨認方向。
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-indigo-300 flex items-center gap-1">
                <span>3. 選擇性偏差 (Selection Bias)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                抽樣母體若未隨機抽樣（如僅統計特定族群或生還者），可能人為製造假性關聯。
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-indigo-300 flex items-center gap-1">
                <span>4. 偽相關 (Spurious Correlation)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                在多重檢驗或小樣本中，純機率隨機波動可能產生虛假的低 p 值（p-hacking 效應）。
              </p>
              <button
                onClick={onOpenGuide}
                className="mt-1 inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
              >
                閱讀完整知識庫手冊 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

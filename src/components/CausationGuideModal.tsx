import React from 'react';
import {
  BookOpen,
  X,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Search,
  CheckCircle,
} from 'lucide-react';

interface CausationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CausationGuideModal: React.FC<CausationGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="causation-guide-title"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-zinc-800 dark:text-zinc-200 min-w-0"
      >
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 id="causation-guide-title" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 min-w-0">
                「相關不代表因果 (Correlation ≠ Causation)」研究者手冊
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                統計數據背後的五大因果推論陷阱與實證防範原則
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="關閉因果手冊"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
          {/* Core Principle Alert */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5" />
              <span>為什麼「統計相關性 (Correlation)」無法證明因果？</span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              皮爾森相關係數 r 與斯皮爾曼等級相關係數 ρ 僅僅度量了兩個數值序列的<strong>「同步線性或單調共變程度 (Covariation)」</strong>。相關係數具有完全的數學對稱性（即 Corr(X, Y) = Corr(Y, X)），它既無法指示影響的時間順序，也無法排除潛在未觀測的第三者驅動變數。
            </p>
          </div>

          {/* 5 Key Pitfalls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pitfall 1: Confounder */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <GitBranch className="w-4 h-4 text-blue-500" />
                <span>1. 共同潛在干擾因子 (Confounding Variable)</span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                <strong>現象：</strong>變數 X 與變數 Y 高度正相關，但其實 X 對 Y 毫無影響，而是第三變數 Z 同時作用於 X 與 Y。
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-950/80 p-2.5 rounded text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-mono">
                💡 經典案例：冰淇淋銷量 (X) 與溺水死亡人數 (Y) 高度相關。真實原因：夏季高溫 (Z) 同時促使人們吃冰與戲水！
              </div>
            </div>

            {/* Pitfall 2: Reverse Causality */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <ArrowRight className="w-4 h-4 text-rose-500" />
                <span>2. 逆向因果關係 (Reverse Causality)</span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                <strong>現象：</strong>研究者假設「X 導致 Y」，但事實上是「Y 導致 X」，或者兩者存在動態反饋迴路。
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-950/80 p-2.5 rounded text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-mono">
                💡 案例：擁有高自尊心 (X) 的學生學業成績 (Y) 較佳。到底是自尊推高了成績，還是好成績建立了自尊？
              </div>
            </div>

            {/* Pitfall 3: Simpson's Paradox */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>3. 辛普森悖論 (Simpson's Paradox)</span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                <strong>現象：</strong>在合併的總體資料中呈現正相關，但在每個子群組內部卻全為負相關（或反之）。忽視分組結構會得出致命的相反結論。
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-950/80 p-2.5 rounded text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-mono">
                💡 本站範例：南蠻企鵝整體喙長與深度呈負相關，但 Adelie、Gentoo 與 Chinstrap 個別內部皆為正相關！
              </div>
            </div>

            {/* Pitfall 4: Selection & Berkson's Bias */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <Search className="w-4 h-4 text-cyan-500" />
                <span>4. 選擇性偏差與對撞因子 (Collider / Selection Bias)</span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                <strong>現象：</strong>當樣本的納入取決於兩個互不相關的特徵時，抽樣篩選本身會在樣本中硬生生製造出負相關（伯克森悖論 Berkson's bias）。
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-950/80 p-2.5 rounded text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-mono">
                💡 案例：好萊塢演員「長相英俊」與「演技卓越」在明星群體中呈現負相關，只因不帥又不會演戲的人根本進不了好萊塢！
              </div>
            </div>
          </div>

          {/* Practical Checklist */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>實證研究者的因果推論四步核對法</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-zinc-900 dark:text-zinc-100">時間先行性 (Temporal Precedence)</strong>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">原因 X 的發生是否必定嚴格早於結果 Y？</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-zinc-900 dark:text-zinc-100">機制合理性 (Plausible Mechanism)</strong>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">是否有已知物理、生理、心理或經濟傳導鏈支持 X 作用於 Y？</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-zinc-900 dark:text-zinc-100">控制關鍵共變量 (Control for Confounders)</strong>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">利用分組比較或多元回歸，檢視控制第三變數後相關是否依舊穩健？</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-zinc-900 dark:text-zinc-100">隨機對照試驗 (RCT / Quasi-Experiment)</strong>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">可能條件下透過 A/B 測試、斷點回歸 (RDD) 或工具變數法進行確證。</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            我瞭解了，回到研究分析
          </button>
        </div>
      </div>
    </div>
  );
};

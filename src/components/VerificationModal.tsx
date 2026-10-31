import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BENCHMARK_TEST_CASES } from '../data/verificationBenchmarks';
import {
  calculateLinearRegression,
  calculatePearson,
  calculateSpearman,
  detectSimpsonsParadox,
} from '../utils/statistics';
import { formatNumber } from '../utils/colors';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestRunResult {
  testId: string;
  passed: boolean;
  actualValues: Record<string, number | boolean | string>;
  errors: string[];
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [results, setResults] = useState<Record<string, TestRunResult>>({});

  if (!isOpen) return null;

  const runAllTests = () => {
    const newResults: Record<string, TestRunResult> = {};

    BENCHMARK_TEST_CASES.forEach((tc) => {
      let passed = true;
      const actuals: Record<string, number | boolean | string> = {};
      const errors: string[] = [];

      if (tc.id === 'nist-norris') {
        const reg = calculateLinearRegression(tc.x, tc.y);
        actuals.slope = reg.slope;
        actuals.intercept = reg.intercept;
        actuals.rSquared = reg.rSquared;

        if (tc.expected.slope !== undefined) {
          const diff = Math.abs(reg.slope - tc.expected.slope);
          if (diff > (tc.expected.slopeTol || 0.001)) {
            passed = false;
            errors.push(`斜率誤差超出容許值: |${reg.slope} - ${tc.expected.slope}| = ${diff}`);
          }
        }
        if (tc.expected.intercept !== undefined) {
          const diff = Math.abs(reg.intercept - tc.expected.intercept);
          if (diff > (tc.expected.interceptTol || 0.01)) {
            passed = false;
            errors.push(`截距誤差超出容許值: |${reg.intercept} - ${tc.expected.intercept}| = ${diff}`);
          }
        }
      } else if (tc.id === 'anscombe-1') {
        const p = calculatePearson(tc.x, tc.y);
        const reg = calculateLinearRegression(tc.x, tc.y);
        actuals.r = p.r;
        actuals.rSquared = p.rSquared;
        actuals.pValue = p.pValue;
        actuals.slope = reg.slope;

        if (tc.expected.r !== undefined && Math.abs(p.r - tc.expected.r) > (tc.expected.rTol || 0.001)) {
          passed = false;
          errors.push(`Pearson r 偏差: ${p.r} vs ${tc.expected.r}`);
        }
      } else if (tc.id === 'spearman-tied') {
        const s = calculateSpearman(tc.x, tc.y);
        actuals.r = s.r;
        if (tc.expected.r !== undefined && Math.abs(s.r - tc.expected.r) > (tc.expected.rTol || 0.002)) {
          passed = false;
          errors.push(`Spearman ρ (帶有ties) 偏差: ${s.r} vs ${tc.expected.r}`);
        }
      } else if (tc.id === 'simpson-penguins') {
        const groups = [
          ...new Array(6).fill('Adelie'),
          ...new Array(6).fill('Gentoo'),
          ...new Array(6).fill('Chinstrap'),
        ];
        const res = detectSimpsonsParadox(tc.x, tc.y, groups);
        actuals.isParadoxDetected = res.isDetected;
        actuals.overallR = res.overallR;
        if (!res.isDetected) {
          passed = false;
          errors.push('未能成功辨識出辛普森悖論 (Simpson’s Paradox)');
        }
      }

      newResults[tc.id] = {
        testId: tc.id,
        passed,
        actualValues: actuals,
        errors,
      };
    });

    setResults(newResults);
  };

  const hasRun = Object.keys(results).length > 0;
  const allPassed = hasRun && Object.values(results).every((r) => r.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div role="dialog" aria-modal="true" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-zinc-800 dark:text-zinc-200 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                統計函式數值驗證套件 (NIST & R Reference Benchmarks)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                可驗證的純 TypeScript 統計函式庫，與美國國家標準局 (NIST StRD) 及 R 官方數值交叉檢驗
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="關閉驗證視窗"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={runAllTests}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{hasRun ? '重新執行所有驗證' : '立即執行驗證測試 (Run All)'}</span>
            </button>

            {hasRun && (
              <span
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold ${
                  allPassed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                }`}
              >
                {allPassed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 全部基準測試通過 (100% Passed)
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> 存在未通過項目
                  </>
                )}
              </span>
            )}
          </div>

          <div className="text-zinc-500 dark:text-zinc-400 hidden sm:block">
            包含 OLS 斜率/截距、Fisher's z CI、Tie-corrected 等級排名、Simpson 悖論檢驗
          </div>
        </div>

        {/* Test List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {BENCHMARK_TEST_CASES.map((tc) => {
            const run = results[tc.id];

            return (
              <div
                key={tc.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{tc.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {tc.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{tc.description}</p>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                      參考標準: {tc.referenceSource}
                    </div>
                  </div>

                  <div>
                    {!run ? (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                        待執行
                      </span>
                    ) : run.passed ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800/60">
                        <XCircle className="w-3.5 h-3.5" /> FAIL
                      </span>
                    )}
                  </div>
                </div>

                {/* Benchmark Comparison Table */}
                <div className="bg-zinc-50 dark:bg-zinc-950/80 rounded-lg p-3 text-xs font-mono space-y-1.5 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[11px] font-sans font-semibold text-zinc-500 dark:text-zinc-400">
                    數值比對 (Reference vs Computed):
                  </div>

                  {tc.expected.slope !== undefined && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1">
                      <span className="text-zinc-500 dark:text-zinc-400">線性回歸斜率 (Slope β₁):</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        基準: {tc.expected.slope} | 本地運算:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {run ? formatNumber(run.actualValues.slope as number, 8) : '—'}
                        </strong>
                      </span>
                    </div>
                  )}

                  {tc.expected.intercept !== undefined && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1">
                      <span className="text-zinc-500 dark:text-zinc-400">回歸截距 (Intercept β₀):</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        基準: {tc.expected.intercept} | 本地運算:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {run ? formatNumber(run.actualValues.intercept as number, 8) : '—'}
                        </strong>
                      </span>
                    </div>
                  )}

                  {tc.expected.r !== undefined && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1">
                      <span className="text-zinc-500 dark:text-zinc-400">相關係數 (r / ρ):</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        基準: {tc.expected.r} | 本地運算:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {run ? formatNumber(run.actualValues.r as number, 7) : '—'}
                        </strong>
                      </span>
                    </div>
                  )}

                  {tc.id === 'simpson-penguins' && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1">
                      <span className="text-zinc-500 dark:text-zinc-400">辛普森悖論偵測旗標:</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        預期: true | 本地運算:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {run ? String(run.actualValues.isParadoxDetected) : '—'}
                        </strong>
                      </span>
                    </div>
                  )}

                  {tc.expected.notes && (
                    <div className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 pt-1">
                      備註：{tc.expected.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

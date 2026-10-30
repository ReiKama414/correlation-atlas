import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import {
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Flame,
  Download,
  RotateCcw,
} from 'lucide-react';
import {
  calculateLinearRegression,
  calculatePearson,
  calculateSpearman,
  detectOutliers,
  detectSimpsonsParadox,
  toCleanNumber,
} from '../utils/statistics';
import type {
  RegressionResult,
  CorrelationResult,
  OutlierResult,
  SimpsonsParadoxResult,
} from '../utils/statistics';
import { getGroupColor, formatNumber, formatPValue } from '../utils/colors';
import type { CorrelationMethod, OutlierMethod } from '../types';

interface EChartsScatterPlotProps {
  data: Record<string, unknown>[];
  xVar: string;
  yVar: string;
  groupVar: string | null;
  correlationMethod: CorrelationMethod;
  outlierMethod: OutlierMethod;
  excludeOutliers: boolean;
  showConfidenceBand: boolean;
  showPredictionBand: boolean;
  showResidualPlot: boolean;
  isDark?: boolean;
}

interface PointData {
  index: number;
  x: number;
  y: number;
  group: string;
  isOutlier: boolean;
  outlierScore: number;
  residual: number;
  raw: Record<string, unknown>;
}

export const EChartsScatterPlot: React.FC<EChartsScatterPlotProps> = ({
  data,
  xVar,
  yVar,
  groupVar,
  correlationMethod,
  outlierMethod,
  excludeOutliers,
  showConfidenceBand,
  showPredictionBand,
  showResidualPlot,
  isDark = true,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);

  // 1. Extract valid points
  const { allPoints, rawX, rawY } = useMemo(() => {
    const pts: PointData[] = [];
    const xs: number[] = [];
    const ys: number[] = [];

    data.forEach((row, idx) => {
      const xVal = toCleanNumber(row[xVar]);
      const yVal = toCleanNumber(row[yVar]);
      if (xVal !== null && yVal !== null) {
        const grp = groupVar ? String(row[groupVar] ?? '未分組') : '總體';
        xs.push(xVal);
        ys.push(yVal);
        pts.push({
          index: idx,
          x: xVal,
          y: yVal,
          group: grp,
          isOutlier: false,
          outlierScore: 0,
          residual: 0,
          raw: row,
        });
      }
    });

    return { allPoints: pts, rawX: xs, rawY: ys };
  }, [data, xVar, yVar, groupVar]);

  // 2. Detect Outliers
  const outlierResult: OutlierResult = useMemo(() => {
    return detectOutliers(rawX, rawY, outlierMethod);
  }, [rawX, rawY, outlierMethod]);

  // 3. Mark points with outlier flags & scores
  const pointsWithOutliers = useMemo(() => {
    return allPoints.map((pt, i) => {
      const isOut = outlierResult.flags[i] ?? false;
      const score = outlierResult.scores[i] ?? 0;
      return { ...pt, isOutlier: isOut, outlierScore: score };
    });
  }, [allPoints, outlierResult]);

  // 4. Effective points used for regression
  const effectivePoints = useMemo(() => {
    if (!excludeOutliers) return pointsWithOutliers;
    return pointsWithOutliers.filter((pt) => !pt.isOutlier);
  }, [pointsWithOutliers, excludeOutliers]);

  const effX = useMemo(() => effectivePoints.map((p) => p.x), [effectivePoints]);
  const effY = useMemo(() => effectivePoints.map((p) => p.y), [effectivePoints]);

  // 5. Statistical Calculations
  const regression: RegressionResult = useMemo(() => {
    return calculateLinearRegression(effX, effY);
  }, [effX, effY]);

  const pearson: CorrelationResult = useMemo(() => {
    return calculatePearson(effX, effY);
  }, [effX, effY]);

  const spearman: CorrelationResult = useMemo(() => {
    return calculateSpearman(effX, effY);
  }, [effX, effY]);

  const activeCorrelation = correlationMethod === 'spearman' ? spearman : pearson;

  // 6. Group Unique List & Color Map
  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    pointsWithOutliers.forEach((p) => set.add(p.group));
    return Array.from(set);
  }, [pointsWithOutliers]);

  const groupColorMap = useMemo(() => {
    const map = new Map<string, string>();
    uniqueGroups.forEach((grp, idx) => {
      map.set(grp, getGroupColor(idx));
    });
    return map;
  }, [uniqueGroups]);

  // 7. Simpson's Paradox Detection
  const simpsonsParadox: SimpsonsParadoxResult = useMemo(() => {
    if (!groupVar) {
      return {
        isDetected: false,
        overallR: pearson.r,
        overallDirection: 'neutral',
        groupResults: [],
        divergentGroupsCount: 0,
        description: '無分組',
      };
    }
    return detectSimpsonsParadox(effX, effY, effectivePoints.map((p) => p.group));
  }, [effX, effY, effectivePoints, groupVar, pearson.r]);

  // 8. Per-Group Regressions
  const groupRegressions = useMemo(() => {
    if (!groupVar || uniqueGroups.length <= 1) return [];
    return uniqueGroups.map((grp) => {
      const gPts = effectivePoints.filter((p) => p.group === grp);
      const gX = gPts.map((p) => p.x);
      const gY = gPts.map((p) => p.y);
      const reg = calculateLinearRegression(gX, gY);
      const corr = calculatePearson(gX, gY);
      return {
        group: grp,
        count: gPts.length,
        regression: reg,
        correlation: corr,
        color: groupColorMap.get(grp) || '#3b82f6',
      };
    });
  }, [groupVar, uniqueGroups, effectivePoints, groupColorMap]);

  // 9. Assign residuals to points
  const pointsWithResiduals = useMemo(() => {
    return pointsWithOutliers.map((pt) => {
      const pred = regression.predict(pt.x);
      return { ...pt, residual: pt.y - pred };
    });
  }, [pointsWithOutliers, regression]);

  // 10. Initialize and update ECharts
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    // Bounds
    const xMin = rawX.length > 0 ? Math.min(...rawX) : 0;
    const xMax = rawX.length > 0 ? Math.max(...rawX) : 10;
    const xSpan = xMax - xMin || 1;
    const xDomainMin = xMin - xSpan * 0.05;
    const xDomainMax = xMax + xSpan * 0.05;

    // Series construction
    const seriesList: echarts.SeriesOption[] = [];

    // Confidence Band Area
    if (!showResidualPlot && showConfidenceBand && regression.n >= 3) {
      const steps = 30;
      const step = (xDomainMax - xDomainMin) / steps;
      const lowerBandPts: [number, number][] = [];
      const upperBandPts: [number, number][] = [];

      for (let i = 0; i <= steps; i++) {
        const curX = xDomainMin + i * step;
        const ci = regression.confidenceBand(curX);
        lowerBandPts.push([curX, ci.lower]);
        upperBandPts.push([curX, ci.upper]);
      }

      seriesList.push({
        name: '95% CI 下限',
        type: 'line',
        data: lowerBandPts,
        lineStyle: { opacity: 0 },
        stack: 'confidence-band',
        symbol: 'none',
        silent: true,
      });

      const deltaBandPts = upperBandPts.map((p, i) => [p[0], p[1] - lowerBandPts[i][1]]);
      seriesList.push({
        name: '95% CI 範圍',
        type: 'line',
        data: deltaBandPts,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.12)',
        },
        stack: 'confidence-band',
        symbol: 'none',
        silent: true,
      });
    }

    // Prediction Band Lines
    if (!showResidualPlot && showPredictionBand && regression.n >= 3) {
      const steps = 20;
      const step = (xDomainMax - xDomainMin) / steps;
      const predUpper: [number, number][] = [];
      const predLower: [number, number][] = [];

      for (let i = 0; i <= steps; i++) {
        const curX = xDomainMin + i * step;
        const pb = regression.predictionBand(curX);
        predUpper.push([curX, pb.upper]);
        predLower.push([curX, pb.lower]);
      }

      seriesList.push({
        name: '95% 預測上限',
        type: 'line',
        data: predUpper,
        lineStyle: { type: 'dashed', color: '#818cf8', width: 1.5, opacity: 0.8 },
        symbol: 'none',
        silent: true,
      });

      seriesList.push({
        name: '95% 預測下限',
        type: 'line',
        data: predLower,
        lineStyle: { type: 'dashed', color: '#818cf8', width: 1.5, opacity: 0.8 },
        symbol: 'none',
        silent: true,
      });
    }

    // Overall OLS Regression Line
    if (!showResidualPlot && regression.n >= 2) {
      const regLineData = [
        [xDomainMin, regression.predict(xDomainMin)],
        [xDomainMax, regression.predict(xDomainMax)],
      ];

      seriesList.push({
        name: 'OLS 線性回歸線',
        type: 'line',
        data: regLineData,
        lineStyle: {
          color: '#6366f1',
          width: 2.5,
        },
        symbol: 'none',
        z: 4,
      });
    }

    // Per-Group Regression Lines
    if (!showResidualPlot && groupVar && groupRegressions.length > 0) {
      groupRegressions.forEach((gr) => {
        if (gr.count >= 3) {
          seriesList.push({
            name: `${gr.group} 回歸線`,
            type: 'line',
            data: [
              [xDomainMin, gr.regression.predict(xDomainMin)],
              [xDomainMax, gr.regression.predict(xDomainMax)],
            ],
            lineStyle: {
              color: gr.color,
              width: 2,
              type: 'dashed',
            },
            symbol: 'none',
            z: 3,
          });
        }
      });
    }

    // Scatter Series
    if (groupVar && uniqueGroups.length > 0) {
      uniqueGroups.forEach((grp) => {
        const grpColor = groupColorMap.get(grp) || '#3b82f6';
        const grpPoints = pointsWithResiduals.filter((p) => p.group === grp);

        seriesList.push({
          name: grp,
          type: 'scatter',
          data: grpPoints.map((p) => ({
            value: [p.x, showResidualPlot ? p.residual : p.y],
            itemData: p,
            itemStyle: {
              color: p.isOutlier ? (excludeOutliers ? '#7f1d1d' : '#ef4444') : grpColor,
              borderColor: p.isOutlier ? '#fca5a5' : '#ffffff',
              borderWidth: p.isOutlier ? 2 : 1,
              opacity: excludeOutliers && p.isOutlier ? 0.25 : 0.88,
            },
          })),
          symbolSize: (_rawVal: unknown, params: unknown) => {
            const p = (params as { data: { itemData: PointData } })?.data?.itemData;
            return p?.isOutlier ? 11 : 8;
          },
          z: 5,
        });
      });
    } else {
      seriesList.push({
        name: '觀測資料點',
        type: 'scatter',
        data: pointsWithResiduals.map((p) => ({
          value: [p.x, showResidualPlot ? p.residual : p.y],
          itemData: p,
          itemStyle: {
            color: p.isOutlier ? (excludeOutliers ? '#7f1d1d' : '#ef4444') : '#3b82f6',
            borderColor: p.isOutlier ? '#fca5a5' : '#ffffff',
            borderWidth: p.isOutlier ? 2 : 1,
            opacity: excludeOutliers && p.isOutlier ? 0.25 : 0.88,
          },
        })),
        symbolSize: (_rawVal: unknown, params: unknown) => {
          const p = (params as { data: { itemData: PointData } })?.data?.itemData;
          return p?.isOutlier ? 11 : 8;
        },
        z: 5,
      });
    }

    const option: echarts.EChartsOption = {
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      grid: {
        left: 20,
        right: 25,
        top: 25,
        bottom: 25,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#334155' : '#cbd5e1',
        borderWidth: 1,
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 11 },
        formatter: (params: unknown) => {
          const p = params as { data?: { itemData?: PointData; value?: [number, number] }; seriesName?: string };
          const item = p?.data?.itemData;
          if (!item) {
            return `<strong>${p?.seriesName || ''}</strong>`;
          }
          const predY = regression.predict(item.x);
          return `
            <div style="font-family: ui-monospace, monospace; line-height: 1.5; font-size: 11px;">
              <div style="font-weight: 600; color: ${isDark ? '#ffffff' : '#0f172a'}; border-bottom: 1px solid ${isDark ? '#334155' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 3px;">
                樣本 #${item.index + 1} ${item.group !== '總體' ? `(${item.group})` : ''}
              </div>
              <div>${xVar}: <span style="color: #6366f1; font-weight: bold;">${item.x}</span></div>
              <div>${yVar}: <span style="color: #6366f1; font-weight: bold;">${item.y}</span></div>
              <div>回歸預測 ŷ: ${formatNumber(predY, 2)}</div>
              <div>殘差 e: <span style="color: ${item.residual >= 0 ? '#10b981' : '#f43f5e'};">${formatNumber(item.residual, 2)}</span></div>
              ${
                item.isOutlier
                  ? `<div style="color: #ef4444; font-weight: bold; margin-top: 3px; border-top: 1px solid ${isDark ? '#7f1d1d' : '#fecdd3'}; padding-top: 2px;">
                      ⚠️ 離群值 (${outlierMethod.toUpperCase()} 分數: ${formatNumber(item.outlierScore, 2)})
                    </div>`
                  : ''
              }
            </div>
          `;
        },
      },
      toolbox: {
        right: 15,
        bottom: 5,
        itemSize: 12,
        feature: {
          saveAsImage: {
            title: '儲存圖表',
            pixelRatio: 2,
            backgroundColor: isDark ? '#090d16' : '#ffffff',
          },
          dataZoom: { title: { zoom: '區域縮放', back: '還原' } },
          restore: { title: '重置' },
        },
        iconStyle: {
          borderColor: isDark ? '#64748b' : '#94a3b8',
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'inside', yAxisIndex: 0 },
      ],
      xAxis: {
        name: xVar,
        nameLocation: 'center',
        nameGap: 30,
        nameTextStyle: { color: isDark ? '#cbd5e1' : '#334155', fontWeight: 600, fontSize: 11 },
        type: 'value',
        scale: true,
        axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace', fontSize: 10 },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9', type: 'dashed' } },
      },
      yAxis: {
        name: showResidualPlot ? `殘差 (y - ŷ) of ${yVar}` : yVar,
        nameLocation: 'center',
        nameGap: 40,
        nameTextStyle: { color: isDark ? '#cbd5e1' : '#334155', fontWeight: 600, fontSize: 11 },
        type: 'value',
        scale: true,
        axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace', fontSize: 10 },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9', type: 'dashed' } },
      },
      series: seriesList,
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
    effX,
    effY,
    rawX,
    rawY,
    xVar,
    yVar,
    groupVar,
    regression,
    uniqueGroups,
    groupColorMap,
    pointsWithResiduals,
    groupRegressions,
    showConfidenceBand,
    showPredictionBand,
    showResidualPlot,
    excludeOutliers,
    outlierMethod,
    isDark,
  ]);

  const handleDownloadPNG = () => {
    if (!chartInstance.current) return;
    const url = chartInstance.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scatter_${xVar}_vs_${yVar}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetZoom = () => {
    if (chartInstance.current) {
      chartInstance.current.dispatchAction({
        type: 'restore',
      });
    }
  };

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      {/* 1. Chart Top Header & Description */}
      <div
        data-testid="chart-header"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              data-testid="chart-title"
              className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight"
            >
              {showResidualPlot ? '殘差分佈診斷圖 (Residual Plot)' : 'ECharts 雙變數散佈圖與線性回歸'}
            </h2>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 shrink-0">
              {xVar} ➔ {yVar}
            </span>
          </div>
          {/* 2. Description */}
          <p
            data-testid="chart-description"
            className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed"
          >
            {showResidualPlot
              ? '診斷回歸等分散性 (Homoscedasticity) 與模型線性假設殘差分佈 (y - ŷ)'
              : '普通最小平方法 (OLS) 線性回歸擬合、判定係數 R² 與離群值影響度'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
            title="還原縮放視野"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>重設縮放</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
            title="下載高解析度圖表 PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載 PNG</span>
          </button>
        </div>
      </div>

      {/* 3. Statistical Indicator Strip (Placed BEFORE Chart as per Layout Integrity Rules) */}
      <div
        data-testid="chart-statistics"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs"
      >
        {/* Metric 1: Correlation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-xs transition-colors">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
            <span>{correlationMethod === 'spearman' ? 'Spearman (ρ)' : 'Pearson (r)'}</span>
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatNumber(activeCorrelation.r, 3)}
          </div>
          <div className="text-[10px] text-slate-500">
            {Math.abs(activeCorrelation.r) > 0.7 ? '強關聯' : Math.abs(activeCorrelation.r) > 0.3 ? '中等關聯' : '弱關聯'}
          </div>
        </div>

        {/* Metric 2: R-Squared */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-xs transition-colors">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
            <span>判定係數 (R²)</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-indigo-600 dark:text-indigo-300">
            {formatNumber(regression.rSquared, 3)}
          </div>
          <div className="text-[10px] text-slate-500">
            解釋變異 {(regression.rSquared * 100).toFixed(1)}%
          </div>
        </div>

        {/* Metric 3: P-Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-xs transition-colors">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
            <span>顯著性 p-value</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatPValue(activeCorrelation.pValue)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            t = {formatNumber(activeCorrelation.tStat, 2)} (df={activeCorrelation.df})
          </div>
        </div>

        {/* Metric 4: Regression Equation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 col-span-2 sm:col-span-1 lg:col-span-2 shadow-xs transition-colors">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            回歸方程式 (OLS Equation)
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
            Y = {formatNumber(regression.slope, 3)} · X {regression.intercept >= 0 ? '+' : '-'} {formatNumber(Math.abs(regression.intercept), 3)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            斜率誤 SE(β) = {formatNumber(regression.seSlope, 3)}
          </div>
        </div>

        {/* Metric 5: 95% CI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-xs transition-colors">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">95% 信賴區間</div>
          <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
            [{formatNumber(activeCorrelation.ci95[0], 2)}, {formatNumber(activeCorrelation.ci95[1], 2)}]
          </div>
          <div className="text-[10px] text-slate-500">Fisher's z 轉換</div>
        </div>
      </div>

      {/* 4. Main ECharts Container (Clean Canvas Drawing Area) */}
      <div
        data-testid="chart-drawing-area"
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-3 overflow-hidden shadow-xs transition-colors"
      >
        <div ref={chartRef} className="w-full h-[380px] sm:h-[450px]" />
      </div>

      {/* 5. Dedicated Legend & Footer (In Normal Document Flow, Zero Overlap With Data Points) */}
      <div
        data-testid="chart-legend-footer"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs shrink-0">圖例說明：</span>

          {/* Regression Line Legend */}
          {!showResidualPlot && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-4 h-1 bg-indigo-500 rounded-full shrink-0"></span>
              <span>總體線性回歸 (OLS)</span>
            </div>
          )}

          {/* Confidence Band Legend */}
          {showConfidenceBand && !showResidualPlot && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-3.5 h-2.5 bg-indigo-500/20 border border-indigo-400 rounded-xs shrink-0"></span>
              <span>95% 信賴帶</span>
            </div>
          )}

          {/* Prediction Band Legend */}
          {showPredictionBand && !showResidualPlot && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-4 h-0 border-t border-dashed border-indigo-400 shrink-0"></span>
              <span>95% 預測帶</span>
            </div>
          )}

          {/* Group Legends */}
          {groupVar &&
            uniqueGroups.map((grp) => (
              <div key={`legend-${grp}`} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: groupColorMap.get(grp) || '#3b82f6' }}
                ></span>
                <span className="truncate max-w-[120px]">{grp}</span>
              </div>
            ))}

          {/* Outliers Legend */}
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full border border-rose-500 bg-rose-500/20 shrink-0"></span>
            <span>
              {outlierResult.indices.size} 筆離群值 ({outlierMethod.toUpperCase()}) {excludeOutliers ? '(已剔除)' : ''}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
          有效樣本 n = {effX.length} {rawX.length !== effX.length ? `(原始 ${rawX.length})` : ''}
        </div>
      </div>

      {/* 6. Group Comparison Table */}
      {groupVar && groupRegressions.length > 0 && (
        <div
          data-testid="chart-group-table"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-xs shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>分組統計比較 ({groupVar})</span>
            </div>
            {simpsonsParadox.isDetected && (
              <span className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold">
                <Flame className="w-3 h-3 text-rose-500" /> 辛普森悖論 (Simpson's Paradox)
              </span>
            )}
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-left font-mono min-w-[620px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg whitespace-nowrap">分組 (Group)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">樣本數 (n)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">相關係數 (r)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">判定係數 (R²)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">斜率 (β₁)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">截距 (β₀)</th>
                  <th className="py-2.5 px-3 rounded-r-lg whitespace-nowrap">p-value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {groupRegressions.map((gr) => (
                  <tr key={`gr-row-${gr.group}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-sans font-medium flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: gr.color }} />
                      <span className="text-slate-900 dark:text-white truncate max-w-[140px]">{gr.group}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{gr.count}</td>
                    <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-300 whitespace-nowrap">
                      {formatNumber(gr.correlation.r, 3)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatNumber(gr.regression.rSquared, 3)}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatNumber(gr.regression.slope, 3)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatNumber(gr.regression.intercept, 3)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatPValue(gr.correlation.pValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

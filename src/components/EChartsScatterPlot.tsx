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
      chartInstance.current = echarts.init(chartRef.current, 'dark', {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    // Determine domain bounds
    const xMin = rawX.length > 0 ? Math.min(...rawX) : 0;
    const xMax = rawX.length > 0 ? Math.max(...rawX) : 10;
    const xSpan = xMax - xMin || 1;
    const xDomainMin = xMin - xSpan * 0.05;
    const xDomainMax = xMax + xSpan * 0.05;

    // Series construction
    const seriesList: echarts.SeriesOption[] = [];

    // Confidence Band Area (if enabled and not in residual mode)
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

      // Base lower line
      seriesList.push({
        name: '95% CI 下限',
        type: 'line',
        data: lowerBandPts,
        lineStyle: { opacity: 0 },
        stack: 'confidence-band',
        symbol: 'none',
        silent: true,
      });

      // Delta upper line filling area between
      const deltaBandPts = upperBandPts.map((p, i) => [p[0], p[1] - lowerBandPts[i][1]]);
      seriesList.push({
        name: '95% CI 範圍',
        type: 'line',
        data: deltaBandPts,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: 'rgba(99, 102, 241, 0.15)',
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
        lineStyle: { type: 'dashed', color: '#818cf8', width: 1.5, opacity: 0.7 },
        symbol: 'none',
        silent: true,
      });

      seriesList.push({
        name: '95% 預測下限',
        type: 'line',
        data: predLower,
        lineStyle: { type: 'dashed', color: '#818cf8', width: 1.5, opacity: 0.7 },
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

    // Scatter Series grouped by Category or Single
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
              opacity: excludeOutliers && p.isOutlier ? 0.25 : 0.85,
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
            color: p.isOutlier ? (excludeOutliers ? '#7f1d1d' : '#ef4444') : '#38bdf8',
            borderColor: p.isOutlier ? '#fca5a5' : '#ffffff',
            borderWidth: p.isOutlier ? 2 : 1,
            opacity: excludeOutliers && p.isOutlier ? 0.25 : 0.85,
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
      backgroundColor: '#090d16',
      grid: {
        left: 65,
        right: 40,
        top: 55,
        bottom: 65,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter: (params: unknown) => {
          const p = params as { data?: { itemData?: PointData; value?: [number, number] }; seriesName?: string };
          const item = p?.data?.itemData;
          if (!item) {
            return `<strong>${p?.seriesName || ''}</strong>`;
          }
          const predY = regression.predict(item.x);
          return `
            <div style="font-family: ui-monospace, monospace; line-height: 1.5; font-size: 11px;">
              <div style="font-weight: 600; color: #ffffff; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 4px;">
                樣本 #${item.index + 1} ${item.group !== '總體' ? `(${item.group})` : ''}
              </div>
              <div>${xVar}: <span style="color: #818cf8; font-weight: bold;">${item.x}</span></div>
              <div>${yVar}: <span style="color: #818cf8; font-weight: bold;">${item.y}</span></div>
              <div>回歸預測 ŷ: ${formatNumber(predY, 2)}</div>
              <div>殘差 e: <span style="color: ${item.residual >= 0 ? '#34d399' : '#f87171'};">${formatNumber(item.residual, 2)}</span></div>
              ${
                item.isOutlier
                  ? `<div style="color: #f87171; font-weight: bold; margin-top: 4px; border-top: 1px solid #7f1d1d; padding-top: 2px;">
                      ⚠️ 離群值 (${outlierMethod.toUpperCase()} 分數: ${formatNumber(item.outlierScore, 2)})
                    </div>`
                  : ''
              }
            </div>
          `;
        },
      },
      legend: {
        top: 12,
        right: 20,
        textStyle: { color: '#94a3b8', fontSize: 11 },
        icon: 'circle',
      },
      toolbox: {
        right: 20,
        bottom: 8,
        itemSize: 13,
        feature: {
          saveAsImage: {
            title: '儲存圖表',
            pixelRatio: 2,
            backgroundColor: '#090d16',
          },
          dataZoom: { title: { zoom: '區域縮放', back: '還原縮放' } },
          restore: { title: '重置' },
        },
        iconStyle: {
          borderColor: '#64748b',
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'inside', yAxisIndex: 0 },
      ],
      xAxis: {
        name: xVar,
        nameLocation: 'center',
        nameGap: 32,
        nameTextStyle: { color: '#cbd5e1', fontWeight: 600, fontSize: 12 },
        type: 'value',
        scale: true,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'monospace' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      },
      yAxis: {
        name: showResidualPlot ? `殘差 (y - ŷ) of ${yVar}` : yVar,
        nameLocation: 'center',
        nameGap: 45,
        nameTextStyle: { color: '#cbd5e1', fontWeight: 600, fontSize: 12 },
        type: 'value',
        scale: true,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'monospace' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
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
  ]);

  const handleDownloadPNG = () => {
    if (!chartInstance.current) return;
    const url = chartInstance.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#090d16',
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
    <div className="space-y-3">
      {/* Chart Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-100 text-sm">
              {showResidualPlot ? '殘差分佈診斷圖 (Residual Plot)' : 'ECharts 雙變數散佈圖與 OLS 線性回歸'}
            </h2>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">
              {xVar} ➔ {yVar}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            可滾動滾輪或框選區域即時縮放；點擊離群點查看庫克距離 (Cook's D) 與預測殘差
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-xs cursor-pointer transition-colors"
            title="還原縮放視野"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>重設縮放</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors shadow-sm"
            title="下載高解析度圖表 PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載 PNG</span>
          </button>
        </div>
      </div>

      {/* Main ECharts Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 overflow-hidden shadow-inner">
        <div ref={chartRef} className="w-full h-[460px]" />
      </div>

      {/* Statistical Indicator Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {/* Metric 1: Correlation */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-0.5">
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>{correlationMethod === 'spearman' ? 'Spearman (ρ)' : 'Pearson (r)'}</span>
            <Activity className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {formatNumber(activeCorrelation.r, 3)}
          </div>
          <div className="text-[9px] text-slate-500">
            {Math.abs(activeCorrelation.r) > 0.7 ? '強關聯' : Math.abs(activeCorrelation.r) > 0.3 ? '中等關聯' : '弱關聯'}
          </div>
        </div>

        {/* Metric 2: R-Squared */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-0.5">
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>判定係數 (R²)</span>
            <TrendingUp className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-lg font-bold font-mono text-indigo-300">
            {formatNumber(regression.rSquared, 3)}
          </div>
          <div className="text-[9px] text-slate-500">
            解釋變異 {(regression.rSquared * 100).toFixed(1)}%
          </div>
        </div>

        {/* Metric 3: P-Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-0.5">
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>顯著性 p-value</span>
            <Sparkles className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-xs font-bold font-mono text-white mt-1">
            {formatPValue(activeCorrelation.pValue)}
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            t = {formatNumber(activeCorrelation.tStat, 2)} (df={activeCorrelation.df})
          </div>
        </div>

        {/* Metric 4: Regression Equation */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-0.5 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="text-[10px] text-slate-400 font-medium">
            回歸方程式 (OLS Equation)
          </div>
          <div className="text-xs font-bold font-mono text-emerald-400 truncate">
            Y = {formatNumber(regression.slope, 3)} · X {regression.intercept >= 0 ? '+' : '-'} {formatNumber(Math.abs(regression.intercept), 3)}
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            斜率誤 SE(β) = {formatNumber(regression.seSlope, 3)}
          </div>
        </div>

        {/* Metric 5: 95% CI */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-0.5">
          <div className="text-[10px] text-slate-400 font-medium">95% 信賴區間</div>
          <div className="text-[11px] font-bold font-mono text-slate-200">
            [{formatNumber(activeCorrelation.ci95[0], 2)}, {formatNumber(activeCorrelation.ci95[1], 2)}]
          </div>
          <div className="text-[9px] text-slate-500">Fisher's z 轉換</div>
        </div>
      </div>

      {/* Group Comparison Table */}
      {groupVar && groupRegressions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>分組統計比較 ({groupVar})</span>
            </div>
            {simpsonsParadox.isDetected && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                <Flame className="w-3 h-3 text-rose-400" /> 辛普森悖論 (Simpson's Paradox)
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-1.5 px-2">分組 (Group)</th>
                  <th className="py-1.5 px-2">樣本數 (n)</th>
                  <th className="py-1.5 px-2">相關係數 (r)</th>
                  <th className="py-1.5 px-2">判定係數 (R²)</th>
                  <th className="py-1.5 px-2">斜率 (β₁)</th>
                  <th className="py-1.5 px-2">截距 (β₀)</th>
                  <th className="py-1.5 px-2">p-value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {groupRegressions.map((gr) => (
                  <tr key={`gr-row-${gr.group}`} className="hover:bg-slate-800/50">
                    <td className="py-1.5 px-2 font-sans font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: gr.color }} />
                      <span className="text-white">{gr.group}</span>
                    </td>
                    <td className="py-1.5 px-2 text-slate-300">{gr.count}</td>
                    <td className="py-1.5 px-2 font-bold text-indigo-300">
                      {formatNumber(gr.correlation.r, 3)}
                    </td>
                    <td className="py-1.5 px-2 text-slate-300">
                      {formatNumber(gr.regression.rSquared, 3)}
                    </td>
                    <td className="py-1.5 px-2 text-emerald-400">
                      {formatNumber(gr.regression.slope, 3)}
                    </td>
                    <td className="py-1.5 px-2 text-slate-300">
                      {formatNumber(gr.regression.intercept, 3)}
                    </td>
                    <td className="py-1.5 px-2 text-slate-400">
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

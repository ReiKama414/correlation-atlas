import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Flame,
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
import * as htmlToImage from 'html-to-image';

interface ScatterPlotProps {
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
  onOpenGuide: () => void;
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

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<PointData | null>(null);
  const [copied, setCopied] = useState(false);

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

  // 2. Detect Outliers on original raw dataset
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

  // 4. Effective points used for regression (if excludeOutliers is true, filter them out)
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

  // 6. Simpson's Paradox Detection
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

  // 7. Group Unique List & Color Map
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

  // 10. Coordinates Scaling
  const width = 800;
  const height = 480;
  const padding = { top: 40, right: 40, bottom: 60, left: 75 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Determine bounds
  const xMinVal = rawX.length > 0 ? Math.min(...rawX) : 0;
  const xMaxVal = rawX.length > 0 ? Math.max(...rawX) : 10;
  const xSpan = xMaxVal - xMinVal || 1;
  const xDomainMin = xMinVal - xSpan * 0.08;
  const xDomainMax = xMaxVal + xSpan * 0.08;

  let yDomainMin = 0;
  let yDomainMax = 10;

  if (showResidualPlot) {
    const residuals = pointsWithResiduals.map((p) => p.residual);
    const maxRes = Math.max(...residuals.map((r) => Math.abs(r))) || 1;
    yDomainMin = -maxRes * 1.2;
    yDomainMax = maxRes * 1.2;
  } else {
    const yMinVal = rawY.length > 0 ? Math.min(...rawY) : 0;
    const yMaxVal = rawY.length > 0 ? Math.max(...rawY) : 10;
    const ySpan = yMaxVal - yMinVal || 1;
    yDomainMin = yMinVal - ySpan * 0.08;
    yDomainMax = yMaxVal + ySpan * 0.08;
  }

  const scaleX = (val: number) =>
    padding.left + ((val - xDomainMin) / (xDomainMax - xDomainMin)) * plotWidth;

  const scaleY = (val: number) =>
    height - padding.bottom - ((val - yDomainMin) / (yDomainMax - yDomainMin)) * plotHeight;

  // Grid Ticks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 6;
    const step = (xDomainMax - xDomainMin) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(xDomainMin + i * step);
    }
    return ticks;
  }, [xDomainMin, xDomainMax]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    const step = (yDomainMax - yDomainMin) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(yDomainMin + i * step);
    }
    return ticks;
  }, [yDomainMin, yDomainMax]);

  // Confidence & Prediction Bands Polygon path
  const bandPaths = useMemo(() => {
    if (!showConfidenceBand && !showPredictionBand) return null;
    if (regression.n < 3) return null;

    const steps = 40;
    const stepSize = (xDomainMax - xDomainMin) / steps;
    const ciUpperPts: [number, number][] = [];
    const ciLowerPts: [number, number][] = [];
    const predUpperPts: [number, number][] = [];
    const predLowerPts: [number, number][] = [];

    for (let i = 0; i <= steps; i++) {
      const curX = xDomainMin + i * stepSize;
      const ci = regression.confidenceBand(curX);
      const pred = regression.predictionBand(curX);

      const px = scaleX(curX);
      ciUpperPts.push([px, scaleY(ci.upper)]);
      ciLowerPts.push([px, scaleY(ci.lower)]);
      predUpperPts.push([px, scaleY(pred.upper)]);
      predLowerPts.push([px, scaleY(pred.lower)]);
    }

    // Combine for shaded polygon
    const ciPath =
      `M ${ciUpperPts[0][0]},${ciUpperPts[0][1]} ` +
      ciUpperPts.map((p) => `L ${p[0]},${p[1]}`).join(' ') +
      ` ` +
      ciLowerPts
        .reverse()
        .map((p) => `L ${p[0]},${p[1]}`)
        .join(' ') +
      ' Z';

    const predUpperLine = predUpperPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');
    const predLowerLine = predLowerPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');

    return { ciPath, predUpperLine, predLowerLine };
  }, [regression, showConfidenceBand, showPredictionBand, xDomainMin, xDomainMax, scaleX, scaleY]);

  // Export handlers
  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scatter_${xVar}_vs_${yVar}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(containerRef.current, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Scatter_${xVar}_vs_${yVar}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export PNG', err);
    }
  };

  const handleCopyImage = async () => {
    if (!containerRef.current) return;
    try {
      const blob = await htmlToImage.toBlob(containerRef.current, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Clipboard copy error', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {showResidualPlot ? '殘差診斷分佈圖 (Residual Plot)' : '雙變數散佈圖與回歸線 (Scatter & OLS Regression)'}
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {xVar} ➔ {yVar}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {showResidualPlot
              ? `診斷回歸等分散性 (Homoscedasticity) 與模型線性假設殘差分佈 (y - ŷ)`
              : `普通最小平方法 (OLS) 線性回歸擬合、判定係數 R² 與離群值影響度`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-sm"
            title="複製圖表到剪貼簿"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? '已複製！' : '複製圖片'}</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-sm"
            title="下載高解析度 PNG 圖片"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>PNG</span>
          </button>

          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-sm"
            title="下載無損向量 SVG 圖片"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Main Plot Area */}
      <div
        ref={containerRef}
        className="relative bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800/80 shadow-inner overflow-hidden"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Gradient for Confidence Band */}
            <linearGradient id="ciGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
            </linearGradient>

            {/* Glow filter for outliers */}
            <filter id="outlierGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          {xTicks.map((tick, i) => {
            const xPos = scaleX(tick);
            return (
              <g key={`xtick-${i}`}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={height - padding.bottom}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                <text
                  x={xPos}
                  y={height - padding.bottom + 18}
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                >
                  {formatNumber(tick, 1)}
                </text>
              </g>
            );
          })}

          {yTicks.map((tick, i) => {
            const yPos = scaleY(tick);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                <text
                  x={padding.left - 12}
                  y={yPos + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="ui-monospace, monospace"
                  textAnchor="end"
                >
                  {formatNumber(tick, 1)}
                </text>
              </g>
            );
          })}

          {/* Plot Axes */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Zero Line in Residual Plot Mode */}
          {showResidualPlot && (
            <line
              x1={padding.left}
              y1={scaleY(0)}
              x2={width - padding.right}
              y2={scaleY(0)}
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          )}

          {/* Confidence Band Polygon (if enabled and not residual mode) */}
          {!showResidualPlot && showConfidenceBand && bandPaths && (
            <path d={bandPaths.ciPath} fill="url(#ciGradient)" />
          )}

          {/* Prediction Band Dashed Lines */}
          {!showResidualPlot && showPredictionBand && bandPaths && (
            <>
              <path
                d={bandPaths.predUpperLine}
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <path
                d={bandPaths.predLowerLine}
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.8"
              />
            </>
          )}

          {/* Overall OLS Regression Line (if not in residual mode) */}
          {!showResidualPlot && regression.n >= 2 && (
            <line
              x1={scaleX(xDomainMin)}
              y1={scaleY(regression.predict(xDomainMin))}
              x2={scaleX(xDomainMax)}
              y2={scaleY(regression.predict(xDomainMax))}
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Group Regression Lines (if groupVar active & not residual mode) */}
          {!showResidualPlot &&
            groupRegressions.map((gr) => {
              if (gr.count < 3) return null;
              return (
                <line
                  key={`grp-line-${gr.group}`}
                  x1={scaleX(xDomainMin)}
                  y1={scaleY(gr.regression.predict(xDomainMin))}
                  x2={scaleX(xDomainMax)}
                  y2={scaleY(gr.regression.predict(xDomainMax))}
                  stroke={gr.color}
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  opacity="0.9"
                />
              );
            })}

          {/* Data Points */}
          {pointsWithResiduals.map((pt) => {
            const cx = scaleX(pt.x);
            const cy = scaleY(showResidualPlot ? pt.residual : pt.y);
            const ptColor = groupVar ? groupColorMap.get(pt.group) || '#3b82f6' : '#38bdf8';
            const isExcluded = excludeOutliers && pt.isOutlier;

            return (
              <g
                key={`point-${pt.index}`}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => {
                  setHoveredPoint(pt);
                }}
              >
                {/* Outlier Halo Effect */}
                {pt.isOutlier && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={9}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeDasharray={isExcluded ? '3 2' : 'none'}
                    filter="url(#outlierGlow)"
                    opacity={isExcluded ? 0.4 : 0.9}
                  />
                )}

                {/* Main Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={pt.isOutlier ? 5 : 4.5}
                  fill={pt.isOutlier ? (isExcluded ? '#7f1d1d' : '#ef4444') : ptColor}
                  stroke={pt.isOutlier ? '#fecdd3' : '#ffffff'}
                  strokeWidth={pt.isOutlier ? 1.5 : 1}
                  opacity={isExcluded ? 0.25 : 0.88}
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 12}
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
          >
            {xVar} (自變數 X)
          </text>
          <text
            x={-(height / 2)}
            y={22}
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            {showResidualPlot ? `殘差 (y - ŷ) of ${yVar}` : `${yVar} (應變數 Y)`}
          </text>
        </svg>

        {/* Hover Point Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs text-slate-200 backdrop-blur-md"
            style={{
              left: `${Math.min(width - 220, Math.max(20, scaleX(hoveredPoint.x) - 100))}px`,
              top: `${Math.max(10, scaleY(showResidualPlot ? hoveredPoint.residual : hoveredPoint.y) - 95)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-bold text-white">樣本 #{hoveredPoint.index + 1}</span>
              {groupVar && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                  style={{ backgroundColor: groupColorMap.get(hoveredPoint.group) || '#3b82f6' }}
                >
                  {hoveredPoint.group}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              <div>
                <span className="text-slate-400">{xVar}:</span>{' '}
                <strong className="text-indigo-300">{hoveredPoint.x}</strong>
              </div>
              <div>
                <span className="text-slate-400">{yVar}:</span>{' '}
                <strong className="text-indigo-300">{hoveredPoint.y}</strong>
              </div>
              <div>
                <span className="text-slate-400">回歸預測 ŷ:</span>{' '}
                <span>{formatNumber(regression.predict(hoveredPoint.x), 2)}</span>
              </div>
              <div>
                <span className="text-slate-400">殘差:</span>{' '}
                <span className={hoveredPoint.residual > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatNumber(hoveredPoint.residual, 2)}
                </span>
              </div>
            </div>

            {hoveredPoint.isOutlier && (
              <div className="mt-2 pt-1 border-t border-rose-900/50 text-[10px] text-rose-300 font-semibold flex items-center justify-between">
                <span>⚠️ 檢出為離群值 ({outlierMethod.toUpperCase()})</span>
                <span className="font-mono">分數: {formatNumber(hoveredPoint.outlierScore, 2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Legend in corner */}
        <div className="absolute top-6 right-6 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 backdrop-blur-md shadow-lg max-w-[200px]">
          <div className="font-semibold text-slate-300 text-[11px] mb-1">圖例說明</div>

          {/* Regression Line Legend */}
          {!showResidualPlot && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-4 h-1 bg-indigo-500 rounded-full shrink-0"></span>
              <span className="text-slate-300">總體線性回歸</span>
            </div>
          )}

          {/* Group Legends */}
          {groupVar &&
            uniqueGroups.map((grp) => (
              <div key={`legend-${grp}`} className="flex items-center gap-2 text-[11px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: groupColorMap.get(grp) || '#3b82f6' }}
                ></span>
                <span className="text-slate-300 truncate">{grp}</span>
              </div>
            ))}

          {/* Outliers */}
          <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full border border-rose-500 bg-rose-500/20 shrink-0"></span>
            <span className="text-rose-300">
              {outlierResult.indices.size} 筆離群點 {excludeOutliers ? '(已剔除)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Regression & Correlation Statistical Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Correlation Coefficient */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>{correlationMethod === 'spearman' ? 'Spearman (ρ)' : 'Pearson (r)'}</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatNumber(activeCorrelation.r, 3)}
          </div>
          <div className="text-[10px] text-slate-500">
            {Math.abs(activeCorrelation.r) > 0.7
              ? '強相關性'
              : Math.abs(activeCorrelation.r) > 0.3
              ? '中等相關'
              : '弱或微弱'}
          </div>
        </div>

        {/* Metric 2: R-Squared */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>判定係數 (R²)</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            {formatNumber(regression.rSquared, 3)}
          </div>
          <div className="text-[10px] text-slate-500">
            解釋變異 {(regression.rSquared * 100).toFixed(1)}%
          </div>
        </div>

        {/* Metric 3: P-Value */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>顯著性 p-value</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-sm font-bold font-mono text-white mt-1">
            {formatPValue(activeCorrelation.pValue)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            t = {formatNumber(activeCorrelation.tStat, 2)} (df={activeCorrelation.df})
          </div>
        </div>

        {/* Metric 4: Regression Equation */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="text-[11px] text-slate-400 font-medium">
            回歸方程式 (OLS Equation)
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 truncate">
            Y = {formatNumber(regression.slope, 3)} · X {regression.intercept >= 0 ? '+' : '-'} {formatNumber(Math.abs(regression.intercept), 3)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            斜率誤 SE(β) = {formatNumber(regression.seSlope, 3)}
          </div>
        </div>

        {/* Metric 5: 95% CI for r */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">95% 信賴區間</div>
          <div className="text-xs font-bold font-mono text-slate-200">
            [{formatNumber(activeCorrelation.ci95[0], 3)}, {formatNumber(activeCorrelation.ci95[1], 3)}]
          </div>
          <div className="text-[10px] text-slate-500">
            Fisher's z 轉換
          </div>
        </div>
      </div>

      {/* Group Comparison Table (if grouping active) */}
      {groupVar && groupRegressions.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">
                分組統計比較 ({groupVar})
              </h3>
            </div>
            {simpsonsParadox.isDetected && (
              <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                <Flame className="w-3 h-3 text-rose-400" /> 警示：辛普森悖論 (Simpson's Paradox)
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 font-medium">
                <tr>
                  <th className="py-2 px-3 rounded-l-lg">分組 (Group)</th>
                  <th className="py-2 px-3">樣本數 (n)</th>
                  <th className="py-2 px-3">相關係數 (r)</th>
                  <th className="py-2 px-3">判定係數 (R²)</th>
                  <th className="py-2 px-3">斜率 (Slope β₁)</th>
                  <th className="py-2 px-3">截距 (β₀)</th>
                  <th className="py-2 px-3 rounded-r-lg">顯著性 (p-value)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {groupRegressions.map((gr) => (
                  <tr key={`gr-row-${gr.group}`} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: gr.color }}
                      ></span>
                      <span className="text-white">{gr.group}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{gr.count}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                      {formatNumber(gr.correlation.r, 3)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {formatNumber(gr.regression.rSquared, 3)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      {formatNumber(gr.regression.slope, 3)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {formatNumber(gr.regression.intercept, 3)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
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

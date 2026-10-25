import React, { useRef } from 'react';
import {
  Compass,
  Upload,
  BookOpen,
  Share2,
  CheckCircle2,
  BarChart2,
  Grid,
  Table,
  Sliders,
  Database,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import type { SampleDataset } from '../data/sampleDatasets';

interface NavbarProps {
  currentDatasetId: string;
  onSelectDataset: (dataset: SampleDataset) => void;
  onFileUpload: (file: File) => void;
  activeTab: 'scatter' | 'matrix' | 'variables' | 'verification';
  setActiveTab: (tab: 'scatter' | 'matrix' | 'variables' | 'verification') => void;
  onOpenCausationGuide: () => void;
  onOpenShareModal: () => void;
  onOpenVerificationModal: () => void;
  onOpenStorageModal: () => void;
  rowCount: number;
  chartEngine: 'echarts' | 'svg';
  onChangeChartEngine: (engine: 'echarts' | 'svg') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDatasetId,
  onSelectDataset,
  onFileUpload,
  activeTab,
  setActiveTab,
  onOpenCausationGuide,
  onOpenShareModal,
  onOpenVerificationModal,
  onOpenStorageModal,
  rowCount,
  chartEngine,
  onChangeChartEngine,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Correlation Atlas
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  統計工作台
                </span>
              </div>
            </div>
          </div>

          {/* Dataset Switcher & Import */}
          <div className="flex items-center gap-2">
            <select
              value={currentDatasetId}
              onChange={(e) => {
                const found = SAMPLE_DATASETS.find((d) => d.id === e.target.value);
                if (found) onSelectDataset(found);
              }}
              aria-label="選擇研究資料集"
              className="bg-slate-800 text-slate-200 text-xs font-medium rounded px-2.5 py-1.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[190px] sm:max-w-[240px] truncate"
            >
              {SAMPLE_DATASETS.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
              {currentDatasetId.startsWith('custom_') || currentDatasetId === 'custom' ? (
                <option value={currentDatasetId}>📁 自訂資料集 ({rowCount} 筆)</option>
              ) : null}
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv,text/plain"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded border border-slate-700 cursor-pointer transition-colors"
              title="匯入自訂 CSV 檔案"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">匯入 CSV</span>
            </button>

            <button
              onClick={onOpenStorageModal}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded border border-slate-700 cursor-pointer transition-colors"
              title="管理本地 IndexedDB 儲存庫與分析快照"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">本地資料庫</span>
            </button>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-1.5 text-xs">
            {/* Chart Engine Switcher */}
            <div className="hidden lg:flex items-center bg-slate-800 rounded p-0.5 border border-slate-700">
              <button
                onClick={() => onChangeChartEngine('echarts')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartEngine === 'echarts'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="使用 Apache ECharts 渲染畫布與縮放"
              >
                ECharts
              </button>
              <button
                onClick={() => onChangeChartEngine('svg')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartEngine === 'svg'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="使用原生 SVG 向量圖形渲染"
              >
                SVG 向量
              </button>
            </div>

            <button
              onClick={onOpenCausationGuide}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 border border-amber-800/60 font-medium transition-colors cursor-pointer"
              title="相關不代表因果指南"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">因果指南</span>
            </button>

            <button
              onClick={onOpenVerificationModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-medium transition-colors cursor-pointer"
              title="統計驗證基準"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">統計驗證</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer shadow-sm"
              title="分享/匯出設定 JSON"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">分享/JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-800 space-x-1 overflow-x-auto py-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('scatter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'scatter'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            散佈圖與回歸分析 (Scatter & OLS)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            相關矩陣熱圖 (Correlation Matrix)
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'variables'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            變數結構與描述統計 (Data Schema)
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'verification'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            基準驗證套件 (NIST & R Tests)
          </button>
        </div>
      </div>
    </header>
  );
};

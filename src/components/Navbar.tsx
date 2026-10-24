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
  rowCount: number;
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
  rowCount,
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
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Correlation Atlas
                </span>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  統計關聯研究工作室
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                嚴謹相關係數、回歸線、離群值分析與因果謬誤診斷
              </p>
            </div>
          </div>

          {/* Dataset Switcher & Import */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium hidden md:block">
              範例資料集：
            </label>
            <select
              value={currentDatasetId}
              onChange={(e) => {
                const found = SAMPLE_DATASETS.find((d) => d.id === e.target.value);
                if (found) onSelectDataset(found);
              }}
              aria-label="選擇研究資料集"
              className="bg-slate-800 text-slate-200 text-xs sm:text-sm font-medium rounded-lg px-3 py-1.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer max-w-[200px] sm:max-w-[240px]"
            >
              {SAMPLE_DATASETS.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
              {currentDatasetId === 'custom' && (
                <option value="custom">📁 自訂匯入 CSV ({rowCount} 筆)</option>
              )}
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
              title="匯入自訂 CSV 檔案"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">匯入 CSV</span>
            </button>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCausationGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              title="閱讀統計陷阱與相關不代表因果指南"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">相關 ≠ 因果指南</span>
              <span className="lg:hidden">因果指南</span>
            </button>

            <button
              onClick={onOpenVerificationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              title="檢驗數學函式與基準測試 (NIST StRD / R Benchmark)"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">統計驗證套件</span>
              <span className="lg:hidden">驗證</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
              title="匯出/分享研究設定 JSON"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">分享/設定 JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-800 -mb-px space-x-1 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('scatter')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'scatter'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            散佈圖與回歸分析 (Scatter & OLS)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Grid className="w-4 h-4" />
            相關係數矩陣熱圖 (Correlation Matrix)
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'variables'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Table className="w-4 h-4" />
            變數結構與描述統計 (Data Schema & Stats)
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'verification'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            統計基準驗證 (Benchmark Tests)
          </button>
        </div>
      </div>
    </header>
  );
};

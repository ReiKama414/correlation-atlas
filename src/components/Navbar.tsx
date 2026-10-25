import React, { useRef, useState } from 'react';
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
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import type { SampleDataset } from '../data/sampleDatasets';
import type { ThemeMode } from '../utils/theme';

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
  onToggleMobileSidebar: () => void;
  rowCount: number;
  chartEngine: 'echarts' | 'svg';
  onChangeChartEngine: (engine: 'echarts' | 'svg') => void;
  theme: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
  isDark: boolean;
  xVar: string;
  yVar: string;
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
  onToggleMobileSidebar,
  rowCount,
  chartEngine,
  onChangeChartEngine,
  theme,
  onSetTheme,
  xVar,
  yVar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Main Navbar Top Row */}
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm sm:text-base tracking-tight truncate text-slate-900 dark:text-white">
                  Correlation Atlas
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  工作台
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Controls (Dataset Select & Actions) */}
          <div className="hidden lg:flex items-center gap-2 min-w-0">
            <select
              value={currentDatasetId}
              onChange={(e) => {
                const found = SAMPLE_DATASETS.find((d) => d.id === e.target.value);
                if (found) onSelectDataset(found);
              }}
              aria-label="選擇研究資料集"
              className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[200px] truncate"
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
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              title="匯入自訂 CSV 檔案"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>匯入 CSV</span>
            </button>

            <button
              onClick={onOpenStorageModal}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              title="管理本地 IndexedDB 儲存庫與分析快照"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>本地資料庫</span>
            </button>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile Sidebar / Filter Drawer Trigger */}
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-1.5 rounded text-xs font-medium cursor-pointer"
              title="展開參數設定與篩選抽屜"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">參數篩選</span>
              <span className="font-mono text-[10px] max-w-[70px] truncate text-indigo-600 dark:text-indigo-300">
                ({xVar}×{yVar})
              </span>
            </button>

            {/* Desktop Chart Engine Switcher */}
            <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800 rounded p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onChangeChartEngine('echarts')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartEngine === 'echarts'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="使用 Apache ECharts 渲染"
              >
                ECharts
              </button>
              <button
                onClick={() => onChangeChartEngine('svg')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartEngine === 'svg'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="使用原生 SVG 渲染"
              >
                SVG 向量
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <button
                onClick={onOpenCausationGuide}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-medium transition-colors cursor-pointer"
                title="相關不代表因果指南"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>因果指南</span>
              </button>

              <button
                onClick={onOpenVerificationModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium transition-colors cursor-pointer"
                title="統計驗證基準"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>統計驗證</span>
              </button>

              <button
                onClick={onOpenShareModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer shadow-xs"
                title="分享/匯出設定 JSON"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享/JSON</span>
              </button>
            </div>

            {/* Theme Selector (System / Light / Dark) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onSetTheme('system')}
                className={`p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer ${
                  theme === 'system' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' : ''
                }`}
                title="系統主題 (System)"
                aria-label="切換為跟隨系統主題"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSetTheme('light')}
                className={`p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer ${
                  theme === 'light' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs' : ''
                }`}
                title="淺色模式 (Light)"
                aria-label="切換為淺色模式"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSetTheme('dark')}
                className={`p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-xs' : ''
                }`}
                title="深色模式 (Dark)"
                aria-label="切換為深色模式"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Hamburger (for screens < lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="展開更多選單"
              aria-label="選單開關"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Action Drawer (< lg) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                選擇研究資料集：
              </label>
              <select
                value={currentDatasetId}
                onChange={(e) => {
                  const found = SAMPLE_DATASETS.find((d) => d.id === e.target.value);
                  if (found) onSelectDataset(found);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded p-2 border border-slate-300 dark:border-slate-700 font-medium cursor-pointer"
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
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>匯入 CSV</span>
              </button>

              <button
                onClick={() => {
                  onOpenStorageModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>本地資料庫</span>
              </button>

              <button
                onClick={() => {
                  onOpenCausationGuide();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>因果指南</span>
              </button>

              <button
                onClick={() => {
                  onOpenVerificationModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>統計驗證</span>
              </button>

              <button
                onClick={() => {
                  onOpenShareModal();
                  setIsMobileMenuOpen(false);
                }}
                className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-indigo-600 text-white font-medium shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享 / 匯出設定 JSON</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">圖表引擎切換:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onChangeChartEngine('echarts')}
                  className={`px-2 py-1 rounded font-medium border ${
                    chartEngine === 'echarts'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  ECharts 畫布
                </button>
                <button
                  onClick={() => onChangeChartEngine('svg')}
                  className={`px-2 py-1 rounded font-medium border ${
                    chartEngine === 'svg'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  SVG 向量
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation (Scrollable on small screens) */}
        <div className="flex border-t border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto py-1 scrollbar-none text-xs -mx-2 px-2 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('scatter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'scatter'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>散佈圖與回歸 (Scatter)</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>相關矩陣 (Matrix)</span>
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'variables'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>資料結構 (Schema)</span>
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'verification'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>基準測試 (Benchmark)</span>
          </button>
        </div>
      </div>
    </header>
  );
};

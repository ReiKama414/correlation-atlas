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
    <header className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 select-none transition-colors">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight font-mono truncate text-zinc-900 dark:text-zinc-100">
                Correlation Atlas
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded shrink-0 inline-block">
                工作台
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:block truncate">
              純前端統計關聯研究工作室 · 本地極速運算
            </p>
          </div>

          {/* Current Dataset Badge / Select */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-800 min-w-0">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs shrink-0">資料集:</span>
            <select
              value={currentDatasetId}
              onChange={(e) => {
                const found = SAMPLE_DATASETS.find((d) => d.id === e.target.value);
                if (found) onSelectDataset(found);
              }}
              aria-label="選擇研究資料集"
              className="font-medium text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 max-w-[200px] truncate cursor-pointer focus:outline-none"
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
        </div>

        {/* Desktop Controls (Import & Local DB) */}
        <div className="hidden lg:flex items-center gap-2 min-w-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv,text/plain"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded shadow-xs transition-all cursor-pointer"
            title="匯入自訂 CSV 檔案"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>匯入 CSV</span>
          </button>

          <button
            onClick={onOpenStorageModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded shadow-xs transition-all cursor-pointer"
            title="管理本地 IndexedDB 儲存庫與分析快照"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>本地資料庫</span>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Sidebar / Filter Drawer Trigger */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 rounded text-xs font-medium cursor-pointer"
            title="展開參數設定與篩選抽屜"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xs:inline">參數篩選</span>
            <span className="font-mono text-[10px] max-w-[70px] truncate text-zinc-600 dark:text-zinc-400">
              ({xVar}×{yVar})
            </span>
          </button>

          {/* Desktop Modals & Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={onOpenCausationGuide}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/50 rounded transition-all cursor-pointer"
              title="相關不代表因果指南"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>因果指南</span>
            </button>

            <button
              onClick={onOpenVerificationModal}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 rounded transition-all cursor-pointer"
              title="統計驗證基準"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>統計驗證</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded shadow-xs transition-all cursor-pointer"
              title="分享/匯出設定 JSON"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>分享 / JSON</span>
            </button>
          </div>

          {/* Theme Selector (System / Light / Dark) */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => onSetTheme('system')}
              className={`p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer ${
                theme === 'system' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold' : ''
              }`}
              title="系統主題 (System)"
              aria-label="切換為跟隨系統主題"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetTheme('light')}
              className={`p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer ${
                theme === 'light' ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold' : ''
              }`}
              title="淺色模式 (Light)"
              aria-label="切換為淺色模式"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetTheme('dark')}
              className={`p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer ${
                theme === 'dark' ? 'bg-white dark:bg-zinc-700 text-zinc-100 shadow-xs font-semibold' : ''
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
            className="lg:hidden p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            title="展開更多選單"
            aria-label="選單開關"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Action Drawer (< lg) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden py-3 px-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/95 space-y-2.5 text-xs">
          <div>
            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block mb-1">
              選擇研究資料集：
            </label>
            <select
              value={currentDatasetId}
              onChange={(e) => {
                const found = SAMPLE_DATASETS.find((d) => d.id === e.target.value);
                if (found) onSelectDataset(found);
                setIsMobileMenuOpen(false);
              }}
              aria-label="選擇研究資料集"
              className="w-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded p-2 border border-zinc-300 dark:border-zinc-700 font-medium cursor-pointer"
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
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>匯入 CSV</span>
            </button>

            <button
              onClick={() => {
                onOpenStorageModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>本地資料庫</span>
            </button>

            <button
              onClick={() => {
                onOpenCausationGuide();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>因果指南</span>
            </button>

            <button
              onClick={() => {
                onOpenVerificationModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>統計驗證</span>
            </button>

            <button
              onClick={() => {
                onOpenShareModal();
                setIsMobileMenuOpen(false);
              }}
              className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white font-medium shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>分享 / 匯出設定 JSON</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">圖表引擎切換:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onChangeChartEngine('echarts')}
                className={`px-2 py-1 rounded font-medium border ${
                  chartEngine === 'echarts'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                ECharts 畫布
              </button>
              <button
                onClick={() => onChangeChartEngine('svg')}
                className={`px-2 py-1 rounded font-medium border ${
                  chartEngine === 'svg'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                SVG 向量
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation (Styled like insight-canvas TabNav) */}
      <nav aria-label="工作台視圖導覽" className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 select-none shadow-xs transition-colors">
        <div className="max-w-[1700px] mx-auto px-2 sm:px-4 flex items-center overflow-x-auto no-scrollbar gap-1 min-w-0">
          <button
            onClick={() => setActiveTab('scatter')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3.5 border-b-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'scatter'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100/70 dark:bg-zinc-800/60'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <BarChart2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'scatter' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <span>散佈圖與回歸 (Scatter)</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3.5 border-b-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100/70 dark:bg-zinc-800/60'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <Grid className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'matrix' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <span>相關矩陣 (Matrix)</span>
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3.5 border-b-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'variables'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100/70 dark:bg-zinc-800/60'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <Table className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'variables' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <span>資料結構 (Schema)</span>
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3.5 border-b-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'verification'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100/70 dark:bg-zinc-800/60'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'verification' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <span>基準測試 (Benchmark)</span>
          </button>
        </div>
      </nav>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  Bookmark,
  Check,
  X,
  Save,
} from 'lucide-react';
import {
  getAllDatasets,
  deleteDataset,
  getAnalysesByDataset,
  saveAnalysisSnapshot,
  deleteAnalysis,
} from '../utils/db';
import type { StoredDataset, StoredAnalysis } from '../utils/db';
import type { WorkspaceConfig } from '../types';

interface DatasetStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDatasetId: string;
  currentConfig: WorkspaceConfig;
  onLoadDataset: (dataset: StoredDataset) => void;
  onRestoreSnapshot: (config: WorkspaceConfig) => void;
}

export const DatasetStorageModal: React.FC<DatasetStorageModalProps> = ({
  isOpen,
  onClose,
  activeDatasetId,
  currentConfig,
  onLoadDataset,
  onRestoreSnapshot,
}) => {
  const [datasets, setDatasets] = useState<StoredDataset[]>([]);
  const [snapshots, setSnapshots] = useState<StoredAnalysis[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const refreshData = async () => {
    try {
      const allDs = await getAllDatasets();
      setDatasets(allDs);
      if (activeDatasetId) {
        const analyses = await getAnalysesByDataset(activeDatasetId);
        setSnapshots(analyses);
      }
    } catch (err) {
      console.error('Failed to load from IndexedDB', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, activeDatasetId]);

  const handleSaveSnapshot = async () => {
    if (!snapshotName.trim() || !activeDatasetId) return;
    setIsSavingSnapshot(true);
    try {
      await saveAnalysisSnapshot(activeDatasetId, snapshotName.trim(), currentConfig);
      setSnapshotName('');
      setSavedSuccess(true);
      await refreshData();
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save snapshot', err);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await deleteAnalysis(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete snapshot', err);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!confirm('確定要從本地資料庫刪除此資料集嗎？')) return;
    try {
      await deleteDataset(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete dataset', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div role="dialog" aria-modal="true" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-zinc-800 dark:text-zinc-200 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                本地資料庫與研究快照管理 (IndexedDB Persistence)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                所有匯入資料均儲存於瀏覽器安全 IndexedDB 本地沙盒，無須雲端帳號，離線亦可使用
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="關閉儲存庫視窗"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Save Current Analysis Snapshot */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>儲存目前研究快照 (Save Snapshot)</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              將當前座標變數 ({currentConfig.xVariable} vs {currentConfig.yVariable})、離群值規則、篩選條件保存為快照，便於日後快速復原
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="輸入快照名稱 (如: 企鵝喙部辛普森悖論檢測)"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-xs"
              />
              <button
                onClick={handleSaveSnapshot}
                disabled={!snapshotName.trim() || isSavingSnapshot}
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 font-semibold px-3 py-1 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savedSuccess ? '已儲存！' : '儲存快照'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Saved Analysis Snapshots List */}
          {snapshots.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                已儲存的研究快照 ({snapshots.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        X: {s.config.xVariable} | Y: {s.config.yVariable} | 離群值: {s.config.outlierMethod}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onRestoreSnapshot(s.config);
                          onClose();
                        }}
                        className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded text-[11px] cursor-pointer transition-colors"
                      >
                        套用快照
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(s.id)}
                        className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        title="刪除快照"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Saved Custom Datasets */}
          <div className="space-y-2">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
              本地儲存的自訂資料集 ({datasets.length})
            </span>

            {datasets.length === 0 ? (
              <div className="p-4 text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 text-xs">
                尚未在本地儲存自訂 CSV 資料集。透過頂部「匯入 CSV」上傳檔案後將自動持久化儲存於此。
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {datasets.map((ds) => {
                  const isActive = ds.id === activeDatasetId;
                  return (
                    <div
                      key={ds.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                        isActive
                          ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-400 dark:border-zinc-600'
                          : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ds.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600">
                              目前使用中
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                          {ds.rowCount} 筆資料 · {ds.columnCount} 個欄位 · 儲存於 {new Date(ds.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isActive && (
                          <button
                            onClick={() => {
                              onLoadDataset(ds);
                              onClose();
                            }}
                            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                          >
                            載入此資料集
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDataset(ds.id)}
                          className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                          title="從 IndexedDB 刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs cursor-pointer transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  Link,
  X,
} from 'lucide-react';
import type { WorkspaceConfig } from '../types';

interface ShareConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkspaceConfig;
  onApplyConfig: (config: WorkspaceConfig) => void;
}

export const ShareConfigModal: React.FC<ShareConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onApplyConfig,
}) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2));
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CorrelationAtlas_Config_${config.datasetName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopiedJSON(true);
      setTimeout(() => setCopiedJSON(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      // Encode config into URL hash
      const encoded = encodeURIComponent(JSON.stringify(config));
      const shareUrl = `${window.location.origin}${window.location.pathname}#config=${encoded}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyPastedJSON = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(jsonText) as WorkspaceConfig;
      if (!parsed.selectedVariables || !parsed.xVariable || !parsed.yVariable) {
        throw new Error('缺少必要欄位 (selectedVariables, xVariable, yVariable)');
      }
      onApplyConfig(parsed);
      onClose();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : '無效的 JSON 格式');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          setJsonText(content);
          const parsed = JSON.parse(content) as WorkspaceConfig;
          onApplyConfig(parsed);
          onClose();
        } catch (err: unknown) {
          setImportError(err instanceof Error ? err.message : '讀取 JSON 檔案失敗');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div role="dialog" aria-modal="true" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-zinc-800 dark:text-zinc-200 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                分享與匯入研究設定 JSON (Workspace Config)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                完整儲存或還原變數選取、相關方法、離群值規則、自訂過濾篩選器與圖表狀態
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="關閉分享視窗"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold cursor-pointer transition-colors shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '連結已複製！' : '複製一鍵分享網址 (URL Hash)'}</span>
            </button>

            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-medium cursor-pointer transition-colors shadow-xs"
            >
              {copiedJSON ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copiedJSON ? 'JSON 已複製！' : '複製 JSON'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-medium cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>下載 .json 檔</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-medium cursor-pointer transition-colors shadow-xs sm:ml-auto">
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>匯入 .json 檔</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
              ⚠️ 匯入失敗：{importError}
            </div>
          )}

          {/* JSON Text Area */}
          <div className="space-y-1.5">
            <label className="text-zinc-600 dark:text-zinc-400 font-medium block">
              設定 JSON 內容 (可直接編輯或貼上他人的研究設定):
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500 scrollbar-thin leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400 text-xs">
            版本: v{config.version} | 資料集: {config.datasetName}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleApplyPastedJSON}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs cursor-pointer shadow-xs transition-colors"
            >
              套用此設定 (Apply)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

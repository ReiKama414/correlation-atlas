import Papa from 'papaparse';
import type { ColumnMetadata } from '../types';
import { isNumeric, computeDescriptiveStats } from './statistics';

export interface ParsedDataset {
  rawRows: Record<string, unknown>[];
  columns: ColumnMetadata[];
  rowCount: number;
  warnings?: string[];
}

export const MAX_SAFE_ROWS = 50000;

export function parseCSVString(csvText: string): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    if (!csvText || typeof csvText !== 'string' || csvText.trim().length === 0) {
      reject(new Error('檔案為空，請選取包含資料的 CSV 檔案。'));
      return;
    }

    const warnings: string[] = [];

    Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      transformHeader: (header, index) => {
        const clean = header.trim();
        return clean ? clean : `Column_${index + 1}`;
      },
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            const fatalErrors = results.errors.filter((e) => e.type === 'Delimiter' || e.code === 'UndetectableDelimiter');
            if (fatalErrors.length > 0) {
              reject(new Error(`CSV 格式錯誤：無法偵測有效分隔符號。`));
              return;
            }
          }

          let rawRows = results.data.filter((row) =>
            Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
          );

          if (rawRows.length === 0) {
            reject(new Error('檔案未包含有效資料列（僅有表頭或全為空白行）。'));
            return;
          }

          if (rawRows.length > MAX_SAFE_ROWS) {
            warnings.push(`資料量龐大（共 ${rawRows.length} 筆），為確保瀏覽器流暢度已取前 ${MAX_SAFE_ROWS} 筆進行即時分析。`);
            rawRows = rawRows.slice(0, MAX_SAFE_ROWS);
          }

          // Deduplicate and sanitize column names
          const seenHeaders = new Set<string>();
          const rawHeaderKeys = Object.keys(rawRows[0] || {});
          const cleanHeaders: string[] = [];

          for (const key of rawHeaderKeys) {
            let uniqueName = key;
            let counter = 1;
            while (seenHeaders.has(uniqueName)) {
              uniqueName = `${key}_${counter++}`;
            }
            seenHeaders.add(uniqueName);
            cleanHeaders.push(uniqueName);
          }

          const columns: ColumnMetadata[] = [];

          for (let colIdx = 0; colIdx < cleanHeaders.length; colIdx++) {
            const rawKey = rawHeaderKeys[colIdx];
            const colName = cleanHeaders[colIdx];
            const values = rawRows.map((r) => r[rawKey]);

            const distinctVals = new Set(values.map((v) => String(v ?? '').trim()));
            distinctVals.delete('');

            let numericCount = 0;
            let nonNumericTextCount = 0;

            for (const v of values) {
              if (v !== null && v !== undefined) {
                const trimmed = String(v).trim();
                if (trimmed !== '' && trimmed !== 'NA' && trimmed !== 'null' && trimmed !== 'NaN' && trimmed !== '?' && trimmed !== '-' && trimmed !== 'None') {
                  if (isNumeric(v)) {
                    numericCount++;
                  } else {
                    nonNumericTextCount++;
                  }
                }
              }
            }

            const totalAnalyzable = numericCount + nonNumericTextCount;
            const validCount = totalAnalyzable;
            const missingCount = rawRows.length - validCount;
            const isColNumeric = totalAnalyzable > 0 && numericCount / totalAnalyzable >= 0.65;
            const isID =
              !isColNumeric &&
              distinctVals.size > 20 &&
              distinctVals.size === validCount &&
              colName.toLowerCase().includes('id');

            const type = isColNumeric ? 'numeric' : isID ? 'id' : 'categorical';

            if (isColNumeric) {
              const stats = computeDescriptiveStats(values as (string | number | null | undefined)[]);
              columns.push({
                name: colName,
                type: 'numeric',
                distinctCount: distinctVals.size,
                validCount: stats.validCount,
                missingCount: stats.missingCount,
                missingRate: rawRows.length > 0 ? stats.missingCount / rawRows.length : 0,
                mean: stats.mean,
                median: stats.median,
                min: stats.min,
                max: stats.max,
                stdDev: stats.stdDev,
                sampleValues: values.slice(0, 5) as (string | number)[],
              });
            } else {
              columns.push({
                name: colName,
                type,
                distinctCount: distinctVals.size,
                validCount,
                missingCount,
                missingRate: rawRows.length > 0 ? missingCount / rawRows.length : 0,
                sampleValues: values.slice(0, 5) as (string | number)[],
              });
            }
          }

          resolve({
            rawRows,
            columns,
            rowCount: rawRows.length,
            warnings: warnings.length > 0 ? warnings : undefined,
          });
        } catch (err: unknown) {
          reject(err instanceof Error ? err : new Error('解析 CSV 發生未知錯誤。'));
        }
      },
      error: (err: Error) => {
        reject(new Error(`讀取 CSV 失敗：${err.message}`));
      },
    });
  });
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const csvContent = Papa.unparse({
    fields: headers,
    data: rows,
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

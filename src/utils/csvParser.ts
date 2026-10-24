import Papa from 'papaparse';
import type { ColumnMetadata } from '../types';
import { isNumeric, computeDescriptiveStats } from './statistics';

export interface ParsedDataset {
  rawRows: Record<string, unknown>[];
  columns: ColumnMetadata[];
  rowCount: number;
}

export function parseCSVString(csvText: string): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (results) => {
        try {
          const rawRows = results.data.filter((row) =>
            Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
          );

          if (rawRows.length === 0) {
            throw new Error('CSV 檔案為空或無有效資料列');
          }

          const columnNames = Object.keys(rawRows[0] || {});
          const columns: ColumnMetadata[] = [];

          for (const colName of columnNames) {
            const values = rawRows.map((r) => r[colName]);
            const distinctVals = new Set(values.map((v) => String(v ?? '').trim()));
            distinctVals.delete('');

            // Test whether majority of non-empty values are numeric
            let numericCount = 0;
            let nonEmptyCount = 0;

            for (const v of values) {
              if (v !== null && v !== undefined && String(v).trim() !== '') {
                nonEmptyCount++;
                if (isNumeric(v)) {
                  numericCount++;
                }
              }
            }

            const isColNumeric = nonEmptyCount > 0 && numericCount / nonEmptyCount >= 0.75;
            const isID =
              !isColNumeric &&
              distinctVals.size > 20 &&
              distinctVals.size === nonEmptyCount &&
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
              const validCount = nonEmptyCount;
              const missingCount = rawRows.length - nonEmptyCount;
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
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (err: Error) => {
        reject(err);
      },
    });
  });
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
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

import { describe, it, expect } from 'vitest';
import { parseCSVString } from '../csvParser';

describe('CSV Parser Robustness & Edge Cases', () => {
  it('rejects empty files or whitespace-only files with clear localized error', async () => {
    await expect(parseCSVString('')).rejects.toThrow('檔案為空');
    await expect(parseCSVString('   \n  \t  \n  ')).rejects.toThrow('檔案為空');
  });

  it('rejects header-only files with no records', async () => {
    await expect(parseCSVString('col1,col2,col3\n')).rejects.toThrow('未包含有效資料列');
    await expect(parseCSVString('col1,col2,col3\n,,,\n   \n')).rejects.toThrow('未包含有效資料列');
  });

  it('sanitizes empty header names and deduplicates duplicate column headers', async () => {
    const csv = `,age,age,score\nRow1,20,30,85\nRow2,25,35,90`;
    const parsed = await parseCSVString(csv);
    expect(parsed.columns.length).toBe(4);
    expect(parsed.columns[0].name).toBe('Column_1');
    expect(parsed.columns[1].name).toBe('age');
    expect(parsed.columns[2].name).toBe('age_1');
    expect(parsed.columns[3].name).toBe('score');
  });

  it('correctly handles semi-colon delimiters, missing values and quotes', async () => {
    const csv = `"name";"metric_a";"metric_b"\n"Item A";10.5;NA\n"Item B";?;20.8\n"Item C";30.1;35.6`;
    const parsed = await parseCSVString(csv);
    expect(parsed.rowCount).toBe(3);
    const metricA = parsed.columns.find((c) => c.name === 'metric_a');
    expect(metricA?.type).toBe('numeric');
    expect(metricA?.missingCount).toBe(1); // '?' is treated as missing
    expect(metricA?.validCount).toBe(2);
  });
});

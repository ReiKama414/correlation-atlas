import { describe, it, expect } from 'vitest';
import { parseCSVString } from '../csvParser';

describe('CSV Parser', () => {
  it('parses CSV with headers, detects numeric and categorical types, and calculates missing values', async () => {
    const csv = `name,age,income,category
Alice,25,50000,Engineering
Bob,30,NA,Marketing
Charlie,NA,75000,Engineering
David,40,90000,Management
Eva,35,62000,Marketing`;

    const parsed = await parseCSVString(csv);
    expect(parsed.rowCount).toBe(5);
    expect(parsed.columns.length).toBe(4);

    const ageCol = parsed.columns.find((c) => c.name === 'age');
    expect(ageCol).toBeDefined();
    expect(ageCol?.type).toBe('numeric');
    expect(ageCol?.missingCount).toBe(1);
    expect(ageCol?.validCount).toBe(4);
    expect(ageCol?.mean).toBeCloseTo(32.5, 1);

    const catCol = parsed.columns.find((c) => c.name === 'category');
    expect(catCol?.type).toBe('categorical');
    expect(catCol?.distinctCount).toBe(3);
  });
});

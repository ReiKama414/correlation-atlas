import { test, expect } from '@playwright/test';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function doBoxesIntersect(b1: Box, b2: Box, tolerance = 1): boolean {
  // Check if rectangles overlap with tolerance
  const xOverlap = Math.max(0, Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x));
  const yOverlap = Math.max(0, Math.min(b1.y + b1.height, b2.y + b2.height) - Math.max(b1.y, b2.y));
  return xOverlap > tolerance && yOverlap > tolerance;
}

const VIEWPORTS = [
  { name: '320px - Extra Small Mobile', width: 320, height: 568 },
  { name: '375px - Standard Mobile', width: 375, height: 667 },
  { name: '390px - Mainstream Mobile', width: 390, height: 844 },
  { name: '430px - Large Mobile', width: 430, height: 932 },
  { name: '768px - Tablet Portrait', width: 768, height: 1024 },
  { name: '1024px - Tablet Landscape', width: 1024, height: 768 },
  { name: '1280px - Laptop', width: 1280, height: 800 },
  { name: '1440px - Desktop', width: 1440, height: 900 },
  { name: '1920px - Large Display', width: 1920, height: 1080 },
];

test.describe('ZERO-OVERLAP & LAYOUT INTEGRITY VERIFICATION', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}): Strict Document Flow & Zero Component Overlap`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Wait for app mount
      await expect(page.locator('text=Correlation Atlas').first()).toBeVisible();

      // 1. Verify ECharts Scatter View Layout Hierarchy (Document Flow)
      const header = page.locator('[data-testid="chart-header"]').first();
      const title = page.locator('[data-testid="chart-title"]').first();
      const description = page.locator('[data-testid="chart-description"]').first();
      const statistics = page.locator('[data-testid="chart-statistics"]').first();
      const drawingArea = page.locator('[data-testid="chart-drawing-area"]').first();
      const legendFooter = page.locator('[data-testid="chart-legend-footer"]').first();

      await expect(header).toBeVisible();
      await expect(statistics).toBeVisible();
      await expect(drawingArea).toBeVisible();
      await expect(legendFooter).toBeVisible();

      const headerBox = await header.boundingBox();
      const titleBox = await title.boundingBox();
      const descBox = await description.boundingBox();
      const statsBox = await statistics.boundingBox();
      const drawBox = await drawingArea.boundingBox();
      const legendBox = await legendFooter.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(statsBox).not.toBeNull();
      expect(drawBox).not.toBeNull();
      expect(legendBox).not.toBeNull();

      if (headerBox && statsBox && drawBox && legendBox) {
        // Hierarchy rule 1: Header strictly above Statistics
        expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(statsBox.y + 1);

        // Hierarchy rule 2: Statistics strictly above Chart Drawing Area
        expect(statsBox.y + statsBox.height).toBeLessThanOrEqual(drawBox.y + 1);

        // Hierarchy rule 3: Chart Drawing Area strictly above Legend/Footer
        expect(drawBox.y + drawBox.height).toBeLessThanOrEqual(legendBox.y + 1);

        // No pairwise intersection between any of the main regions
        expect(doBoxesIntersect(headerBox, statsBox)).toBe(false);
        expect(doBoxesIntersect(statsBox, drawBox)).toBe(false);
        expect(doBoxesIntersect(drawBox, legendBox)).toBe(false);
        expect(doBoxesIntersect(headerBox, drawBox)).toBe(false);
      }

      // Title & Description non-intersection inside Header
      if (titleBox && descBox) {
        expect(doBoxesIntersect(titleBox, descBox)).toBe(false);
      }

      // 2. Check Group Table if visible
      const groupTable = page.locator('[data-testid="chart-group-table"]').first();
      if (await groupTable.isVisible()) {
        const tableBox = await groupTable.boundingBox();
        expect(tableBox).not.toBeNull();
        if (tableBox && legendBox) {
          expect(legendBox.y + legendBox.height).toBeLessThanOrEqual(tableBox.y + 1);
          expect(doBoxesIntersect(legendBox, tableBox)).toBe(false);
        }
      }

      // 3. Switch to Native SVG Engine (if desktop button visible or dropdown)
      const svgEngineBtn = page.locator('button:has-text("SVG 向量")').first();
      if (await svgEngineBtn.isVisible()) {
        await svgEngineBtn.click();
        await page.waitForTimeout(200);

        const svgHeader = page.locator('[data-testid="chart-header"]').first();
        const svgStats = page.locator('[data-testid="chart-statistics"]').first();
        const svgDraw = page.locator('[data-testid="chart-drawing-area"]').first();
        const svgLegend = page.locator('[data-testid="chart-legend-footer"]').first();

        const sHeaderBox = await svgHeader.boundingBox();
        const sStatsBox = await svgStats.boundingBox();
        const sDrawBox = await svgDraw.boundingBox();
        const sLegendBox = await svgLegend.boundingBox();

        expect(sHeaderBox).not.toBeNull();
        expect(sStatsBox).not.toBeNull();
        expect(sDrawBox).not.toBeNull();
        expect(sLegendBox).not.toBeNull();

        if (sHeaderBox && sStatsBox && sDrawBox && sLegendBox) {
          expect(sHeaderBox.y + sHeaderBox.height).toBeLessThanOrEqual(sStatsBox.y + 1);
          expect(sStatsBox.y + sStatsBox.height).toBeLessThanOrEqual(sDrawBox.y + 1);
          expect(sDrawBox.y + sDrawBox.height).toBeLessThanOrEqual(sLegendBox.y + 1);

          expect(doBoxesIntersect(sHeaderBox, sStatsBox)).toBe(false);
          expect(doBoxesIntersect(sStatsBox, sDrawBox)).toBe(false);
          expect(doBoxesIntersect(sDrawBox, sLegendBox)).toBe(false);
        }

        // Switch back to ECharts
        await page.locator('button:has-text("ECharts")').first().click();
        await page.waitForTimeout(200);
      }

      // 4. Matrix View Layout Integrity
      await page.locator('button:has-text("相關矩陣")').first().click();
      await page.waitForTimeout(200);

      const matrixHeader = page.locator('[data-testid="matrix-header"]').first();
      const matrixTitle = page.locator('[data-testid="matrix-title"]').first();
      const matrixDesc = page.locator('[data-testid="matrix-description"]').first();

      await expect(matrixHeader).toBeVisible();
      const mHeaderBox = await matrixHeader.boundingBox();
      const mTitleBox = await matrixTitle.boundingBox();
      const mDescBox = await matrixDesc.boundingBox();

      if (mTitleBox && mDescBox) {
        expect(doBoxesIntersect(mTitleBox, mDescBox)).toBe(false);
      }
      expect(mHeaderBox).not.toBeNull();

      // Zero horizontal scrollbar throughout
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasOverflow).toBe(false);
    });
  }

  test('200% Font Scaling & Zoom: Containers expand gracefully without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('text=Correlation Atlas').first()).toBeVisible();

    // Simulate 200% text zoom via root font-size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.waitForTimeout(300);

    const header = page.locator('[data-testid="chart-header"]').first();
    const statistics = page.locator('[data-testid="chart-statistics"]').first();
    const drawingArea = page.locator('[data-testid="chart-drawing-area"]').first();
    const legendFooter = page.locator('[data-testid="chart-legend-footer"]').first();

    const headerBox = await header.boundingBox();
    const statsBox = await statistics.boundingBox();
    const drawBox = await drawingArea.boundingBox();
    const legendBox = await legendFooter.boundingBox();

    expect(headerBox).not.toBeNull();
    expect(statsBox).not.toBeNull();
    expect(drawBox).not.toBeNull();
    expect(legendBox).not.toBeNull();

    if (headerBox && statsBox && drawBox && legendBox) {
      expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(statsBox.y + 1);
      expect(statsBox.y + statsBox.height).toBeLessThanOrEqual(drawBox.y + 1);
      expect(drawBox.y + drawBox.height).toBeLessThanOrEqual(legendBox.y + 1);
      expect(doBoxesIntersect(headerBox, statsBox)).toBe(false);
      expect(doBoxesIntersect(statsBox, drawBox)).toBe(false);
      expect(doBoxesIntersect(drawBox, legendBox)).toBe(false);
    }
  });

  test('Visual Screenshots across key viewports and themes', async ({ page }) => {
    // Test 390px Mobile Light Mode
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('[data-testid="chart-header"]')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshot-390-mobile-light.png' });

    // Test 1280px Desktop Dark Mode
    await page.setViewportSize({ width: 1280, height: 800 });
    const darkBtn = page.locator('button[aria-label="切換為深色模式"]').first();
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: 'test-results/screenshot-1280-desktop-dark.png' });
  });
});

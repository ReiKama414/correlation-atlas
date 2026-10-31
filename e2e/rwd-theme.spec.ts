import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '320px - Extra Small Mobile', width: 320, height: 568, isMobile: true },
  { name: '375px - Standard Mobile', width: 375, height: 667, isMobile: true },
  { name: '390px - Mainstream Mobile', width: 390, height: 844, isMobile: true },
  { name: '430px - Large Mobile', width: 430, height: 932, isMobile: true },
  { name: '768px - Tablet Portrait', width: 768, height: 1024, isMobile: true },
  { name: '1024px - Tablet Landscape', width: 1024, height: 768, isMobile: false },
  { name: '1280px - Laptop', width: 1280, height: 800, isMobile: false },
  { name: '1440px - Desktop', width: 1440, height: 900, isMobile: false },
  { name: '1920px - Large Display', width: 1920, height: 1080, isMobile: false },
];

test.describe('Responsive Web Design (9 Viewports) & Dual-Theme Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}): Zero overflow, RWD & Theme Switching`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        consoleErrors.push(err.message);
      });

      // 1. Set Viewport size
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Wait for app mount
      await expect(page.locator('text=Correlation Atlas').first()).toBeVisible();

      // Check zero horizontal overflow on initial load
      const hasInitialOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasInitialOverflow).toBe(false);

      // 2. Dual-Theme Test: Light Mode
      const lightBtn = page.locator('button[aria-label="切換為淺色模式"]').first();
      if (await lightBtn.isVisible()) {
        await lightBtn.click();
      } else {
        // In mobile hamburger menu
        const menuBtn = page.locator('button[aria-label="選單開關"]').first();
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
          await page.locator('button[aria-label="切換為淺色模式"]').first().click();
        }
      }

      // Verify document root dark class is removed in Light Mode
      const isDarkLightMode = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });
      expect(isDarkLightMode).toBe(false);

      // Verify zero horizontal overflow in Light Mode
      const hasLightOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasLightOverflow).toBe(false);

      // 3. Dual-Theme Test: Dark Mode
      const darkBtn = page.locator('button[aria-label="切換為深色模式"]').first();
      if (await darkBtn.isVisible()) {
        await darkBtn.click();
      } else {
        const menuBtn = page.locator('button[aria-label="選單開關"]').first();
        if (await menuBtn.isVisible()) {
          await page.locator('button[aria-label="切換為深色模式"]').first().click();
        }
      }

      // Verify document root dark class is added in Dark Mode
      const isDarkDarkMode = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });
      expect(isDarkDarkMode).toBe(true);

      // Verify zero horizontal overflow in Dark Mode
      const hasDarkOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasDarkOverflow).toBe(false);

      // 4. Test View Switching (Tabs) without layout breakage
      // Switch to Matrix Tab
      await page.locator('button:has-text("相關矩陣")').first().click();
      await page.waitForTimeout(300);
      const hasMatrixOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasMatrixOverflow).toBe(false);

      // Switch to Schema Tab
      await page.locator('button:has-text("資料結構")').first().click();
      await page.waitForTimeout(300);
      const hasSchemaOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasSchemaOverflow).toBe(false);

      // Switch back to Scatter Tab
      await page.locator('button:has-text("散佈圖與回歸")').first().click();
      await page.waitForTimeout(300);

      // 5. Mobile Drawer / Sidebar Test
      if (vp.isMobile) {
        // Mobile Drawer Button must be visible on mobile
        const drawerBtn = page.locator('button[title="展開參數設定與篩選抽屜"]');
        await expect(drawerBtn).toBeVisible();
        await drawerBtn.click();

        // Check drawer content is visible inside the slide-over container
        const drawerContent = page.locator('.fixed.inset-0.lg\\:hidden').getByText('分析參數與篩選設定');
        await expect(drawerContent).toBeVisible();

        // Close drawer
        await page.locator('.fixed.inset-0.lg\\:hidden button[aria-label="關閉參數抽屜"]').click();
        await expect(drawerContent).not.toBeVisible();
      } else {
        // On desktop, the sidebar is inline and visible
        await expect(page.locator('aside')).toBeVisible();
      }

      // 6. Modal Test at this viewport — open Causation Guide (not banner accordion)
      let causationGuideBtn = page.locator('button:has-text("因果指南")').first();
      if (!(await causationGuideBtn.isVisible())) {
        const menuBtn = page.locator('button[aria-label="選單開關"]').first();
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
          causationGuideBtn = page.locator('button:has-text("因果指南")').first();
        }
      }
      if (await causationGuideBtn.isVisible()) {
        await causationGuideBtn.click();
        const modal = page.locator('[role="dialog"]').filter({ hasText: '研究者手冊' });
        await expect(modal).toBeVisible();

        const modalBox = await modal.boundingBox();
        if (modalBox) {
          expect(modalBox.x).toBeGreaterThanOrEqual(0);
          expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(vp.width + 10);
        }

        await modal.getByRole('button', { name: '關閉因果手冊' }).click();
        await expect(modal).not.toBeVisible();
      }

      // Assert zero console/page errors
      expect(consoleErrors).toHaveLength(0);
    });
  }
});

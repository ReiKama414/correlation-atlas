import { test, expect } from '@playwright/test';

test.describe('Correlation Atlas End-to-End Interaction Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the workbench to be ready
    await expect(page.locator('text=Correlation Atlas')).toBeVisible();
  });

  test('Flow 1: Loads default Palmer Penguins dataset and triggers Simpson’s Paradox alert', async ({ page }) => {
    // Check brand header
    await expect(page.locator('text=Correlation Atlas')).toBeVisible();
    await expect(page.locator('text=統計工作台')).toBeVisible();

    // Check sample size badges
    await expect(page.locator('text=總樣本數:')).toBeVisible();
    await expect(page.locator('text=有效分析樣本:')).toBeVisible();

    // Check that Simpson's Paradox alert is automatically flagged for Penguins
    await expect(page.locator('text=偵測到辛普森悖論')).toBeVisible();
    await expect(page.locator('text=Simpson\'s Paradox Detected')).toBeVisible();

    // Check that statistical metric cards are rendered with non-empty values
    await expect(page.locator('div:has-text("判定係數 (R²)")').first()).toBeVisible();
    await expect(page.locator('text=回歸方程式 (OLS Equation)').first()).toBeVisible();
  });

  test('Flow 2: Switch views between Scatter Plot, Correlation Matrix, and Variable Schema', async ({ page }) => {
    // 1. Switch to Correlation Matrix
    await page.click('button:has-text("相關矩陣熱圖")');
    await expect(page.locator('text=ECharts 相關係數矩陣熱圖')).toBeVisible();
    await expect(page.locator('select[aria-label="選擇相關係數類型"]')).toBeVisible();

    // 2. Switch to Data Schema & Stats
    await page.click('button:has-text("變數結構與描述統計")');
    await expect(page.locator('text=變數資料結構與描述統計總覽')).toBeVisible();
    await expect(page.locator('table').getByText('bill_length_mm').first()).toBeVisible();
    await expect(page.locator('table').getByText('bill_depth_mm').first()).toBeVisible();

    // 3. Switch to Benchmark Verification Tab
    await page.click('button:has-text("基準驗證套件")');
    await expect(page.locator('text=數值基準檢驗套件 (NIST StRD & R Benchmarks)')).toBeVisible();
  });

  test('Flow 3: Switch dataset to Anscombe’s Quartet and verify mathematical regression equation', async ({ page }) => {
    // Select Anscombe's Quartet in dataset dropdown
    const select = page.locator('select[aria-label="選擇研究資料集"]');
    await select.selectOption('anscombe');

    // Wait for data to update and verify equation parameters
    await expect(page.locator('text=Y = 0.500 · X + 3.000')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=0.667').first()).toBeVisible(); // R²
  });

  test('Flow 4: Open and execute the NIST & R Benchmark Verification Suite', async ({ page }) => {
    // Click "統計驗證" button in header
    await page.click('button[title="統計驗證基準"]');

    // Verify modal is open
    await expect(page.locator('text=統計函式數值驗證套件')).toBeVisible();
    await expect(page.locator('text=NIST Norris Linear Regression Benchmark')).toBeVisible();

    // Click "立即執行驗證測試"
    await page.click('button:has-text("立即執行驗證測試")');

    // Verify all tests pass
    await expect(page.locator('text=全部基準測試通過 (100% Passed)')).toBeVisible({ timeout: 5000 });

    // Close modal via close button
    await page.locator('button:has(svg.lucide-x)').first().click();
  });

  test('Flow 5: Open Causation Guide, Share Config Modal, and Local Storage Modal', async ({ page }) => {
    // 1. Open Causation Guide Modal
    await page.click('button[title="相關不代表因果指南"]');
    await expect(page.locator('text=「相關不代表因果 (Correlation ≠ Causation)」研究者手冊')).toBeVisible();
    await expect(page.locator('text=共同潛在干擾因子 (Confounding Variable)')).toBeVisible();
    await page.click('button:has-text("我瞭解了，回到研究分析")');

    // 2. Open Share & Config JSON Modal
    await page.click('button[title="分享/匯出設定 JSON"]');
    await expect(page.locator('text=分享與匯入研究設定 JSON')).toBeVisible();
    await expect(page.locator('button:has-text("下載 .json 檔")')).toBeVisible();
    await page.click('button:has-text("取消")');

    // 3. Open Local Database (IndexedDB) Modal
    await page.click('button[title="管理本地 IndexedDB 儲存庫與分析快照"]');
    await expect(page.locator('text=本地資料庫與研究快照管理 (IndexedDB Persistence)')).toBeVisible();
    await page.click('button:has-text("關閉")');
  });
});

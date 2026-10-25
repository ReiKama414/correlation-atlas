# Correlation Atlas (統計關聯研究工作室)

> 專為實證統計、數據科學與計量研究打造的專業級統計關聯研究與因果謬誤診斷工作台。  
> 支援 CSV 匯入、變數選取、Pearson / Spearman 相關矩陣熱圖、雙變數散佈圖、OLS 線性回歸擬合、判定係數 $R^2$、95% 信賴與預測區間帶、離群值影響度診斷、分組比較與辛普森悖論 (Simpson's Paradox) 自動示警，並內建可驗證的 NIST / R 統計標準基準檢驗與 IndexedDB 本地持久化。

---

## 🌟 核心特色 (Key Features)

### 1. 📂 彈性 CSV 匯入與異常防護
- **完整異常處理**：處理空檔案（0 bytes）、僅有表頭無資料列、亂碼、缺少欄位與異常字元；自動偵測逗號 `,`、分號 `;`、Tab `\t` 與管線 `|` 分隔符。
- **缺失值容錯**：自動識別 `NA`、`null`、`NaN`、`?`、`-`、`None` 及空字串，不干擾數值欄位型態判別。
- **大檔案防護**：超過 50,000 筆資料時自動提醒並進行分批採樣，防止瀏覽器記憶體崩潰。
- **內建研究資料集**：
  - **Palmer Penguins (南蠻企鵝)**：經典辛普森悖論展示（整體負相關，分組內部 Adelie, Chinstrap, Gentoo 各組皆為顯著正相關）。
  - **Anscombe's Quartet (安斯庫姆四重奏)**：均值、方差、回歸直線完全相同，但分佈完全不同的傳奇資料。
  - **Spurious Ice Cream (冰淇淋與溺水)**：以「氣溫」為潛在干擾因子的荒謬相關代表案例。
  - **Fisher's Iris (鳶尾花形態)**：經典多變數連續特徵分佈。
  - **World Happiness (全球幸福指數與經濟指標)**：多維度社會經濟指標關聯。
  - **Marketing ROI (全通路行銷廣告與銷售額)**：廣告預算投入與回歸預測。

### 2. 📊 Apache ECharts 專業圖表與縮放
- **雙變數散佈圖與線性回歸**：普通最小平方法 (OLS) 回歸直線、斜率 $\beta_1$、截距 $\beta_0$、判定係數 $R^2$、斜率標準誤與 $t$ 檢定 $p$ 值。
- **雙層統計區間帶**：
  - 95% 信賴區間帶 (Confidence Band, CI): 反映母體期望值的估計不確定度。
  - 95% 預測區間帶 (Prediction Band): 涵蓋單一觀測值變異範圍。
- **殘差診斷模式 (Residual Plot)**：一鍵切換繪製殘差 $(y_i - \hat{y}_i)$ 分佈，診斷等分散性 (Homoscedasticity) 與線性假設。
- **相關係數矩陣熱圖**：支援全對稱矩陣、下三角矩陣 (Lower) 或上三角矩陣 (Upper)；支援依**階層聚類距離關聯分群 (Clustered Seriation)**、原始順序或字母排序。
- **互動工具箱**：支援區域框選縮放 (DataZoom)、滑鼠滾輪縮放、圖表還原、高解析度 PNG 匯出。

### 3. 🎯 離群值檢驗與強健性對比 (Outliers)
- **多演算法支援**：
  - **Cook's Distance (庫克距離)**：辨識具高槓桿 (Leverage) 與高殘差的雙變數回歸影響點 ($D_i > 4/n$)。
  - **Tukey IQR (四分位距圍欄)**：超出 $Q_1 - 1.5 \times IQR$ 或 $Q_3 + 1.5 \times IQR$。
  - **Z-Score (標準化分數)**：$|Z| > 2.5$。
- **動態剔除開關 (Exclude Outliers)**：即時對比「納入 vs 排除」離群值後的回歸斜率與 $R^2$ 變化。

### 4. 👥 分組比較與辛普森悖論偵測 (Simpson's Paradox Alert)
- 選取類別分組變數後，自動為各群組繪製獨立分色回歸線與分組指標卡。
- **辛普森悖論即時示警**：當整體關聯方向（正/負）與多數群組內部方向發生逆轉時，觸發警示橫幅與深入分析說明。

### 5. 💾 IndexedDB 本地持久化與研究快照
- **無須帳號與伺服器**：所有上傳之自訂 CSV 均安全持久化儲存於瀏覽器 IndexedDB 沙盒中，離線亦可使用。
- **研究快照管理 (Snapshots)**：隨時將目前的座標軸、離群值規則、篩選條件保存為具名快照，日後可一鍵還原。
- **重整狀態自動恢復**：瀏覽器重整後自動讀取最後使用中的資料集與設定。

### 6. 🧪 可驗證的純 TypeScript 統計函式庫與基準套件
- 內建 NIST StRD (Norris 數據集) 與 R 語言 `cor.test`、`anscombe`、帶 tie 的斯皮爾曼基準。
- 於瀏覽器中提供即時測試檢驗面板，供研究人員與師生親自檢視計算誤差與容許值。

---

### 7. 📱 響應式佈局 (RWD) 與黑白雙主題 (Dual-Theme)
- **9 大 Viewport 完整驗證**：320px、375px、390px、430px (手機)、768px (平板直向)、1024px (平板橫向)、1280px (筆電)、1440px (桌面)、1920px (大型螢幕)。
- **絕對零跑版保證**：全頁面無非預期橫向捲軸 (`scrollWidth <= innerWidth`)，表格與圖表具備獨立響應容器。
- **手機版抽屜式導覽 (Mobile Drawer)**：窄螢幕 (< 1024px) 參數面板自動轉為觸控優化抽屜，確保圖表分析主視覺完整呈現。
- **System / Light / Dark 雙主題**：
  - 預設跟隨作業系統 `prefers-color-scheme` 即時切換。
  - 支援手動鎖定 Light 或 Dark 模式並持久化於 `localStorage`。
  - 圖表、熱圖、軸線、工具提示與卡片色彩皆無縫適應黑白雙模式。

---

## 🛠️ 技術棧 (Tech Stack)

- **前端核心**：React 19 + TypeScript
- **建置工具**：Vite 8
- **圖表引擎**：Apache ECharts 6 + 原生 SVG 雙引擎
- **本地儲存**：IndexedDB (`idb` v8)
- **樣式系統**：Tailwind CSS v4 (專業黑白/Slate雙主題)
- **單元測試**：Vitest 5 (11 項統計與解析測試全部通過)
- **端到端測試**：Playwright 1.64 (14 項主要流程與 9 Viewport RWD/主題切換測試全部通過)

---

## 🚀 本地開發、建置與測試

```bash
# 1. 安裝相依套件
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 執行統計計算與解析單元測試 (Vitest)
npm test

# 4. 執行主要互動流程端到端測試 (Playwright E2E)
npm run test:e2e

# 5. 生產環境編譯打包
npm run build
```

---

## 🌐 部署設定 (GitHub Pages)

本專案已在 `vite.config.ts` 設定 `base: './'`，並在 `.github/workflows/deploy.yml` 提供 GitHub Actions 自動部署：

1. 將程式碼推送到 GitHub 儲存庫 `main` 或 `master` 分支。
2. 前往儲存庫 **Settings** ➔ **Pages**。
3. 將 **Source** 設定為 **GitHub Actions**。
4. 每次 push 後將自動執行測試、建置並發布至 GitHub Pages。

---

## ⚠️ 已知限制與說明 (Known Limitations)

1. **瀏覽器單執行緒運算量**：雖然系統已針對數萬筆資料進行效能優化，但若 CSV 超過 50,000 筆，為維持流暢的 60fps 拖曳與渲染，系統將提示並採樣前 50,000 筆資料。
2. **本地儲存容量**：IndexedDB 儲存空間受瀏覽器磁碟配額限制（通常為數百 MB 至數 GB，對於一般表格研究數據極為充裕）。
3. **雲端協作需求說明**：目前採用完全去中心化的「純前端 + 本地 IndexedDB + URL Hash」機制。如未來需要團隊多租戶即時同步，需額外配合後端關聯資料庫（例如 PostgreSQL）或物件儲存服務（S3）。

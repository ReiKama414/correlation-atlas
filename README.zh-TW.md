# Correlation Atlas (統計關聯研究工作室)

[English](README.md) · **繁體中文**

> 專為實證統計、計量研究與數據探索打造的**純前端統計關聯與回歸診斷工作台**，開箱即用、無須註冊與安裝後端

<p align="center">
  <a href="https://github.com/ReiKama414/correlation-atlas">GitHub 儲存庫</a> ·
  <a href="https://reikama414.vercel.app/">個人網站</a> ·
  <a href="#快速開始">快速開始</a> ·
  <a href="#技術棧">技術棧</a> ·
  <a href="#測試與標準驗證">測試驗證</a> ·
  <a href="#license--權限">授權說明</a>
</p>

---

## 為什麼做

在資料科學與統計教學中，初學者與研究者經常面臨兩大痛點：一是相關矩陣往往被當成最終結論，忽略了「相關不代表因果」以及潛在干擾因子導致的辛普森悖論；二是龐大的統計套件（如 R、Python）環境建置門檻較高，而輕量線上工具又常缺乏數值精度驗證、區間帶計算與強健的離群值診斷

Correlation Atlas 提供了一個無需任何伺服器、開箱即用且經過數值基準驗證的互動式統計工作室。使用者只需將 CSV 拖曳至瀏覽器中，即可進行高水準的探索性資料分析（EDA）與回歸診斷

---

## 核心亮點

- **多維相關矩陣熱圖** — 支援 Pearson 線性相關與 Spearman 等級相關，提供全對稱、下三角與上三角矩陣檢視，並內建階層聚類關聯分群（Clustered Seriation）排序演算法
- **雙變數散佈圖與回歸擬合** — 普通最小平方法（OLS）即時計算回歸直線、判定係數 $R^2$、斜率標準誤 SE($\beta$) 與雙尾 $t$ 檢定 $p$ 值
- **雙層統計區間帶與殘差診斷** — 同步繪製 95% 信賴帶（Confidence Band）與 95% 預測帶（Prediction Band），並支援一鍵切換殘差診斷圖（Residual Plot）檢驗等分散性假設
- **多演算法離群值偵測** — 內建 Cook's Distance（庫克距離）、Tukey IQR（四分位距圍欄）與 Z-Score 演算法，並提供動態剔除開關比對回歸穩定性
- **辛普森悖論自動偵測** — 進行分組比較時自動監控總體與各子群關聯方向，當群體內部相關性與整體宏觀趨勢逆轉時即時發出警示橫幅
- **NIST 與 R 標準基準跑分套件** — 內建美國國家標準與技術研究院 StRD 基準（Norris、Pontius、NoInt1）與 R 語言標準案例，可直接在瀏覽器端檢驗小數點後 5 位數值精度
- **雙圖表引擎與無失真匯出** — 支援 Apache ECharts（流暢縮放、平移與資料框選）與原生 SVG 雙引擎切換，提供無損向量 SVG、高解析 PNG 下載與設定 JSON 匯出分享
- **本地持久化與隱私無痕** — 透過 IndexedDB 於瀏覽器沙盒保存資料集與研究快照，無外部伺服器依賴、無 Cookie 追蹤、無第三方雲端資料外洩風險
- **嚴格零重疊排版與 9 大 Viewport RWD** — 嚴格遵循 Document Flow（標題 $\rightarrow$ 說明 $\rightarrow$ 統計指標 $\rightarrow$ 圖表畫布 $\rightarrow$ 獨立圖例與摘要），適應 320px 至 1920px 且全站零非預期橫向溢出
- **黑白雙主題即時切換** — 支援 System、Light、Dark 三種模式，智慧跟隨作業系統色彩喜好，高對比排版無眩光或視覺疲勞

---

## 技術棧

| 類別 | 技術與工具 | 說明 |
| --- | --- | --- |
| 核心框架 | React 19 · TypeScript 6 | 現代前端元件架構與強型別約束 |
| 建置工具 | Vite 8 | 模組熱重載與最佳化打包 |
| 樣式系統 | Tailwind CSS 4 | 現代化 Design Tokens 與黑白雙主題管理 |
| 圖表引擎 | Apache ECharts 6 · 原生 SVG | 雙引擎架構，兼顧動態縮放與向量無失真輸出 |
| 本地儲存 | IndexedDB (`idb` v8) · Web Storage | 離線資料集、研究快照與偏好設定持久化 |
| 資料解析 | PapaParse 5 | 強健的 CSV 解析器，支援多種分隔符與缺失值標記 |
| 單元測試 | Vitest 5 | 雙精度浮點統計演算法與矩陣解析測試 |
| 端到端測試 | Playwright 1.64 | 25 項跨瀏覽器流程、RWD 與零重疊檢驗 |

---

## 快速開始

### 環境需求

- Node.js 20+
- 支援 ES2022 與 WebGL/Canvas 的現代瀏覽器

### 本地啟動

```bash
# 複製專案儲存庫
git clone https://github.com/ReiKama414/correlation-atlas.git
cd correlation-atlas

# 安裝相依套件
npm install

# 啟動本機開發伺服器
npm run dev
```

開啟終端機印出的本地端網址（通常為 `http://localhost:5173/`）即可開始使用

### 生產建置與預覽

```bash
# 執行 TypeScript 型別檢查與打包
npm run build

# 本機預覽正式建置產物
npm run preview
```

---

## 測試與標準驗證

本專案將統計計算的正確性與介面排版穩定度視為首要標準，提供完整的測試套件：

| 測試類型 | 指令 | 檢驗範圍 |
| --- | --- | --- |
| 統計單元測試 | `npm test` | Vitest 驗證 Pearson、Spearman、OLS 線性回歸、信賴帶/預測帶、Cook's D、IQR 與 CSV 異常防護 |
| 端到端整合測試 | `npm run test:e2e` | Playwright 自動化驗證 25 項測試（含核心業務流程、9 大 Viewport 零水平溢出、雙主題切換） |
| 排版零重疊檢驗 | `npx playwright test e2e/zero-overlap.spec.ts` | 嚴格比對 Header、統計指標、圖表畫布與圖例各區塊 Bounding Box，確保絕不相交且支援 200% 字體縮放 |
| 內建 NIST 跑分工具 | 點擊介面「驗證跑分」 | 瀏覽器即時比對 NIST Norris、Pontius、NoInt1 與 Anscombe 基準，誤差小於 $10^{-5}$ |

---

## 專案結構

```
correlation-atlas/
├── .github/workflows/       # GitHub Actions 自動部署工作流
├── e2e/                     # Playwright 端到端與視覺驗收測試
│   ├── app.spec.ts          # 核心業務流程測試
│   ├── rwd-theme.spec.ts    # 9 大 Viewport 響應式與雙主題測試
│   └── zero-overlap.spec.ts # Bounding Box 非相交與排版完整性測試
├── src/
│   ├── components/          # 視覺元件（散佈圖、矩陣熱圖、因果指南、驗證跑分等）
│   ├── data/                # 內建示範研究資料集（企鵝、四重奏、冰淇淋、鳶尾花等）
│   ├── utils/               # 純 TypeScript 核心模組
│   │   ├── statistics.ts    # 統計演算法庫（回歸、矩陣、離群值、辛普森悖論）
│   │   ├── csvParser.ts     # CSV 解析、型態推論與缺失值防護
│   │   ├── db.ts            # IndexedDB 本地資料庫封裝
│   │   ├── theme.ts         # System / Light / Dark 雙主題反應式狀態
│   │   └── colors.ts        # 色彩對比度運算與熱圖色彩對應
│   ├── App.tsx              # 主應用工作台
│   └── main.tsx             # 應用程式入口
├── LICENSE                  # 專案授權文件
├── package.json             # 專案配置與依賴
├── README.md                # 英文專案說明
└── README.zh-TW.md          # 繁體中文專案說明
```

---

## 內建研究資料集

工作台開箱即提供多組經典計量統計資料集供教學與探索：

1. **Palmer Penguins (南蠻企鵝)** — 經典辛普森悖論代表案例（總體 bill length 與 bill depth 呈現負相關，分組內部則全部呈現強正相關）
2. **Anscombe's Quartet (安斯庫姆四重奏)** — 四組平均值、方差、回歸直線完全一致，但分佈形態截然不同的傳奇數據
3. **Spurious Ice Cream (冰淇淋與溺水)** — 典型「荒謬相關」案例，受隱藏干擾因子（氣溫）驅動
4. **Fisher's Iris (鳶尾花形態)** — 經典多變量花萼與花瓣幾何特徵數據
5. **World Happiness (全球幸福指數)** — 國家 GDP、社會支持度與人均健康壽命的實證關聯
6. **Marketing ROI (全通路行銷投放)** — 數位廣告預算與業務收益之多元回歸預測

---

## 靜態部署

本專案為純前端單頁應用（SPA），可直接部署至任何靜態託管平台：

### GitHub Pages

1. 將專案推送到 GitHub 儲存庫
2. 前往儲存庫 **Settings** $\rightarrow$ **Pages**
3. 將 **Source** 設為 **GitHub Actions**
4. 儲存庫內建的 GitHub Actions 將在 push 時自動執行測試、建置並完成發布

### Vercel / Cloudflare Pages

- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- 無需設定任何環境變數或後端服務

---

## 資料隱私與本地持久化

- **完全離線運作** — 運算完全在瀏覽器端單元執行，不向任何第三方或雲端伺服器傳輸研究數據
- **IndexedDB 沙盒隔離** — 上傳的自訂資料集與分析快照僅儲存在本機瀏覽器沙盒，確保敏感研究數據的私密性
- **分享機制純前端化** — 透過 URL Hash 或 JSON 檔案進行參數傳遞，完全不產生伺服器日誌或外部分析痕跡

---

## 已知限制

- **超大資料集分批處理** — 為維持 60 FPS 的即時互動流暢度，當資料量超過 50,000 筆時，系統將提示並進行均勻抽樣
- **瀏覽器配額限制** — IndexedDB 儲存空間依賴瀏覽器分配的磁碟配額，如需跨裝置協作建議使用內建的「分享設定 JSON」進行匯入匯出
- **統計推論邊界** — 系統所有回歸與相關檢定均以資料符合相應常態分佈或等級排序為假設，實際研究結論仍須結合專業領域因果圖與控制變數

---

## License / 權限

Copyright (c) 2026 ReiKama414. All rights reserved.

本專案僅供個人瀏覽與學習。未經著作權人書面同意，不得使用、複製、修改、散布或併入其他專案（含非商業用途）

- [GitHub 儲存庫](https://github.com/ReiKama414/correlation-atlas)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<sub>Built with craftsmanship by <a href="https://github.com/ReiKama414">ReiKama414</a> · Correlation Atlas</sub>

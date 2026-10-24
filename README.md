# Correlation Atlas (統計關聯研究工作室)

> 專為實證統計、數據科學與計量研究打造的互動式關聯研究與因果謬誤診斷平台。  
> 支援 CSV 匯入、變數選取、Pearson / Spearman 相關矩陣熱圖、雙變數散佈圖、OLS 線性回歸擬合、判定係數 $R^2$、95% 信賴與預測區間帶、離群值影響度診斷、分組比較與辛普森悖論 (Simpson's Paradox) 自動示警，並內建可驗證的 NIST / R 統計標準基準檢驗。

---

## 🌟 核心特色 (Key Features)

### 1. 📂 彈性 CSV 匯入與變數探勘
- **檔案解析**：支援逗號、分號、製表符及引號跳脫的 CSV 匯入；自動識別缺失值（`NA`, `null`, `NaN`, `?`, `-` 等）。
- **型態自動判別**：智慧區分連續數值型 (Numeric)、類別因子型 (Categorical) 與唯一識別碼 (ID)。
- **內建研究資料集**：
  - **Palmer Penguins (南蠻企鵝)**：經典辛普森悖論展示（整體負相關，分組內部皆為正相關）。
  - **Anscombe's Quartet (安斯庫姆四重奏)**：均值、方差、回歸直線完全相同，但分佈完全不同的四組傳奇資料。
  - **Spurious Ice Cream (冰淇淋與溺水)**：以「氣溫」為潛在干擾因子的荒謬相關代表案例。
  - **Fisher's Iris (鳶尾花形態)**：經典多變數連續特徵分佈。
  - **World Happiness (世界各國幸福與宏觀指標)**：多維度社會經濟指標關聯。
  - **Marketing ROI (全通路行銷廣告與銷售額)**：廣告預算投入與回歸預測。

### 2. 🔥 相關係數矩陣熱圖 (Correlation Matrix Heatmap)
- **演算法切換**：Pearson 線性相關 ($r$) 與 Spearman 等級單調相關 ($\rho$，帶有平均並列排名 tie-correction)。
- **缺失值策略**：成對剔除 (Pairwise Deletion) 與整列剔除 (Listwise Deletion)。
- **矩陣視圖**：全對稱矩陣、下三角矩陣 (Lower Triangle) 或上三角矩陣 (Upper Triangle)。
- **智慧分群排序**：依原始欄位、階層聚類距離 ($d = 1 - r$) 關聯分群排序 (Clustered Seriation) 或字母排序。
- **一鍵跳轉**：點擊熱圖任一方格，立即切換為該變數成對之散佈圖與回歸線視圖。

### 3. 📈 雙變數散佈圖與 OLS 線性回歸工作室
- **普通最小平方法 (OLS)**：精確計算斜率 $\beta_1$、截距 $\beta_0$、判定係數 $R^2$、斜率標準誤與 $t$ 檢定 $p$ 值。
- **統計區間帶**：
  - 95% 信賴區間帶 (Confidence Band, CI): 反映母體期望值的估計不確定度。
  - 95% 預測區間帶 (Prediction Band): 涵蓋單一觀測值變異範圍。
- **殘差診斷模式 (Residual Plot)**：一鍵切換繪製殘差 $(y_i - \hat{y}_i)$ 分佈，診斷異分散性 (Heteroscedasticity) 與非線性關聯。

### 4. 🎯 離群值檢驗與強健性對比 (Outliers)
- **多演算法支援**：
  - **Cook's Distance (庫克距離)**：辨識具高槓桿 (Leverage) 與高殘差的雙變數回歸影響點 ($D_i > 4/n$)。
  - **Tukey IQR (四分位距圍欄)**：超出 $Q_1 - 1.5 \times IQR$ 或 $Q_3 + 1.5 \times IQR$。
  - **Z-Score (標準化分數)**：$|Z| > 2.5$。
- **動態剔除開關 (Exclude Outliers)**：即時對比「納入 vs 排除」離群值後的回歸斜率與 $R^2$ 變化。

### 5. 👥 分組比較與辛普森悖論偵測 (Simpson's Paradox Alert)
- 選取類別分組變數後，自動為各群組繪製獨立分色回歸線與分組指標卡。
- **辛普森悖論即時示警**：當整體關聯方向（正/負）與多數群組內部方向發生逆轉時，觸發警示橫幅與深入分析說明。

### 6. ⚠️ 「相關不代表因果」教育警示橫幅與知識手冊
- 標註有效樣本數 $n$、缺失值比例與排除離群點。
- 專門手冊解析五大統計因果陷阱：
  1. 共同潛在干擾因子 (Confounding Variable)
  2. 逆向因果 (Reverse Causality)
  3. 辛普森悖論 (Simpson's Paradox)
  4. 選擇性偏差與對撞因子 (Selection / Berkson's Bias)
  5. 偽相關與顯著性操縱 (Spurious Correlation & p-hacking)

### 7. 🧪 可驗證的純 TypeScript 統計函式庫與基準套件
- 內建 NIST StRD (Norris dataset) 與 R 語言 `cor.test`、`anscombe`、帶 tie 的斯皮爾曼基準。
- 於瀏覽器中提供即時測試檢驗面板，供研究人員與師生親自檢視計算誤差與容許值。

### 8. 💾 篩選、圖表匯出與分享設定 JSON
- **動態篩選**：數值連續範圍滑桿、類別多選篩選。
- **圖表下載**：散佈圖與熱圖均支援無失真向量 SVG 下載、高解析度 PNG 下載或複製至剪貼簿。
- **資料匯出**：相關係數矩陣 CSV 匯出、過濾後資料集匯出。
- **設定分享**：一鍵產生包含完整篩選、變數與模型設定的 JSON 檔案、或複製 URL Hash 分享網址。

---

## 🛠️ 技術棧 (Tech Stack)

- **前端框架**：React 19 + TypeScript
- **建置工具**：Vite 8
- **樣式系統**：Tailwind CSS v4
- **圖示組件**：Lucide React
- **CSV 解析**：PapaParse
- **測試框架**：Vitest

---

## 🚀 本地開發與測試 (Local Development)

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev

# 執行統計單元測試
npm test

# 建置生產版本
npm run build
```

---

## 🌐 部署 GitHub Pages

本專案已在 `vite.config.ts` 設定 `base: './'`，並在 `.github/workflows/deploy.yml` 包含完整的 GitHub Actions 自動部署流程：

1. 將本專案推送到 GitHub 的 `main` 或 `master` 分支。
2. 前往 GitHub 儲存庫的 **Settings** -> **Pages**。
3. 將 **Source** 設為 **GitHub Actions**。
4. 每次 push 後將自動執行測試、建置並發布至 GitHub Pages！

---

## 📄 授權 (License)

MIT License.

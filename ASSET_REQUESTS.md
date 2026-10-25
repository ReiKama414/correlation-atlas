# Correlation Atlas - Asset Requests (ComfyUI Specification)

此文件記錄 Correlation Atlas 專案未來如需替換插圖或研究導覽封面時，提供給 ComfyUI / 影像生成工作流之規格及 Prompt 指引。目前系統均採用簡潔的專業工作台 UI 占位與 SVG 向量圖形，完全不阻塞所有統計分析功能。

---

### 1. 封面圖 (Hero Workbench Preview)
- **檔案名稱**：`public/assets/hero_workbench.png`
- **用途**：展示於說明手冊或專案預覽
- **尺寸**：1200 x 630 px (1.91:1)
- **風格**：Minimalist scientific data studio, dark slate theme (#020617, #0f172a), crisp statistical graphs, scatter plot with regression line and confidence bands, clean typography, blueprint aesthetic, no cartoon, high technical clarity.
- **ComfyUI Positive Prompt**:
  ```text
  masterpiece, high quality, professional scientific data analytics dashboard, dark theme slate grey and navy, glowing discrete data points, linear regression slope with confidence bands, correlation heatmap matrix, minimal clean UI design, vector aesthetic, technical workstation, 8k resolution, crisp lines
  ```
- **ComfyUI Negative Prompt**:
  ```text
  lowres, blurry, cartoon, 3d render, messy text, neon oversaturated, chaotic, noise, artifacts
  ```

---

### 2. 因果圖解架構 (Causal DAG & Confounder Illustration)
- **檔案名稱**：`public/assets/causal_confounder_diagram.png`
- **用途**：「相關不代表因果」指南之三變數有向無環圖 (Directed Acyclic Graph)
- **尺寸**：800 x 600 px (4:3)
- **風格**：Clear academic diagram, Node Z pointing arrows to Node X and Node Y, dashed line between X and Y showing spurious correlation, clean vector style, dark background (#0f172a).
- **ComfyUI Positive Prompt**:
  ```text
  clean scientific causal diagram, three nodes DAG graph, node Z pointing arrows to X and Y, confounder lurking variable illustration, dark background, vector line art, technical textbook diagram style
  ```
- **ComfyUI Negative Prompt**:
  ```text
  text errors, colorful paint, realistic, portrait, organic shapes
  ```

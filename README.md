# Correlation Atlas

**English** · [繁體中文](README.zh-TW.md)

> A professional, zero-server **statistical correlation studio and regression diagnostics workbench** built for empirical researchers, educators, and data practitioners.

<p align="center">
  <a href="https://github.com/ReiKama414/correlation-atlas">GitHub Repository</a> ·
  <a href="https://reikama414.vercel.app/">Portfolio Site</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#testing--standard-verification">Verification</a> ·
  <a href="#license--permissions">License</a>
</p>

---

## Why Correlation Atlas

In empirical data science and statistics education, practitioners often face two persistent challenges: correlation matrices are frequently accepted uncritically as end-point conclusions without investigating non-causal confounding or Simpson's paradox, and full statistical software packages (such as R or Python ecosystems) require complex local setup, while lightweight online tools rarely provide NIST-level precision benchmarks, dual confidence bands, or robust outlier diagnostics.

Correlation Atlas delivers a zero-server, verified statistical studio running directly in the browser. Users simply drag and drop CSV files to immediately perform high-precision exploratory data analysis (EDA), regression diagnostics, and paradox detection.

---

## Key Highlights

- **Multi-Dimensional Correlation Heatmap** — Compute Pearson linear and Spearman rank correlation matrices with full symmetric, lower triangular, and upper triangular views, enhanced by Clustered Seriation hierarchical reordering.
- **Bivariate Scatter & OLS Regression** — Ordinary Least Squares (OLS) line fitting with real-time slope $\beta_1$, intercept $\beta_0$, coefficient of determination $R^2$, standard error of slope SE($\beta$), and two-tailed $t$-test $p$-values.
- **Dual Statistical Bands & Residuals** — Render concurrent 95% Confidence Bands (for expected conditional mean) and 95% Prediction Bands (for individual observations), alongside one-click Residual Plot diagnostics for homoscedasticity.
- **Multi-Algorithm Outlier Diagnostics** — Identify high-leverage points and residuals with Cook's Distance ($D_i > 4/n$), Tukey's IQR fences ($1.5 \times \text{IQR}$), and standardized Z-Scores ($|Z| > 2.5$), with dynamic exclusion toggles.
- **Automated Simpson's Paradox Detection** — Continuous multi-group monitoring compares macro correlation trends against sub-group associations, alerting researchers whenever group directions invert.
- **NIST & R Reference Benchmarks** — Built-in NIST StRD suites (Norris, Pontius, NoInt1) and R `cor.test` test cases allowing live in-browser numeric precision verification to $< 10^{-5}$ tolerance.
- **Dual Visualization Engines** — Seamless switching between Apache ECharts (for smooth panning, zooming, and brush selection) and native SVG (for lossless vector exports), with high-DPI PNG and configuration JSON sharing.
- **Local Persistence & Zero Data Leakage** — Client-side sandboxed IndexedDB storage maintains custom datasets and analysis snapshots completely offline without server telemetry, cookies, or cloud dependencies.
- **Strict Zero-Overlap Document Flow & 9 Viewports RWD** — Engineered layout hierarchy (Header $\rightarrow$ Description $\rightarrow$ Metric Cards $\rightarrow$ Chart Area $\rightarrow$ Dedicated Legend & Footer) certified across 320px to 1920px viewports with zero horizontal overflow.
- **Reactive Dual-Theme Engine** — Automatic system theme tracking with manual System, Light, and Dark mode toggles, featuring high-contrast palettes and glare-free backgrounds.

---

## Tech Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| Core Framework | React 19 · TypeScript 6 | Component architecture with strict type safety |
| Build Tool | Vite 8 | Fast HMR and optimized production bundling |
| Styling System | Tailwind CSS 4 | Design tokens and dual-theme variable management |
| Visualization | Apache ECharts 6 · Native SVG | Dual-engine rendering for interactive zoom and vector export |
| Local Database | IndexedDB (`idb` v8) · Web Storage | Sandboxed offline storage for datasets and snapshots |
| Data Ingestion | PapaParse 5 | Streaming CSV parser with delimiter auto-detection and missing value handling |
| Unit Testing | Vitest 5 | Precision numerical testing for statistics and matrix math |
| E2E Testing | Playwright 1.64 | 25 automated tests covering flows, 9 viewports, and zero-overlap integrity |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Modern web browser supporting ES2022 and WebGL/Canvas

### Local Development

```bash
# Clone the repository
git clone https://github.com/ReiKama414/correlation-atlas.git
cd correlation-atlas

# Install dependencies
npm install

# Start development server
npm run dev
```

Navigate to the localhost URL displayed in the terminal (typically `http://localhost:5173/`).

### Production Build & Preview

```bash
# Execute TypeScript checking and build
npm run build

# Preview production build locally
npm run preview
```

---

## Testing & Standard Verification

The codebase treats mathematical correctness and layout integrity as foundational requirements, validated through automated test suites:

| Test Suite | Command | Scope |
| --- | --- | --- |
| Unit Tests | `npm test` | Vitest testing of Pearson, Spearman, OLS parameters, CI/PI bands, Cook's D, IQR, and CSV parser edge cases |
| E2E Verification | `npm run test:e2e` | Playwright test suite running 25 browser tests across core user flows, 9 viewports, and theme switches |
| Zero-Overlap Audit | `npx playwright test e2e/zero-overlap.spec.ts` | Bounding box non-intersection verification and 200% font zoom stress tests |
| NIST StRD Suite | UI "驗證跑分" Button | Real-time browser benchmark testing against official NIST Norris, Pontius, NoInt1, and Anscombe datasets |

---

## Project Structure

```
correlation-atlas/
├── .github/workflows/       # GitHub Actions automated deployment
├── e2e/                     # Playwright end-to-end and layout test specifications
│   ├── app.spec.ts          # Core interaction flow tests
│   ├── rwd-theme.spec.ts    # 9 Viewports RWD and dual-theme tests
│   └── zero-overlap.spec.ts # Bounding box non-intersection audit
├── src/
│   ├── components/          # UI components (ScatterPlot, Matrix, Modals, Banner, Sidebar)
│   ├── data/                # Sample datasets (Penguins, Anscombe, Iris, Ice Cream, etc.)
│   ├── utils/               # Pure TypeScript statistical and data modules
│   │   ├── statistics.ts    # Mathematical core (OLS, Pearson, Spearman, Outliers, Simpson's)
│   │   ├── csvParser.ts     # Resilient CSV parser and type inference
│   │   ├── db.ts            # IndexedDB sandbox wrapper
│   │   ├── theme.ts         # Reactive theme management
│   │   └── colors.ts        # Contrast calculations and heatmap color palettes
│   ├── App.tsx              # Main studio workbench container
│   └── main.tsx             # Application bootstrap entry
├── LICENSE                  # Project license
├── package.json             # Manifest and dependencies
├── README.md                # English documentation
└── README.zh-TW.md          # Traditional Chinese documentation
```

---

## Built-in Datasets

The studio includes curated econometric and biological datasets for exploration:

1. **Palmer Penguins** — Iconic Simpson's paradox case (negative overall bill length vs depth correlation, inverted to strong positive correlation within Adelie, Chinstrap, and Gentoo sub-species).
2. **Anscombe's Quartet** — Four distinct datasets with identical linear means, variances, correlations ($r = 0.816$), and regression lines ($y = 3.0 + 0.5x$), demonstrating the necessity of visual scatter inspection.
3. **Spurious Ice Cream** — Classic spurious correlation case driven by an unobserved confounder (ambient summer temperature).
4. **Fisher's Iris** — Multivariate continuous morphological measurements across species.
5. **World Happiness** — Empirical cross-national relationship between economic GDP, social support, and healthy life expectancy.
6. **Marketing ROI** — Digital advertising budget allocations versus enterprise revenue outcomes.

---

## Static Deployment

As a pure client-side Single Page Application (SPA), Correlation Atlas deploys natively to any static hosting provider:

### GitHub Pages

1. Push code to the repository `main` branch.
2. In repository **Settings** $\rightarrow$ **Pages**, set **Source** to **GitHub Actions**.
3. Automated GitHub Actions will test, bundle, and publish the application upon push.

### Vercel / Cloudflare Pages

- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- No server-side environment secrets or external services required.

---

## Data Privacy & Local Storage

- **100% Client-Side Execution** — Calculations execute strictly within the browser thread; no researcher data is ever transmitted across external networks.
- **IndexedDB Isolation** — Imported CSV files and custom snapshots reside exclusively inside the browser's origin-isolated IndexedDB sandbox.
- **Stateless Sharing** — Workspace sharing operates via URL hash fragments or client-side JSON files without logging or server persistence.

---

## Known Limitations

- **Large Dataset Batch Sampling** — To preserve 60 FPS rendering and smooth brush interactions, datasets exceeding 50,000 rows display a prompt and trigger uniform sampling.
- **Browser Disk Quotas** — Local IndexedDB storage capacity is bounded by browser-allotted disk quotas. Cross-device work is facilitated via JSON workspace export.
- **Inference Assumptions** — Parametric hypothesis testing presumes normal distributed errors; empirical findings should always be paired with domain-specific causal directed acyclic graphs (DAGs).

---

## License / Permissions

Copyright (c) 2026 ReiKama414. All rights reserved.

This project is provided solely for personal viewing and learning purposes. No permission is granted to use, copy, modify, distribute, sublicense, or incorporate this software into other projects (commercial or non-commercial) without express written consent.

- [GitHub Repository](https://github.com/ReiKama414/correlation-atlas)
- [Portfolio Site](https://reikama414.vercel.app/)
- [Full License](./LICENSE)

---

<sub>Built with craftsmanship by <a href="https://github.com/ReiKama414">ReiKama414</a> · Correlation Atlas</sub>

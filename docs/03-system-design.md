# 左腳踩右腳：永動機研究所 系統設計（精簡版）

| 文件項目 | 內容 |
|---|---|
| 文件版本 | 1.0 |
| 文件日期 | 2026-11-14 |
| 狀態 | 依現況盤點補齊 |
| 專案級別 | 公開級 |
| 依據 | Harbor `standards/DevelopmentStandards.md`、`standards/DeploymentHandbook.md` |

## 1. 設計限制

- **零月費**：公開版以 `vite.pages.config.ts` 建置為純靜態網頁部署至 GitHub Pages，不啟用資料庫或後端 Worker 付費資源（`db/schema.ts` 為空）。
- **本機存檔與 SSR Hydration 一致**：進度讀取使用 `useSyncExternalStore` 搭配 `localStorage`，並對損壞的 JSON 做防禦性過濾。
- **嚴格 CSP**：`github-pages/index.html` 設定 CSP，只允許 `'self'` 與 `https://harbor-1wk.pages.dev` 腳本。

## 2. 架構總覽

```text
GitHub repo（main）
  └─ GitHub Actions（ci.yml / deploy-pages.yml）
       ├─ npm ci → npm audit → oxlint → build + build:pages + Playwright/Wrangler 測試 → typecheck
       └─ npm run build:pages（vite.pages.config.ts → pages-dist/）→ GitHub Pages
            └─ 瀏覽器靜態 SPA（app/page.tsx + app/levels.ts）
                 └─ localStorage（left-foot-right-foot-completed）
```

## 3. 目錄結構

```text
app/
  page.tsx              遊戲主畫面、關卡選擇、零件分配與模擬動畫
  levels.ts             10 個關卡設定、裝置倍率表與唯一解參數
  layout.tsx / globals.css
github-pages/           GitHub Pages 靜態入口（index.html、main.tsx）
public/                 favicon.svg、og.png 等靜態資源
tests/
  game-browser.test.mjs Playwright Chromium 10 關通關、容錯與延遲測試
  rendered-html.test.mjs Wrangler SSR HTML 結構與 hydration 測試
worker/ db/ drizzle/    vinext Cloudflare 模板骨架（公開版未啟用資料庫）
vite.pages.config.ts    GitHub Pages 靜態建置設定（輸出至 pages-dist）
```

## 4. 部署與 CI 驗證

- **CI（`.github/workflows/ci.yml`）**：Node 24.22.1 執行 `npm ci`、`npm audit --audit-level=high`、安裝 Playwright Chromium、`npm run lint`（`oxlint`）、`npm test`（`build`、`build:pages` 與 `tests/*.test.mjs`）及 `npm run typecheck`。
- **部署（`.github/workflows/deploy-pages.yml`）**：僅於 `refs/heads/main` 且 actor 為 repo 擁有者時，執行 `npm run build:pages` 並部署 `pages-dist/` 至 GitHub Pages。

## 5. 零月費與效能邊界

| 項目 | 現況與邊界 |
|---|---|
| 託管與算力 | GitHub Pages 免費靜態託管 + GitHub Actions 公開 repo 免費 runner（10 分鐘上限） |
| 產物體積 | Client gzip bundle 約 461 KB（見 `security/reports/2026-10-25-p2-remediation.md`） |
| 互動反應門檻 | `tests/game-browser.test.mjs` 於 320px 窄螢幕執行 20 次暖操作，驗證 p95 `< 100ms` 且無水平溢出 |
| 效能驗收狀態 | 本機／CI 模擬基準已通過；正式環境真機載入數據尚未獨立記錄（待補） |

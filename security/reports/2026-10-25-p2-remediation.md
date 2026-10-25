# SEC-P2-20261025：left-foot-right-foot

日期：2026-10-25。基準：a59e22d29f57f5b680d919b3c12e05c8b23dbd93（feature/sec-p1-20261024）。

狀態：隔離修補已備妥，待整合。未推送／合併／部署；原始工作目錄保留。

精準更新drizzle-kit0.31.11；只在@esbuild-kit/core-utils覆寫esbuild0.25.12、satori覆寫fflate0.7.5，8項moderate在此隔離分支歸零，未退回舊major掩蓋公告。

- 原8 moderate→native audit全等級0
- production build／實際TS transform執行／ZIP正常及畸形拒絕／Satori SVG／Drizzle空schema讀取
- 既有P1首關與保存證據只沿用未改的遊戲程式；舊starter test／lint發布缺口未宣稱修好

npm公告：{"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0}。
Python公告：不適用／未做Python解析。



效能：{"beforeGzipBytes":460242,"afterGzipBytes":461228,"growth":0.0021423511978480884,"thresholdGrowth":0.05,"result":"pass","scope":"Local gzip bundle size, not production latency"}。

範圍與成本：只跑本機及合成fixture，不啟用付費API或遠端CI。沒有完整正式安全或發布驗收；未評項目not_scored。

- 原始工作目錄、未提交修改與分支全部保留；本報告僅適用此隔離分支。
- 完整history／秘密輪替／正式服務與二進位鑑識不在此輪驗收，未評項目not_scored。

Task契約：輸入為固定基準及既有測試；交付為獨立修補分支、manifest/lockfile或來源修補與此去敏證據；無跨專案依賴。驗收是原生工具成功、已知發現逐項處置、適當真實回歸及影響範圍效能門檻；未完成項目明記，不以fixture代表正式環境。

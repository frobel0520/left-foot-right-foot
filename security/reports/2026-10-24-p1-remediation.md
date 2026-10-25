# SEC-P1-20261024 安全修補證據

基線：`f3c184eaa175dcd629cf8bbe86e67e4b22ab6de0`。本次範圍為已核准的高／嚴重依賴修補；未部署或合併。

- root：公開 npm audit high 0、critical 0、moderate 8。
- 功能回歸：blocked_by_existing_baseline_test_and_lint_failures；逐項命令與限制見同名 JSON。
- 效能：通過；client JS+CSS gzip bytes, level 9。本機 fixture／bundle 不替代正式環境效能。
- CI 與發布 Gate 尚待審查，沒有建立付費服務。全機預設 Node 尚未升級，不把 task-local runtime 視為全機完成。

完整契約、更新版本、測試、效能與限制：`2026-10-24-p1-remediation.json`。

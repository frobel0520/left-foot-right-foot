import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { chromium } from "@playwright/test";
import { LEVELS } from "../app/levels.ts";

const storageKey = "left-foot-right-foot-completed";
const prefix = "/left-foot-right-foot/";
const directory = new URL("../pages-dist/", import.meta.url);
const contentTypes = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };

test("built game preserves progress, completes all ten levels, and works on a narrow keyboard viewport", { timeout: 120_000 }, async (t) => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      assert.ok(pathname.startsWith(prefix));
      const relativePath = pathname.slice(prefix.length) || "index.html";
      const file = new URL(relativePath, directory);
      assert.ok(file.href.startsWith(directory.href));
      const extension = fileURLToPath(file).match(/\.[^.]+$/)?.[0];
      response.setHeader("Content-Type", contentTypes[extension] ?? "application/octet-stream");
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
  const url = `http://127.0.0.1:${server.address().port}${prefix}`;
  await page.goto(url);
  await page.getByRole("heading", { level: 1, name: "左腳踩右腳", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "第 2 關：", exact: false }).isDisabled(), true);
  await page.clock.install();

  // A valid-budget losing arrangement must fail without unlocking progress.
  for (let count = 0; count < 3; count++) await page.getByRole("button", { name: `升級${LEVELS[0].machines[0].name}`, exact: true }).click();
  await page.getByRole("button", { name: `升級${LEVELS[0].machines[1].name}`, exact: true }).click();
  await page.getByRole("button", { name: "啟動閉環", exact: true }).click();
  await page.clock.runFor(10_000);
  assert.equal(await page.locator(".failure-panel").isVisible(), true);
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), storageKey), null);
  await page.getByRole("button", { name: "重新調整", exact: true }).click();
  await page.getByRole("button", { name: "清空本關配置", exact: true }).click();

  for (const level of LEVELS) {
    await page.getByRole("heading", { level: 2, name: level.title, exact: true }).waitFor();
    assert.equal(level.solution.reduce((sum, value) => sum + value, 0), level.budget);
    assert.ok(level.machines.reduce((rate, machine, index) => rate * machine.rates[level.solution[index]], 1) > 1);
    for (const [index, machine] of level.machines.entries()) {
      for (let count = 0; count < level.solution[index]; count++) {
        await page.getByRole("button", { name: `升級${machine.name}`, exact: true }).click();
      }
    }
    await page.getByRole("button", { name: "啟動閉環", exact: true }).click();
    for (let step = 0; step < 60 && !(await page.locator(".success-panel").isVisible()); step++) {
      await page.clock.runFor(1000);
    }
    assert.equal(await page.locator(".success-panel").isVisible(), true, `Level ${level.id} must complete through the real controls`);
    assert.deepEqual(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey), LEVELS.slice(0, level.id).map((item) => item.id));
    if (level.id < LEVELS.length) await page.getByRole("button", { name: "進入下一關", exact: true }).click();
  }

  await page.clock.resume();
  await page.evaluate((key) => localStorage.setItem(key, "[1,2,2,99,null,\"3\"]"), storageKey);
  await page.reload();
  await page.getByRole("heading", { level: 2, name: LEVELS[2].title, exact: true }).waitFor();
  assert.equal(await page.locator(".machine-card").count(), LEVELS[2].machines.length);
  await page.evaluate((key) => localStorage.setItem(key, "broken-json"), storageKey);
  await page.reload();
  await page.getByRole("heading", { level: 2, name: LEVELS[0].title, exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "第 2 關：", exact: false }).isDisabled(), true);

  await page.setViewportSize({ width: 320, height: 740 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const upgrade = page.getByRole("button", { name: `升級${LEVELS[0].machines[0].name}`, exact: true });
  await upgrade.focus();
  await page.keyboard.press("Enter");
  assert.match(await page.locator(".machine-card").first().innerText(), /LV\. 1/);
  const samples = [];
  for (let sample = 0; sample < 20; sample++) {
    samples.push(await page.evaluate(async () => {
      const start = performance.now();
      document.querySelector(".machine-card button[aria-label^='移除']").click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return performance.now() - start;
    }));
    await upgrade.click();
  }
  samples.sort((left, right) => left - right);
  const p95 = samples[18];
  t.diagnostic(`Local built-game interaction: 20 warm samples, 320px viewport, p95=${p95.toFixed(2)}ms; gate <100ms`);
  assert.ok(p95 < 100);
  assert.deepEqual(errors, []);
});

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createTestHarness } from "wrangler";
import { chromium } from "@playwright/test";

const server = createTestHarness({ workers: [{ configPath: "dist/server/wrangler.json" }] });
before(() => server.listen());
after(() => server.close());

async function render() {
  return server.fetch("/", { headers: { accept: "text/html" } });
}

test("server renders the actual game and its public metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-Hant"/);
  assert.match(html, /<title>左腳踩右腳：永動機研究所<\/title>/);
  assert.match(html, /<h1>左腳踩右腳<\/h1>/);
  assert.match(html, /失控鍋爐房/);
  assert.match(html, /尚餘 4 枚黃銅螺帽/);
  assert.match(html, /https:\/\/playmint\.pages\.dev\//);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|_sites-preview/);
});

test("server presents ten levels with only the first level initially unlocked", async () => {
  const html = await (await render()).text();
  const rail = html.match(/<nav[^>]*aria-label="關卡選擇"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(rail, "The rendered game must expose level navigation");
  const buttons = [...rail[1].matchAll(/<button\b([^>]*)>/g)];
  assert.equal(buttons.length, 10);
  assert.doesNotMatch(buttons[0][1], /\bdisabled/);
  for (const button of buttons.slice(1)) assert.match(button[1], /\bdisabled/);
  assert.match(rail[1], /第 10 關：宇宙自舉/);
});

test("server-rendered game hydrates saved progress without browser errors", async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const { url } = await server.listen();
    await page.addInitScript(() => localStorage.setItem("left-foot-right-foot-completed", "[1,2,3,4,5,6,7,8,9]"));
    await page.goto(url.href);
    await page.getByRole("heading", { level: 2, name: "宇宙自舉", exact: true }).waitFor();
    assert.equal(await page.locator(".machine-card").count(), 8);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

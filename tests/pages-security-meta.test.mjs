import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("GitHub Pages build output preserves CSP and referrer meta in head", () => {
  const html = readFileSync("pages-dist/index.html", "utf8");
  const headEnd = html.toLowerCase().indexOf("</head>");
  const head = headEnd === -1 ? html : html.slice(0, headEnd);

  assert.match(head, /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]+"\s*\/?>/i);
  assert.match(head, /<meta\s+name="referrer"\s+content="strict-origin-when-cross-origin"\s*\/?>/i);
});

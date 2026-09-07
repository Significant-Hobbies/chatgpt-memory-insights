import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { test } from "node:test";
import { chromium, expect } from "@playwright/test";
import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";

for (const width of [390, 1280]) {
  test(`synthetic ZIP exposes model-download recovery at ${width}px`, async () => {
    const writer = new ZipWriter(new BlobWriter("application/zip"));
    await writer.add(
      "conversations.json",
      new TextReader(
        JSON.stringify([
          {
            id: "synthetic-1",
            title: "Synthetic garden",
            create_time: 1700000000,
            mapping: {
              prompt: {
                message: {
                  id: "prompt-1",
                  author: { role: "user" },
                  create_time: 1700000000,
                  content: { parts: ["How can I grow basil in a small garden?"] },
                },
              },
            },
          },
        ])
      )
    );
    const archive = Buffer.from(await (await writer.close()).arrayBuffer());
    const server = createServer(async (request, response) => {
      try {
        const path = request.url === "/" ? "index.html" : request.url.slice(1).split("?")[0];
        const content = await readFile(new URL(`../dist/${path}`, import.meta.url));
        response.setHeader(
          "content-type",
          path.endsWith(".js")
            ? "text/javascript"
            : path.endsWith(".css")
              ? "text/css"
              : "text/html"
        );
        response.end(content);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route("**/*", (route) =>
        route.request().url().startsWith(origin) ? route.continue() : route.abort()
      );
      await page.goto(origin);
      await page
        .locator("#archive-input")
        .setInputFiles({ name: "synthetic.zip", mimeType: "application/zip", buffer: archive });
      await expect(page.locator("#report-view")).toBeVisible({ timeout: 30000 });
      await expect(page.locator("#error-view")).toBeVisible({ timeout: 30000 });
      await expect(page.locator("#sampling-note")).toContainText("stopped");
      await expect(page.locator("#save-memory")).toBeDisabled();
      await page.locator("#atlas-period").selectOption("all");
      await expect(page.locator("#sampling-note")).toContainText("stopped");
      await expect(page.locator('#memory-search button[type="submit"]')).toBeDisabled();
      const report = await page.locator("#overview-stats").textContent();
      assert.match(report, /Conversations\s*1/);
      await page.locator("#error-reset").click();
      await expect(page.locator("#import-view")).toBeVisible();
      assert.equal(await page.locator("#archive-input").inputValue(), "");
    } finally {
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
    }
  });
}

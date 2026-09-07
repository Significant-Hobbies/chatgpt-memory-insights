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

test("analytics queues initialization until the SDK arrives without collecting archive text", async () => {
  const source = await readFile(new URL("../public/scripts/posthog.js", import.meta.url), "utf8");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  let releaseSdk;
  const ready = new Promise((resolve) => {
    releaseSdk = resolve;
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    if (route.request().url() === "https://memory-map.example/") {
      return route.fulfill({
        contentType: "text/html",
        body: `<input value="SYNTHETIC_PRIVATE_ARCHIVE"><script>${source}</script>`,
      });
    }
    assert.equal(route.request().url(), "https://us-assets.i.posthog.com/static/array.js");
    await ready;
    return route.fulfill({
      contentType: "text/javascript",
      body: `
      const config = window.posthog._i[0][1];
      window.analyticsSettings = { api_host: config.api_host, person_profiles: config.person_profiles, capture_pageview: config.capture_pageview, autocapture: config.autocapture };
      window.analyticsEvents = [];
      window.posthog = { capture: (...args) => window.analyticsEvents.push(args) };
      config.loaded();
    `,
    });
  });
  try {
    await page.goto("https://memory-map.example/", { waitUntil: "domcontentloaded" });
    assert.equal(await page.evaluate(() => window.posthog._i.length), 1);
    assert.deepEqual(errors, []);
    releaseSdk();
    await page.waitForFunction(() => window.analyticsEvents?.length === 1);
    assert.deepEqual(await page.evaluate(() => window.analyticsSettings), {
      api_host: "https://us.i.posthog.com",
      person_profiles: "always",
      capture_pageview: false,
      autocapture: false,
    });
    assert.deepEqual(await page.evaluate(() => window.analyticsEvents), [
      ["page_view", { project_id: "chatgpt-memory-insights" }],
    ]);
    assert.deepEqual(errors, []);
  } finally {
    releaseSdk();
    await browser.close();
  }
});

for (const host of ["localhost", "memory-map.example"]) {
  test(`analytics stays usable with ${host === "localhost" ? "local exclusion" : "blocked SDK"}`, async () => {
    const source = await readFile(new URL("../public/scripts/posthog.js", import.meta.url), "utf8");
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    let sdkRequests = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) => {
      if (route.request().url() === `http://${host}/`)
        return route.fulfill({
          contentType: "text/html",
          body: `<button>Import archive</button><script>${source}</script>`,
        });
      sdkRequests += 1;
      return route.abort();
    });
    try {
      await page.goto(`http://${host}/`);
      await expect(page.getByRole("button", { name: "Import archive" })).toBeEnabled();
      assert.deepEqual(errors, []);
      assert.equal(sdkRequests, host === "localhost" ? 0 : 1);
    } finally {
      await browser.close();
    }
  });
}

import { expect, test } from "@playwright/test";

/**
 * `?tier=low` forces the static fallback, so these tests check the content and
 * layout that every visitor gets, independent of the GPU in the test machine.
 */
const ROUTES = [
  { path: "/", heading: /Dimas Jati Satria/ },
  { path: "/work", heading: /Work/ },
  { path: "/work/tbxxpert", heading: /TBXxpert/ },
  { path: "/about", heading: /About/ },
  { path: "/resume", heading: /Resume/ },
  { path: "/lab", heading: /Lab/ },
  { path: "/writing", heading: /Writing/ },
  { path: "/contact", heading: /Contact/ },
  { path: "/id", heading: /Dimas Jati Satria/ },
  { path: "/id/work", heading: /Karya/ },
  { path: "/id/about", heading: /Tentang/ },
  { path: "/id/contact", heading: /Kontak/ },
];

for (const route of ROUTES) {
  test(`${route.path} renders without errors or sideways scroll`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const response = await page.goto(`${route.path}?tier=low`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.heading);
    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      route.path.startsWith("/id") ? "id" : "en",
    );
    await expect(page.locator("[data-scene]")).toHaveAttribute("data-scene", "static");

    // The CV entry point is reachable from every page (F-03).
    await expect(page.locator("header [data-cv-link]").first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // The old site published a phone number; the new one must not (PRD 9.5).
    expect(await page.content()).not.toMatch(/\+62\s?8|wa\.me\//);

    expect(errors).toEqual([]);
  });
}

test("unknown URLs return a localized 404", async ({ page }) => {
  const english = await page.goto("/this-page-does-not-exist?tier=low");
  expect(english?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Lost in the light/);

  const indonesian = await page.goto("/id/work/tidak-ada?tier=low");
  expect(indonesian?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Tersesat di dalam cahaya/,
  );
});

test("/en redirects to the unprefixed English URL", async ({ page }) => {
  await page.goto("/en/work?tier=low");
  expect(new URL(page.url()).pathname).toBe("/work");
});

test("Night mode toggles, persists, and follows the system on first visit", async ({
  page,
}) => {
  await page.goto("/?tier=low");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "day");

  await page.getByRole("button", { name: "Night mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "night");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "night");
});

test("first visit honours prefers-color-scheme: dark", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/?tier=low");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await context.close();
});

test("language toggle switches to the same page in Indonesian", async ({ page }) => {
  await page.goto("/about?tier=low");
  await page.locator('header a[hreflang="id"]').click();
  await expect(page).toHaveURL(/\/id\/about/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tentang/);
});

test("skip link is the first focus stop and targets the main content", async ({
  page,
}) => {
  await page.goto("/?tier=low");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#content");
  await expect(page.locator("main#content")).toBeVisible();
});

test("content is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Dimas Jati Satria/);
  await expect(page.getByRole("heading", { name: "Selected work" })).toBeVisible();
  await expect(page.getByRole("link", { name: "TBXxpert" })).toBeVisible();
  await context.close();
});

test("revalidation webhook rejects unsigned requests", async ({ request }) => {
  const response = await request.post("/api/revalidate", { data: { _type: "project" } });
  // 401 with a configured secret, 500 without one; never a successful revalidation.
  expect([401, 500]).toContain(response.status());
  expect((await response.json()).revalidated).toBe(false);
});

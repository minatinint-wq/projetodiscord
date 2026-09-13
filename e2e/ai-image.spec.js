import { expect, test } from "@playwright/test";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test.beforeEach(async ({ page }) => {
  const login = await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } });
  expect(login.ok()).toBeTruthy();
  await page.goto("/app");
});

test("resultado adulto nasce borrado e o olho revela apenas no cliente", async ({ page }) => {
  const created = await (await page.request.post("/api/servers", { data: { name: "Teste IA privada" } })).json();
  const channelId = created.server.channels[0].id;
  await page.reload();
  await page.getByTitle("Teste IA privada", { exact: true }).click();

  await page.route(`**/api/channels/${channelId}/messages`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ephemeral: true,
        message: {
          id: "ai-local-result",
          channelId,
          authorId: "ai-sesh",
          author: { id: "ai-sesh", username: "ia-sesh", displayName: "IA SESH", avatar: "/ai-sesh-avatar.png", badges: ["verificado"] },
          content: "Imagem NSFW gerada somente para você.",
          attachment: tinyPng,
          ai: { nsfw: true, ephemeral: true },
          createdAt: new Date().toISOString(),
          editedAt: null,
        },
      }),
    });
  });

  const composer = page.locator(".composer input:not([type=file])");
  await composer.fill('/imagensfw "adult boudoir editorial"');
  await page.locator(".send-button").click();

  const result = page.locator(".nsfw-attachment");
  await expect(result).toBeVisible();
  await expect(page.getByText("Conteúdo NSFW", { exact: true })).toBeVisible();
  await expect(page.locator(".ai-ghost-member")).toContainText("IA SESH");
  await expect(page.locator("article.message").filter({ hasText: "Imagem NSFW gerada somente para você." })).toContainText("APP");
  await expect(result.locator("img")).not.toHaveClass(/revealed/);

  await page.getByRole("button", { name: "Revelar imagem NSFW" }).click();
  await expect(result.locator("img")).toHaveClass(/revealed/);
  await expect(page.getByRole("button", { name: "Ocultar imagem NSFW" })).toBeVisible();
});

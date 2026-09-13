import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    data: { username: "demo", password: "demo123" },
  });
  expect(response.ok()).toBeTruthy();
});

test("menu de mensagem abre nos três pontos e executa reação, resposta e fixação", async ({ page }) => {
  const created = await (await page.request.post("/api/servers", {
    data: { name: "Menu de mensagens" },
  })).json();
  const channel = created.server.channels.find((item) => item.type === "text");
  const sent = await (await page.request.post(`/api/channels/${channel.id}/messages`, {
    data: { content: "Mensagem para testar ações" },
  })).json();

  await page.goto("/app");
  await page.getByTitle("Menu de mensagens", { exact: true }).click();
  const row = page.locator(`[data-message-id="${sent.message.id}"]`);
  await expect(row).toBeVisible();
  await row.hover();
  await row.getByRole("button", { name: "Opções da mensagem" }).click();

  const menu = page.getByRole("menu", { name: "Opções da mensagem" });
  await expect(menu).toBeVisible();
  await expect(menu.getByText("Responder", { exact: true })).toBeVisible();
  await expect(menu.getByRole("button", { name: /^Encaminhar/ })).toBeVisible();
  await expect(menu.getByText("Copiar texto", { exact: true })).toBeVisible();
  await expect(menu.getByText("Fixar mensagem", { exact: true })).toBeVisible();
  await expect(menu.getByText("Marcar como não lida", { exact: true })).toBeVisible();
  await expect(menu.getByText("Copiar link da mensagem", { exact: true })).toBeVisible();
  await expect(menu.getByText("Falar mensagem", { exact: true })).toBeVisible();
  await expect(menu.getByText("Editar mensagem", { exact: true })).toBeVisible();
  await expect(menu.getByText("Excluir mensagem", { exact: true })).toBeVisible();

  await menu.getByRole("button", { name: /👍/ }).click();
  await expect(row.locator(".reactions")).toContainText("👍 1");
  await page.keyboard.press("Escape");

  await row.hover();
  await row.getByRole("button", { name: "Opções da mensagem" }).click();
  await menu.getByText("Responder", { exact: true }).click();
  await expect(page.locator(".reply-composer-bar")).toContainText("Respondendo a");
  await page.locator(".composer input:not([type=file])").fill("Resposta pelo menu");
  await page.locator(".send-button").click();
  await expect(page.locator(".message-reference").last()).toContainText("Mensagem para testar ações");

  await row.hover();
  await row.getByRole("button", { name: "Opções da mensagem" }).click();
  const pinResponse = page.waitForResponse((response) =>
    response.url().includes(`/messages/${sent.message.id}`) &&
    response.request().method() === "PATCH",
  );
  await menu.getByText("Fixar mensagem", { exact: true }).click();
  const pinPayload = await (await pinResponse).json();
  expect(pinPayload.message.pinnedAt).toBeTruthy();
  await expect(row.locator(".message-pinned")).toBeVisible();
  await page.screenshot({ path: "test-results/message-actions.png", fullPage: true });

  await page.goto(`/app?server=${created.server.id}&channel=${channel.id}#message-${sent.message.id}`);
  await expect(page.locator(`[data-message-id="${sent.message.id}"]`)).toBeVisible();
});

test("menu de mensagem vira painel acessível no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const created = await (await page.request.post("/api/servers", {
    data: { name: "Menu mobile" },
  })).json();
  const channel = created.server.channels.find((item) => item.type === "text");
  const sent = await (await page.request.post(`/api/channels/${channel.id}/messages`, {
    data: { content: "Mensagem com ações no celular" },
  })).json();

  await page.goto("/app");
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByTitle("Menu mobile", { exact: true }).click();
  const row = page.locator(`[data-message-id="${sent.message.id}"]`);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Opções da mensagem" }).click();
  const menu = page.getByRole("menu", { name: "Opções da mensagem" });
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(7);
  expect(box.x + box.width).toBeLessThanOrEqual(383);
  expect(box.y + box.height).toBeLessThanOrEqual(837);
  await expect(menu.getByRole("button", { name: "Responder" })).toBeVisible();
  await page.screenshot({ path: "test-results/message-actions-mobile.png", fullPage: true });
});

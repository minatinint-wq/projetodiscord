import { test, expect } from "@playwright/test";

async function assertDocked(page) {
  const panel = page.locator(".user-panel");
  await expect(panel).toBeVisible();
  await expect.poll(async () => panel.evaluate(el =>
    Math.round(window.innerHeight - el.getBoundingClientRect().bottom)
  )).toBe(0);
  const box = await panel.boundingBox();
  expect(box.x).toBe(72);
  expect(Math.abs(box.width - 244)).toBeLessThanOrEqual(1);
  const scroll = page.locator(".channel-sidebar:not(.home-sidebar) .channel-scroll");
  if (await scroll.count()) {
    const listBox = await scroll.boundingBox();
    expect(listBox.y + listBox.height).toBeLessThanOrEqual(box.y);
  }
}

test("rodapé fica na base da lateral com rolagem, jogos e chamada", async ({ page }) => {
  await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } });
  await page.request.patch("/api/auth/me", { data: { gameInterests: [] } });
  const result = await (await page.request.post("/api/servers", { data: { name: "Layout do rodapé" } })).json();
  for (let i = 0; i < 18; i++)
    await page.request.post("/api/servers/" + result.server.id, { data: { name: "canal-" + i, type: "text" } });
  await page.goto("/app");
  await page.getByTitle("Layout do rodapé", { exact: true }).click();
  for (const viewport of [{ width: 900, height: 600 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await assertDocked(page);
    await page.locator(".channel-scroll").evaluate(el => { el.scrollTop = el.scrollHeight; });
    await assertDocked(page);
  }
  const games = await (await page.request.get("/api/games")).json();
  await page.request.patch("/api/auth/me", { data: { gameInterests: [games.games[0].id] } });
  await page.reload();
  await page.getByTitle("Layout do rodapé", { exact: true }).click();
  await expect(page.locator(".favorite-game-activity")).toBeVisible();
  await assertDocked(page);
  const gameBox = await page.locator(".favorite-game-activity").boundingBox();
  const userBox = await page.locator(".user-panel").boundingBox();
  expect(Math.abs(gameBox.y + gameBox.height - userBox.y)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "call da comunidade", exact: true }).dblclick();
  await expect(page.locator(".voice-status")).toContainText("Voz conectada");
  await expect(page.locator(".favorite-game-activity")).toHaveCount(0);
  await assertDocked(page);
  const voiceBox = await page.locator(".voice-status").boundingBox();
  expect(voiceBox.y + voiceBox.height).toBeLessThanOrEqual((await page.locator(".user-panel").boundingBox()).y);
  await page.screenshot({ path: "test-results/sidebar-voice.png" });
  await page.getByTitle("Desconectar da chamada", { exact: true }).click();
  await page.getByTitle("Início", { exact: true }).click();
  await assertDocked(page);
  await page.getByTitle("Configurações", { exact: true }).click();
  await expect(page.locator(".settings-hub")).toBeVisible();
  expect(await page.locator(".user-panel").evaluate(el => {
    const r = el.getBoundingClientRect();
    return Boolean(document.elementFromPoint(r.x + 10, r.y + 10)?.closest(".user-panel"));
  })).toBe(false);
});

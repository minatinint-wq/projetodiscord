import { expect, test } from "@playwright/test";

test("loja, personalização e instalador adaptativo ficam disponíveis", async ({ page }) => {
  const login = await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } });
  expect(login.ok()).toBeTruthy();
  await page.goto("/app?view=store");
  await expect(page.getByRole("main", { name: "Loja Sesh" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aurora Arcana" })).toBeVisible();
  await expect(page.locator(".store-product-card").first()).toBeVisible();
  await page.locator(".store-product-card").first().locator(".store-product-main").click();
  await page.getByRole("button", { name: "Comprar em breve" }).click();
  await expect(page.locator(".store-notice")).toContainText("nenhum valor");

  const appearance = await page.request.patch("/api/auth/me", { data: { banner: null, bannerPreset: "none", preferences: { appTheme: "midnight", appSurfaceColor: "#121826", appAccentColor: "#ff4d8d", appBackgroundStrength: 75 } } });
  expect(appearance.ok()).toBeTruthy();
  await page.reload();
  await expect(page.locator(".app-shell")).toHaveClass(/theme-midnight/);
  await expect(page.locator(".app-shell")).toHaveCSS("--accent", "#ff4d8d");

  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).display).toBe("standalone");
  await page.goto("/install.html");
  await expect(page.getByRole("heading", { name: "Sesh Desktop para Windows" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Baixar Sesh Desktop" })).toHaveAttribute("href", /v1\.3\.0/);
});

test("DM inicia chamada privada e o amigo recebe o convite", async ({ browser, page }) => {
  const suffix = Date.now().toString(36).slice(-6);
  const friendName = `Call ${suffix}`;
  const friend = await browser.newContext();
  const registration = await friend.request.post("/api/auth/register", { data: { username: `call_${suffix}`, displayName: friendName, email: `call-${suffix}@sesh.test`, password: "Call-test-2026!" } });
  expect(registration.status()).toBe(201);
  const friendUser = (await registration.json()).user;
  expect((await friend.request.post("/api/friends", { data: { username: "demo" } })).status()).toBe(201);

  const ownerLogin = await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } });
  expect(ownerLogin.ok()).toBeTruthy();
  expect((await page.request.post("/api/friends", { data: { username: friendUser.publicId } })).ok()).toBeTruthy();
  const friendPage = await friend.newPage();
  try {
    await friendPage.goto("/app");
    await page.goto("/app");
    await page.locator(".home-dm-row").filter({ hasText: friendName }).click();
    await page.getByTitle("Iniciar chamada privada").click();
    const invite = friendPage.getByRole("dialog", { name: "Convite para chamada privada" });
    await expect(invite).toBeVisible();
    await invite.getByRole("button", { name: "Atender" }).click();
    await expect(page.locator(".direct-call-strip")).toContainText("2 conectados");
    await expect(friendPage.getByRole("region", { name: "Chamada privada ativa" })).toContainText("2 conectados");
    await friendPage.locator(".private-call-dock .danger").click();
    await page.locator(".direct-call-controls .danger").click();
  } finally {
    await friend.close();
  }
});

test("cria grupo de DM, envia mensagem e oferece chamada do grupo", async ({ browser, page }) => {
  const suffix = Date.now().toString(36).slice(-6);
  const contexts = [await browser.newContext(), await browser.newContext()];
  const people = [];
  try {
    for (let index = 0; index < contexts.length; index += 1) {
      const response = await contexts[index].request.post("/api/auth/register", { data: { username: `group_${index}_${suffix}`, displayName: `Grupo Pessoa ${index + 1} ${suffix}`, email: `group-${index}-${suffix}@sesh.test`, password: "Group-test-2026!" } });
      expect(response.status()).toBe(201);
      people.push((await response.json()).user);
      expect((await contexts[index].request.post("/api/friends", { data: { username: "demo" } })).status()).toBe(201);
    }
    expect((await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } })).ok()).toBeTruthy();
    for (const person of people) expect((await page.request.post("/api/friends", { data: { username: person.publicId } })).ok()).toBeTruthy();
    await page.goto("/app");
    await page.getByTitle("Criar grupo de DM").click();
    const modal = page.getByRole("dialog", { name: "Criar grupo de DM" });
    await modal.getByLabel("Nome do grupo").fill("Esquadrão Sesh");
    for (const person of people) await modal.locator("label").filter({ hasText: person.displayName }).getByRole("checkbox").check();
    await modal.getByRole("button", { name: "Criar grupo" }).click();
    await expect(page.locator(".group-direct-conversation")).toContainText("Esquadrão Sesh");
    await page.getByPlaceholder("Conversar em Esquadrão Sesh").fill("Olá, grupo!");
    await page.locator(".group-direct-conversation").getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.locator(".group-direct-conversation .dm-message").last()).toContainText("Olá, grupo!");
    await expect(page.getByTitle("Iniciar chamada do grupo")).toBeVisible();
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});

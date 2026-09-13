import { expect, test } from "@playwright/test";

async function expectWithinViewport(page, locator) {
  const viewport = page.viewportSize();
  await expect.poll(async () => {
    const box = await locator.boundingBox();
    if (!box) return false;
    return (
      box.x >= -1 &&
      box.y >= -1 &&
      box.x + box.width <= viewport.width + 1 &&
      box.y + box.height <= viewport.height + 1
    );
  }).toBe(true);
}

async function expectNoHorizontalOverflow(locator) {
  const size = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth + 1);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const login = await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } });
  expect(login.ok()).toBeTruthy();
  await page.goto("/app");
});

test("navegação e membros funcionam como gavetas no celular", async ({ page }) => {
  const header = page.locator(".mobile-header");
  await expect(header).toBeVisible();
  await expectWithinViewport(page, header);

  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await expectWithinViewport(page, page.locator(".channel-sidebar.home-sidebar"));
  await expectWithinViewport(page, page.locator(".app-shell > .user-panel"));
  await page.screenshot({ path: "test-results/mobile-home-navigation.png", fullPage: true });
  await page.locator(".mobile-drawer-backdrop.nav-backdrop").click({ position: { x: 380, y: 100 } });

  await page.getByRole("button", { name: "Abrir membros" }).click();
  await expectWithinViewport(page, page.locator(".active-now-sidebar"));
  await page.locator(".mobile-drawer-backdrop.member-backdrop").click({ position: { x: 10, y: 100 } });

  await expectNoHorizontalOverflow(page.locator(".main-content"));
  await expectNoHorizontalOverflow(page.locator(".friends-area"));
});

test("chat, membros e configurações de servidor cabem em 390px", async ({ page }) => {
  const created = await (await page.request.post("/api/servers", { data: { name: "Mobile responsivo" } })).json();
  await page.reload();
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByTitle("Mobile responsivo", { exact: true }).click();

  const composer = page.locator(".composer input:not([type=file])");
  await composer.fill("Mensagem longa para validar que o chat não ultrapassa a largura disponível no celular ".repeat(3));
  await page.locator(".send-button").click();
  await expect(page.locator("article.message").last()).toContainText("Mensagem longa");
  await expectNoHorizontalOverflow(page.locator(".chat-area"));
  await expectWithinViewport(page, page.locator(".composer"));

  await page.getByRole("button", { name: "Abrir membros" }).click();
  await expectWithinViewport(page, page.locator(".member-sidebar.mobile-open"));
  await page.locator(".mobile-drawer-backdrop.member-backdrop").click({ position: { x: 10, y: 100 } });

  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByTitle("Configurações do servidor", { exact: true }).click();
  const settings = page.locator(".server-settings-workspace");
  await expect(settings).toBeVisible();
  await expectWithinViewport(page, settings);
  await expectNoHorizontalOverflow(page.locator(".server-settings-content"));

  await page.getByRole("button", { name: "Cargos", exact: true }).click();
  await page.getByRole("button", { name: "Criar cargo", exact: true }).click();
  const roleEditor = page.locator(".role-config-modal");
  await expectWithinViewport(page, roleEditor);
  await roleEditor.getByLabel("Nome do cargo", { exact: true }).fill("Cargo mobile");
  await roleEditor.getByRole("button", { name: "Salvar cargo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arrastar cargo Cargo mobile" })).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-server-settings.png", fullPage: true });
});

test("configurações pessoais e editor de perfil viram layout vertical", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.locator(".app-shell > .user-panel").getByTitle("Configurações", { exact: true }).click();

  const settings = page.getByRole("dialog", { name: "Configurações", exact: true });
  await expectWithinViewport(page, settings);
  const settingsNav = settings.locator(".settings-hub-nav");
  const settingsMainBox = await settings.locator(".settings-hub-main").boundingBox();
  expect(settingsMainBox.width).toBeGreaterThanOrEqual(360);
  const settingsNavBox = await settingsNav.boundingBox();
  expect(settingsNavBox.height).toBeLessThanOrEqual(70);
  await expectNoHorizontalOverflow(settings.locator(".settings-hub-main"));

  await settings.getByRole("button", { name: "Editar perfil e conta", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Editar perfil", exact: true });
  await expectWithinViewport(page, editor);
  const editorNavBox = await editor.locator(".profile-editor-nav").boundingBox();
  expect(editorNavBox.height).toBeLessThanOrEqual(70);
  const editorMainBox = await editor.locator(".profile-editor-main").boundingBox();
  expect(editorMainBox.width).toBeGreaterThanOrEqual(360);
  await expectNoHorizontalOverflow(editor.locator(".profile-editor-main"));
  await page.screenshot({ path: "test-results/mobile-profile-editor.png", fullPage: true });
});

test("página pública rola e cabe no celular", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".landing-page")).toBeVisible();
  await expectNoHorizontalOverflow(page.locator("html"));
  const product = page.locator(".landing-product");
  await product.scrollIntoViewIfNeeded();
  const productBox = await product.boundingBox();
  expect(productBox.x).toBeGreaterThanOrEqual(-1);
  expect(productBox.x + productBox.width).toBeLessThanOrEqual(391);
  expect(productBox.width).toBeGreaterThan(300);
  await page.locator(".landing-footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".landing-footer")).toBeVisible();
  expect(await page.locator(".landing-page").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/mobile-landing.png", fullPage: true });
});

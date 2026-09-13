import { expect, test } from "@playwright/test";

test("cadastro mobile orienta o usuário e funciona sem AbortSignal.timeout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(globalThis.AbortSignal, "timeout", { value: undefined, configurable: true });
  });
  await page.goto("/app");
  await page.getByRole("button", { name: "Criar uma conta" }).click();

  await expect(page.getByText("Nome de usuário", { exact: true })).toBeVisible();
  await page.getByLabel("Nome de exibição").fill("Conta iPhone");
  await page.getByLabel("Nome de usuário").fill("conta@example.com");
  await page.getByLabel("E-mail", { exact: true }).fill("short@sesh.test");
  await page.getByLabel("Senha", { exact: true }).fill("teste1234");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("sem @");

  await page.getByLabel("Nome de usuário").fill("abc");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.locator(".app-shell")).toBeVisible();
});

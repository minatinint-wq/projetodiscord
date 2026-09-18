import { expect, test } from "@playwright/test";

test("pedido recebido aparece na aba Pendente e pode ser aceito", async ({
  browser,
  page,
}) => {
  const suffix = Date.now().toString(36).slice(-6);
  const senderName = `Friend ${suffix}`;
  const sender = await browser.newContext();
  try {
    const registration = await sender.request.post("/api/auth/register", {
      data: {
        username: `friend_${suffix}`,
        displayName: senderName,
        email: `friend-sender-${suffix}@sesh.test`,
        password: "Friend-test-2026!",
      },
    });
    expect(registration.status()).toBe(201);

    const invitation = await sender.request.post("/api/friends", {
      data: { username: "demo" },
    });
    expect(invitation.status()).toBe(201);

    const login = await page.request.post("/api/auth/login", {
      data: { username: "demo", password: "demo123" },
    });
    expect(login.ok()).toBeTruthy();
    await page.goto("/app");

    const pendingTab = page.getByRole("button", { name: /Pendente/ });
    await expect(pendingTab.locator(".pending-count")).toHaveText("1");
    await pendingTab.click();

    const requestRow = page.locator(".friend-row").filter({
      hasText: senderName,
    });
    await expect(requestRow).toContainText("Solicitação recebida");
    await expect(requestRow.getByTitle("Aceitar")).toBeVisible();
    await requestRow.getByTitle("Aceitar").click();

    await expect(requestRow).toHaveCount(0);
    await expect(pendingTab.locator(".pending-count")).toHaveCount(0);
    await page.getByRole("button", { name: "Todos", exact: true }).click();
    await expect(
      page.locator(".friend-row").filter({ hasText: senderName }),
    ).toBeVisible();
  } finally {
    await sender.close();
  }
});

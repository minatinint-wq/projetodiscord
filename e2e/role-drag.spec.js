import { expect, test } from "@playwright/test";

test("arrastar cargos salva a hierarquia e reorganiza a lateral", async ({ page, browser }) => {
  await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } });
  const created = await (await page.request.post("/api/servers", { data: { name: "Hierarquia por arraste" } })).json();
  const suffix = Date.now().toString(36);
  const peer = await browser.newContext();

  try {
    const registration = await peer.request.post("http://127.0.0.1:34170/api/auth/register", {
      data: {
        username: "drag" + suffix,
        email: "drag" + suffix + "@sesh.test",
        password: "Roles-Test-9753",
        displayName: "Membro arrastado",
      },
    });
    expect(registration.ok()).toBeTruthy();
    const peerUser = (await registration.json()).user;
    expect((await peer.request.post("http://127.0.0.1:34170/api/servers/" + created.server.inviteCode + "/join", { data: {} })).ok()).toBeTruthy();

    await page.goto("/app");
    await page.getByTitle("Hierarquia por arraste", { exact: true }).click();
    await page.getByTitle("Configurações do servidor", { exact: true }).click();
    await page.getByRole("button", { name: "Cargos", exact: true }).click();

    async function createSeparatedRole(name) {
      await page.getByRole("button", { name: "Criar cargo", exact: true }).click();
      const editor = page.locator(".role-config-modal");
      await editor.getByLabel("Nome do cargo", { exact: true }).fill(name);
      await editor.getByLabel("Separar membros deste cargo").check();
      await editor.getByRole("button", { name: "Salvar cargo", exact: true }).click();
      await expect(page.locator(".settings-role-item").filter({ hasText: name })).toBeVisible();
    }

    await createSeparatedRole("Topo");
    await createSeparatedRole("Base");

    const topRow = page.locator(".settings-role-item").filter({ hasText: "Topo" });
    const baseRow = page.locator(".settings-role-item").filter({ hasText: "Base" });
    await baseRow.getByRole("button", { name: "Arrastar cargo Base" }).dragTo(topRow, {
      targetPosition: { x: 20, y: 2 },
    });
    await expect(page.locator(".settings-role-item:not(.default-role) .settings-role-main strong")).toHaveText(["Base", "Topo"]);

    await page.getByRole("button", { name: "Salvar cargos", exact: true }).click();
    await expect(page.getByText("Cargos salvos.", { exact: true })).toBeVisible();

    const hierarchy = await (await page.request.get("/api/servers/" + created.server.id)).json();
    const customRoles = hierarchy.server.roles.filter((role) => !["owner", "member"].includes(role.id));
    expect(customRoles.map((role) => role.name)).toEqual(["Base", "Topo"]);
    const baseRole = customRoles[0];
    const topRole = customRoles[1];

    await page.getByRole("button", { name: "Membros", exact: true }).click();
    await page.locator('.server-role-member[data-member-id="' + created.server.ownerId + '"] select').selectOption(baseRole.id);
    await page.locator('.server-role-member[data-member-id="' + peerUser.id + '"] select').selectOption(topRole.id);
    await page.getByRole("button", { name: "Salvar membros", exact: true }).click();
    await expect(page.getByText("Membros atualizados.", { exact: true })).toBeVisible();
    await page.getByLabel("Fechar configurações", { exact: true }).click();

    const visibleRoleOrder = await page.locator(".member-sidebar .member-role-group[data-role-id]").evaluateAll(
      (groups) => groups.map((group) => group.dataset.roleId),
    );
    expect(visibleRoleOrder.slice(0, 2)).toEqual([baseRole.id, topRole.id]);
    await expect(page.locator('.member-role-group[data-role-id="' + baseRole.id + '"] .member').first()).toHaveAttribute("data-member-id", created.server.ownerId);
    await expect(page.locator('.member-role-group[data-role-id="' + topRole.id + '"] .member').first()).toHaveAttribute("data-member-id", peerUser.id);
  } finally {
    await peer.close();
  }
});

import { test, expect } from "@playwright/test"

const base = "http://127.0.0.1:34170"

test("Nitro aplica banner, moldura e sobreposição premium com animações internas", async ({ page, browser }) => {
  const registered = await page.request.post("/api/auth/register", {
    data: { username: "premiumvisual", email: "premiumvisual@sesh.test", password: "test1234", displayName: "Visual Premium" },
  })
  const member = (await registered.json()).user
  const admin = await browser.newContext()
  try {
    await admin.request.post(base + "/api/auth/login", { data: { username: "browser-admin@sesh.test", password: "browser-admin-test-only" } })
    expect((await admin.request.patch(base + "/api/users/" + member.id + "/badges", { data: { badges: ["nitro_classic"] } })).ok()).toBeTruthy()
    await page.goto("/app")
    await page.getByTitle("Configurações", { exact: true }).click()
    await page.getByRole("button", { name: "Editar perfil e conta" }).click()
    const editor = page.getByRole("dialog", { name: "Editar perfil", exact: true })
    await editor.getByRole("button", { name: "Efeitos e estilo", exact: true }).click()
    await editor.locator(".settings-card").filter({ hasText: "Sobreposições do perfil" }).getByRole("button", { name: "Lobo de aço", exact: true }).click()
    await editor.locator(".settings-card").filter({ hasText: "Molduras de avatar" }).locator(".studio-choice").filter({ hasText: "Lobo de aço" }).click()
    await expect(editor.locator(".profile-editor-preview .premium-overlay-steel-wolf .premium-overlay-particles i")).toHaveCount(12)
    await expect(editor.locator(".profile-editor-preview .premium-avatar-energy-steel-wolf i").first()).toBeVisible()
    await editor.getByRole("button", { name: "Perfil", exact: true }).click()
    await editor.getByLabel("Banner Lobo de aço", { exact: true }).click()
    await expect(editor.locator(".profile-editor-preview .identity-banner.premium-banner-steel-wolf .premium-banner-atmosphere i")).toHaveCount(12)
    await editor.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(editor.getByRole("status")).toContainText("Tudo salvo")
    const saved = (await (await page.request.get("/api/auth/me")).json()).user
    expect(saved.avatarFrame).toBe("steel-wolf")
    expect(saved.profileOverlay).toBe("steel-wolf")
    expect(saved.bannerPreset).toBe("steel-wolf")
  } finally {
    await admin.close()
  }
})

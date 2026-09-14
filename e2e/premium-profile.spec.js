import { test, expect } from "@playwright/test"

const base = "http://127.0.0.1:34170"

test("Nitro aplica banner, moldura e sobreposição premium com animações internas", async ({ page, browser }) => {
  const registered = await page.request.post("/api/auth/register", {
    data: { username: "premiumvisual", email: "premiumvisual@sesh.test", password: "Visual-975310", displayName: "Visual Premium" },
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
    await editor.locator(".settings-card").filter({ hasText: "Molduras de avatar" }).locator(".studio-choice").filter({ hasText: "Glitch" }).click()
    const overlayMotion=editor.locator(".profile-editor-preview .premium-overlay-steel-wolf .premium-overlay-motion")
    await expect(overlayMotion).toBeVisible()
    await expect(overlayMotion).toHaveAttribute("data-animated-cosmetic",/cosmetics-animated\/overlays\/steel-wolf\.sprite\.webp\?v=6$/)
    const avatarMotion=editor.locator(".profile-editor-preview .premium-avatar-frame-scene-glitch .premium-avatar-frame-apng")
    await expect(avatarMotion).toBeVisible()
    await expect(avatarMotion).toHaveAttribute("src",/cosmetics-animated\/frames\/glitch\.png\?v=7$/)
    await editor.getByRole("button", { name: "Perfil", exact: true }).click()
    await editor.getByLabel("Banner Lobo de aço", { exact: true }).click()
    const bannerMotion=editor.locator(".profile-editor-preview .identity-banner.premium-banner-steel-wolf .premium-banner-motion")
    await expect(bannerMotion).toBeVisible()
    await expect(bannerMotion).toHaveAttribute("data-animated-cosmetic",/cosmetics-animated\/banners\/steel-wolf\.sprite\.webp\?v=6$/)
    await editor.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(editor.getByRole("status")).toContainText("Tudo salvo")
    const saved = (await (await page.request.get("/api/auth/me")).json()).user
    expect(saved.avatarFrame).toBe("glitch")
    expect(saved.profileOverlay).toBe("steel-wolf")
    expect(saved.bannerPreset).toBe("steel-wolf")
  } finally {
    await admin.close()
  }
})

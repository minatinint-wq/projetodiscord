import { test, expect } from "@playwright/test";
import { PROFILE_FRAMES } from "../profile-frames.js";

test.describe("auditoria visual das molduras de perfil", () => {
  test.skip(process.env.SESH_AUDIT_PROFILE_FRAMES !== "1", "Executada apenas durante a revisão visual do catálogo");

  test("renderiza cada moldura no perfil simulado", async ({ page, browser }) => {
    test.setTimeout(300_000);
    const nonce = String(Date.now()).slice(-8);
    const registered = await page.request.post("/api/auth/register", { data: {
      username: `frameaudit${nonce}`,
      email: `frameaudit${nonce}@sesh.test`,
      password: "Frame-Audit-9753",
      displayName: "Auditoria de Moldura",
    }});
    expect(registered.ok()).toBeTruthy();
    const member = (await registered.json()).user;
    const admin = await browser.newContext();

    try {
      await admin.request.post("http://127.0.0.1:34170/api/auth/login", { data: {
        username: "browser-admin@sesh.test",
        password: "browser-admin-test-only",
      }});
      expect((await admin.request.patch(`http://127.0.0.1:34170/api/users/${member.id}/badges`, {
        data: { badges: ["nitro_classic"] },
      })).ok()).toBeTruthy();

      await page.goto("/app");
      await page.getByTitle("Configurações", { exact: true }).click();
      await page.getByRole("button", { name: "Editar perfil e conta" }).click();
      const editor = page.getByRole("dialog", { name: "Editar perfil", exact: true });
      await editor.getByRole("button", { name: "Artes animadas", exact: true }).click();
      const frameSettings = editor.locator(".settings-card.profile-art-settings").nth(1);
      const preview = editor.locator(".profile-editor-preview");
      await preview.evaluate((node) => {
        const label = document.createElement("strong");
        label.id = "profile-frame-audit-label";
        label.style.cssText = "position:relative;z-index:30;display:block;margin-bottom:8px;color:#fff;font:700 18px sans-serif";
        node.prepend(label);
      });

      let index = 0;
      for (const [id, label] of PROFILE_FRAMES.slice(1)) {
        index += 1;
        await frameSettings.getByPlaceholder(/Buscar entre .* molduras/).fill(label);
        await frameSettings.getByTitle(label, { exact: true }).click();
        await preview.locator("#profile-frame-audit-label").evaluate((node, text) => { node.textContent = text; }, `${index}. ${label}`);
        const images = preview.locator(".profile-frame-layer");
        await expect(images.first()).toBeVisible();
        await images.evaluateAll((nodes) => Promise.all(nodes.map((image) => image.complete
          ? undefined
          : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 2500);
          }))));
        await preview.screenshot({ path: `test-results/profile-frame-audit/${String(index).padStart(3, "0")}.png` });
      }
    } finally {
      await admin.close();
    }
  });
});

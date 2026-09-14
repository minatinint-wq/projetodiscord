import {test,expect} from "@playwright/test";
const base="http://127.0.0.1:34170";
test("sobreposição e cores aparecem na prévia e no perfil após salvar",async({page,browser})=>{
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const login=await page.request.post("/api/auth/login",{data:{username:"demo",password:"demo123"}});
 const member=(await login.json()).user;
 const admin=await browser.newContext();
 try{
 await admin.request.post(base+"/api/auth/login",{data:{username:"browser-admin@sesh.test",password:"browser-admin-test-only"}});
 expect((await admin.request.patch(base+"/api/users/"+member.id+"/badges",{data:{badges:["nitro_classic"]}})).ok()).toBeTruthy();
 await page.goto("/app");await page.getByTitle("Configurações",{exact:true}).click();await page.getByRole("button",{name:"Editar perfil e conta"}).click();
 const editor=page.getByRole("dialog",{name:"Editar perfil",exact:true});
 await editor.getByRole("button",{name:"Efeitos e estilo",exact:true}).click();
 await editor.getByRole("button",{name:"Órbita lunar",exact:true}).click();
 await editor.getByLabel("Cor de fundo",{exact:true}).fill("#080c30");
 await editor.getByLabel("Cor de destaque",{exact:true}).fill("#81bcff");
 await expect(editor.locator(".identity-card .premium-overlay-lunar-orbit")).toBeVisible();
 await editor.getByRole("button",{name:"Salvar alterações"}).click();await expect(editor.getByRole("status")).toContainText("Tudo salvo");
 await editor.getByLabel("Fechar perfil",{exact:true}).click();
 await page.getByTitle("Abrir meu perfil",{exact:true}).click();await page.getByRole("button",{name:"Ver perfil completo"}).click();
 await expect(page.locator(".identity-dialog>.premium-overlay-lunar-orbit")).toBeVisible();
 await expect(page.locator(".identity-dialog")).toHaveCSS("--profile-surface","#080c30");
 await expect(page.locator(".identity-dialog")).toHaveCSS("--profile-accent","#81bcff");
 await page.screenshot({path:"test-results/profile-overlay.png"});
 expect(errors).toEqual([]);
 }finally{await admin.close();}
});

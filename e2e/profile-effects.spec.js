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

test("efeito fica recortado no cartão e moldura extrapola o perfil",async({page,browser})=>{
 test.setTimeout(60000);
 const registered=await page.request.post("/api/auth/register",{data:{username:"profileframe",email:"profileframe@sesh.test",password:"Profile-Frame-9753",displayName:"Teste de Moldura"}});
 const member=(await registered.json()).user;
 const admin=await browser.newContext();
 try{
  await admin.request.post(base+"/api/auth/login",{data:{username:"browser-admin@sesh.test",password:"browser-admin-test-only"}});
  expect((await admin.request.patch(base+"/api/users/"+member.id+"/badges",{data:{badges:["nitro_classic"]}})).ok()).toBeTruthy();
  await page.goto("/app");
  await page.getByTitle("Configurações",{exact:true}).click();
  await page.getByRole("button",{name:"Editar perfil e conta"}).click();
  const editor=page.getByRole("dialog",{name:"Editar perfil",exact:true});
  await editor.getByRole("button",{name:"Artes animadas",exact:true}).click();
  const effectSettings=editor.locator(".settings-card.profile-art-settings").nth(0);
  await effectSettings.getByPlaceholder(/Buscar entre .* efeitos/).fill("Golfinhos Dançantes");
  await effectSettings.getByRole("button",{name:/Golfinhos Dançantes/}).click();
  const frameSettings=editor.locator(".settings-card.profile-art-settings").nth(1);
  await frameSettings.getByPlaceholder(/Buscar entre .* molduras/).fill("Coelhinho de Morango");
  await frameSettings.getByRole("button",{name:/Coelhinho de Morango/}).click();
  const card=editor.locator(".profile-editor-preview .identity-card");
  const art=card.locator(":scope > .profile-art-effect");
  const frame=card.locator(":scope > .profile-frame-effect");
  await expect(art).toBeVisible();
  await expect(frame).toBeVisible();
  const boxes=await Promise.all([card.boundingBox(),art.boundingBox(),frame.boundingBox()]);
  const [cardBox,artBox,frameBox]=boxes;
  expect(Math.abs(artBox.x-cardBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(artBox.width-cardBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(artBox.height-cardBox.height)).toBeLessThanOrEqual(2);
  await expect(art).toHaveCSS("overflow","hidden");
  expect(frameBox.x).toBeLessThanOrEqual(cardBox.x-29);
  expect(frameBox.y).toBeLessThanOrEqual(cardBox.y-29);
  expect(frameBox.width).toBeGreaterThanOrEqual(cardBox.width+58);
  expect(frameBox.height).toBeGreaterThanOrEqual(cardBox.height+58);
  await editor.getByRole("button",{name:"Salvar alterações"}).click();
  await expect(editor.getByRole("status")).toContainText("Tudo salvo");
  await editor.getByLabel("Fechar perfil",{exact:true}).click();
  await page.getByTitle("Abrir meu perfil",{exact:true}).click();
  const quick=page.locator(".quick-profile");
  const quickCard=quick.locator(".identity-card");
  const quickFrame=quickCard.locator(":scope > .profile-frame-effect");
  const [quickBox,quickCardBox,quickFrameBox]=await Promise.all([quick.boundingBox(),quickCard.boundingBox(),quickFrame.boundingBox()]);
  expect(quickFrameBox.x).toBeLessThanOrEqual(quickCardBox.x-29);
  expect(quickFrameBox.x).toBeGreaterThanOrEqual(quickBox.x-1);
  expect(quickFrameBox.x+quickFrameBox.width).toBeLessThanOrEqual(quickBox.x+quickBox.width+1);
  await page.screenshot({path:"test-results/profile-frame-overflow.png"});
 }finally{await admin.close();}
});

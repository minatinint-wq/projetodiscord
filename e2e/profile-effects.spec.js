import {test,expect} from "@playwright/test";
import {profileFrameLayout} from "../profile-frames.js";
const base="http://127.0.0.1:34170";

function expectOfficialTopGeometry(cardBox,layerBox,id){
 const layout=profileFrameLayout(id);
 const scale=cardBox.width/layout.containerWidth;
 expect(Math.abs(layerBox.x-(cardBox.x-layout.overflowHorizontal*scale))).toBeLessThanOrEqual(3);
 expect(Math.abs(layerBox.width-(cardBox.width+(layout.overflowHorizontal*2*scale)))).toBeLessThanOrEqual(3);
 expect(Math.abs(layerBox.y-(cardBox.y-layout.overflowTop*scale))).toBeLessThanOrEqual(3);
}

async function waitForFrameImages(frame){
 const images=frame.locator(".profile-frame-layer");
 await images.evaluateAll(nodes=>Promise.all(nodes.map(image=>image.complete&&image.naturalWidth>0?undefined:new Promise(resolve=>{
  image.addEventListener("load",resolve,{once:true});
  image.addEventListener("error",resolve,{once:true});
  setTimeout(resolve,12000);
 }))));
 await expect.poll(()=>images.evaluateAll(nodes=>nodes.every(image=>image.complete&&image.naturalWidth>0)),{timeout:15000}).toBe(true);
}
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
 const previewOverlay=editor.locator(".profile-editor-preview .identity-card>.premium-overlay-lunar-orbit");
 const previewBody=editor.locator(".profile-editor-preview .identity-card>.identity-card-body");
 expect(Number(await previewOverlay.evaluate(element=>getComputedStyle(element).zIndex))).toBeGreaterThan(Number(await previewBody.evaluate(element=>getComputedStyle(element).zIndex)));
 await editor.getByRole("button",{name:"Salvar alterações"}).click();await expect(editor).toBeHidden();
 await page.getByTitle("Abrir meu perfil",{exact:true}).click();
 const quickOverlay=page.locator(".quick-profile .identity-card>.premium-overlay-lunar-orbit");
 const quickBody=page.locator(".quick-profile .identity-card>.identity-card-body");
 await expect(quickOverlay).toBeVisible();
 expect(Number(await quickOverlay.evaluate(element=>getComputedStyle(element).zIndex))).toBeGreaterThan(Number(await quickBody.evaluate(element=>getComputedStyle(element).zIndex)));
 await page.getByRole("button",{name:"Ver perfil completo"}).click();
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
  await frameSettings.getByPlaceholder(/Buscar entre .* molduras/).fill("Cristais (Ametista)");
  await frameSettings.getByRole("button",{name:/Cristais \(Ametista\)/}).click();
  const card=editor.locator(".profile-editor-preview .identity-card");
  const art=card.locator(":scope > .profile-art-effect");
  const frame=card.locator(":scope > .profile-frame-effect");
  const frameTop=frame.locator('.profile-frame-layer[data-edge="top"]').first();
  await expect(art).toBeVisible();
  await expect(frame).toBeVisible();
  await waitForFrameImages(frame);
  await expect(frameTop).toBeVisible();
  const boxes=await Promise.all([card.boundingBox(),art.boundingBox(),frameTop.boundingBox()]);
  const [cardBox,artBox,frameTopBox]=boxes;
  expect(Math.abs(artBox.x-cardBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(artBox.width-cardBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(artBox.height-cardBox.height)).toBeLessThanOrEqual(2);
  await expect(art).toHaveCSS("overflow","hidden");
  expect(frameTopBox.x).toBeLessThan(cardBox.x);
  expect(frameTopBox.y).toBeLessThanOrEqual(cardBox.y-17);
  expectOfficialTopGeometry(cardBox,frameTopBox,"crystals-amethyst");
  await expect(frameTop).toHaveAttribute("data-role","front");
  await frameSettings.getByPlaceholder(/Buscar entre .* molduras/).fill("Rosas Sombrias (Branco)");
  await frameSettings.getByRole("button",{name:/Rosas Sombrias \(Branco\)/}).click();
  await waitForFrameImages(frame);
  const roseFrameTop=card.locator(':scope > .profile-frame-effect .profile-frame-layer[data-edge="top"]').first();
  const [roseCardBox,roseFrameTopBox]=await Promise.all([card.boundingBox(),roseFrameTop.boundingBox()]);
  expectOfficialTopGeometry(roseCardBox,roseFrameTopBox,"dark-roses-white");
  await frameSettings.getByPlaceholder(/Buscar entre .* molduras/).fill("Senhor dos Mortos (Azul)");
  await frameSettings.getByRole("button",{name:/Senhor dos Mortos \(Azul\)/}).click();
  await waitForFrameImages(frame);
  const fireFrameTop=card.locator(':scope > .profile-frame-effect .profile-frame-layer[data-edge="top"]').first();
  const [fireCardBox,fireFrameTopBox]=await Promise.all([card.boundingBox(),fireFrameTop.boundingBox()]);
  expectOfficialTopGeometry(fireCardBox,fireFrameTopBox,"lord-of-dead-blue");
  const fireBackBottom=card.locator(':scope > .profile-frame-effect .profile-frame-layer[data-role="back"][data-edge="bottom"]');
  await expect(fireBackBottom).toBeVisible();
  const cardBody=card.locator(":scope > .identity-card-body");
  expect(Number(await fireBackBottom.evaluate(element=>getComputedStyle(element).zIndex))).toBeGreaterThan(Number(await cardBody.evaluate(element=>getComputedStyle(element).zIndex)));
  const fireBottomBox=await fireBackBottom.boundingBox();
  const fireLayout=profileFrameLayout("lord-of-dead-blue");
  const fireScale=fireCardBox.width/fireLayout.containerWidth;
  expect(Math.abs((fireBottomBox.y+fireBottomBox.height)-(fireCardBox.y+fireCardBox.height+fireLayout.overflowBottom*fireScale))).toBeLessThanOrEqual(2);
  await editor.getByRole("button",{name:"Salvar alterações"}).click();
  await expect(editor).toBeHidden();
  await page.getByTitle("Abrir meu perfil",{exact:true}).click();
  const quick=page.locator(".quick-profile");
  const quickCard=quick.locator(".identity-card");
  const quickFrameTop=quickCard.locator(':scope > .profile-frame-effect .profile-frame-layer[data-edge="top"]').first();
  const [quickBox,quickCardBox,quickFrameTopBox]=await Promise.all([quick.boundingBox(),quickCard.boundingBox(),quickFrameTop.boundingBox()]);
  expectOfficialTopGeometry(quickCardBox,quickFrameTopBox,"lord-of-dead-blue");
  expect(quickFrameTopBox.x).toBeGreaterThanOrEqual(quickBox.x-1);
  expect(quickFrameTopBox.x+quickFrameTopBox.width).toBeLessThanOrEqual(quickBox.x+quickBox.width+1);
  await page.screenshot({path:"test-results/profile-frame-overflow.png"});
 }finally{await admin.close();}
});

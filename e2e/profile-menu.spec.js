import {test,expect} from "@playwright/test";
test("clique direito de administrador não derruba a tela e identifica o membro",async({page,browser})=>{
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 await page.request.post("/api/auth/login",{data:{username:"demo",password:"demo123"}});
 const server=(await(await page.request.post("/api/servers",{data:{name:"Menus de teste"}})).json()).server;
 const peer=await browser.newContext();
 try{
  const account=(await(await peer.request.post("http://127.0.0.1:34170/api/auth/register",{data:{username:"menuguest",email:"menuguest@sesh.test",password:"test1234",displayName:"Jogador menu"}})).json()).user;
  await peer.request.post("http://127.0.0.1:34170/api/servers/"+server.inviteCode+"/join",{data:{}});
  await page.goto("/app");await page.getByTitle("Menus de teste",{exact:true}).click();
  const row=page.locator(".member[data-member-id='"+account.id+"']");await expect(row).toBeVisible();
  await row.click({button:"right"});
  const menu=page.getByLabel("Ações do membro");await expect(menu).toBeVisible();await expect(menu.locator("select")).toBeVisible();
  expect(errors).toEqual([]);
  await menu.getByRole("button",{name:"Perfil",exact:true}).click();
  const profile=page.getByRole("dialog",{name:"Perfil de Jogador menu"});await expect(profile).toBeVisible();
  await profile.getByRole("button",{name:"Atividade",exact:true}).click();
  await expect(profile.getByText("STATUS PERSONALIZADO",{exact:true})).toBeVisible();
  await profile.getByRole("button",{name:"Lista de desejos",exact:true}).click();
  await expect(profile.getByText("Esta pessoa ainda não compartilhou uma lista de desejos.")).toBeVisible();
  await page.screenshot({path:"test-results/member-profile.png"});
 await profile.getByLabel("Fechar perfil",{exact:true}).click();await expect(row).toBeVisible();expect(errors).toEqual([]);
 await page.locator(".user-panel").click({button:"right"});
 const ownMenu=page.getByLabel("Ações do membro");await expect(ownMenu).toBeVisible();await expect(ownMenu.locator("select")).toBeVisible();
 await ownMenu.locator("select").selectOption("member");
 await expect(page.getByText("Você continua dono do servidor.",{exact:false})).toBeVisible();
 }finally{await peer.close();}
});
test("foto própria abre cartão rápido acima do painel",async({page})=>{
 await page.request.post("/api/auth/login",{data:{username:"demo",password:"demo123"}});await page.goto("/app");
 await page.getByTitle("Abrir meu perfil",{exact:true}).click();
 const quick=page.getByRole("dialog",{name:"Meu perfil rápido"});await expect(quick).toBeVisible();
 const card=await quick.boundingBox(),panel=await page.locator(".user-panel").boundingBox();
 expect(card.y).toBeGreaterThanOrEqual(0);expect(card.y+card.height).toBeLessThan(panel.y);
 await quick.getByRole("button",{name:"Ver perfil completo"}).click();
 await expect(page.locator(".identity-dialog")).toBeVisible();await expect(quick).toHaveCount(0);
 await page.screenshot({path:"test-results/own-profile.png"});await page.keyboard.press("Escape");
 await expect(page.locator(".identity-dialog")).toHaveCount(0);
});

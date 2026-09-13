import {test,expect} from "@playwright/test";
test("dois clientes recebem mensagens em tempo real",async({page,browser})=>{
 await page.request.post("/api/auth/login",{data:{username:"demo",password:"demo123"}});
 const community=(await(await page.request.post("/api/servers",{data:{name:"Teste ao vivo"}})).json()).server;
 const context=await browser.newContext();const peer=await context.newPage();
 try{
  const registered=await context.request.post("http://127.0.0.1:34170/api/auth/register",{data:{username:"realtimeguest",email:"realtime@sesh.test",password:"test1234",displayName:"Outro jogador"}});
  expect(registered.ok()).toBeTruthy();
  await context.request.post("http://127.0.0.1:34170/api/servers/"+community.inviteCode+"/join",{data:{}});
  await page.goto("/app");await peer.goto("http://127.0.0.1:34170/app");
  await page.getByTitle("Teste ao vivo",{exact:true}).click();await peer.getByTitle("Teste ao vivo",{exact:true}).click();
  await expect(peer.locator(".composer")).toBeVisible();
  await page.locator(".composer input:not([type=file])").fill("Conversa ao vivo 🎮");await page.locator(".send-button").click();
  await expect(peer.getByText("Conversa ao vivo 🎮",{exact:true})).toBeVisible();
  await peer.locator(".composer input:not([type=file])").fill("Recebi! 🥳");await peer.locator(".send-button").click();
  await expect(page.getByText("Recebi! 🥳",{exact:true})).toBeVisible();
  const list=page.locator(".messages-list");
  await expect.poll(()=>list.evaluate(element=>Math.abs(element.scrollHeight-element.clientHeight-element.scrollTop))).toBeLessThan(5);
  await page.screenshot({path:"test-results/chat-live.png",fullPage:true});
 }finally{await context.close();}
});
test("jogos mostram imagens e persistem no perfil",async({page})=>{
 await page.request.post("/api/auth/login",{data:{username:"demo",password:"demo123"}});await page.goto("/app");
 await page.getByTitle("Configurações",{exact:true}).click();
 await page.getByRole("button",{name:"Editar perfil e conta"}).click();
 const editor=page.getByRole("dialog",{name:"Editar perfil",exact:true});
 await editor.getByRole("button",{name:"Jogos de interesse",exact:true}).click();
 await editor.getByPlaceholder("Buscar entre 400 jogos").fill("Brawlhalla");
 const game=editor.locator(".games-gallery button").filter({hasText:"Brawlhalla"});
 await expect(game.locator("img.game-icon")).toHaveCount(1);await game.click();
 await editor.getByRole("button",{name:"Salvar alterações"}).click();await expect(editor.getByRole("status")).toContainText("Tudo salvo");
 await page.screenshot({path:"test-results/game-interests.png",fullPage:true});
 const me=await(await page.request.get("/api/auth/me")).json();expect(me.user.gameInterests).toHaveLength(1);
 await editor.getByLabel("Fechar perfil",{exact:true}).click();
 await expect(page.locator(".favorite-game-activity")).toContainText("Brawlhalla");
});

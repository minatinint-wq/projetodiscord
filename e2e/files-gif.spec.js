import {test,expect} from "@playwright/test";
const base="http://127.0.0.1:34170";
// Two image frames, kept byte-for-byte through upload and persistence.
const single=Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7","base64");
const gif=Buffer.concat([single.subarray(0,-1),single.subarray(19,-1),Buffer.from([59])]);
async function drop(page,target,name,mime,bytes){
 const data=await page.evaluateHandle(({name,mime,bytes})=>{const dt=new DataTransfer();dt.items.add(new File([Uint8Array.from(bytes)],name,{type:mime}));return dt;},{name,mime,bytes:Array.from(bytes)});
 await target.dispatchEvent("dragenter",{dataTransfer:data});await target.dispatchEvent("drop",{dataTransfer:data});await data.dispose();
}
test("GIF concedido manualmente aparece no banner e persiste após recarregar",async({page,browser})=>{
 const member=(await(await page.request.post("/api/auth/register",{data:{username:"gifmember",email:"gifmember@sesh.test",password:"Gif-Test-9753",displayName:"Perfil animado"}})).json()).user;
 const admin=await browser.newContext();
 try{
  await admin.request.post(base+"/api/auth/login",{data:{username:"browser-admin@sesh.test",password:"browser-admin-test-only"}});
  const grant=await admin.request.patch(base+"/api/users/"+member.id+"/badges",{data:{badges:["nitro_classic"]}});expect(grant.ok()).toBeTruthy();
  await page.goto("/app");await page.getByTitle("Configurações",{exact:true}).click();await page.getByRole("button",{name:"Editar perfil e conta"}).click();
  const editor=page.getByRole("dialog",{name:"Editar perfil",exact:true});
  await drop(page,editor.locator('[data-drop-target="banner"]'),"banner.GIF","application/octet-stream",gif);
  await expect(editor.locator(".identity-banner")).toHaveCSS("background-image",/data:image\/gif;base64/);
  await expect.poll(()=>editor.locator(".identity-banner").evaluate(async element=>{const src=element.style.backgroundImage.slice(5,-2);const img=new Image();img.src=src;try{await img.decode();return img.naturalWidth;}catch{return 0;}})).toBeGreaterThan(0);
  await editor.getByLabel("Posição vertical do banner").fill("70");
  await editor.getByRole("button",{name:"Salvar alterações"}).click();await expect(editor).toBeHidden();
  const me=(await(await page.request.get("/api/auth/me")).json()).user;expect(me.banner).toBe("data:image/gif;base64,"+gif.toString("base64"));expect(me.bannerPositionY).toBe(70);
  await page.reload();await page.getByTitle("Abrir meu perfil",{exact:true}).click();await page.getByRole("button",{name:"Ver perfil completo"}).click();
  await expect(page.locator(".identity-dialog .identity-banner")).toHaveCSS("background-image",/data:image\/gif;base64/);
  await expect(page.locator(".identity-dialog .identity-banner")).toHaveCSS("background-position","50% 70%");
 }finally{await admin.close();}
});
test("arrastar arquivo no canal prepara e envia download sem abrir outro site",async({page})=>{
 await page.request.post("/api/auth/login",{data:{username:"demo",password:"demo123"}});
 await page.request.post("/api/servers",{data:{name:"Arquivos arrastados"}});
 await page.goto("/app");await page.getByTitle("Arquivos arrastados",{exact:true}).click();
 await drop(page,page.locator(".chat-area"),"notas.txt","text/plain",Buffer.from("hello"));
 await expect(page.locator(".attachment-draft")).toContainText("notas.txt");expect(page.url()).toContain("/app");
 await expect(page.locator(".message .file-attachment")).toHaveCount(0);
 await page.locator(".send-button").click();await expect(page.locator(".message .file-attachment")).toContainText("notas.txt");
 const download=page.waitForEvent("download");await page.locator(".message .file-attachment").click();expect((await download).suggestedFilename()).toBe("notas.txt");
 await page.screenshot({path:"test-results/file-drop.png"});
});

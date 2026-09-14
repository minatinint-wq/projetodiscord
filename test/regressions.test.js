import assert from "node:assert/strict";
import {test,before,after} from "node:test";
import {spawn} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import path from "node:path";import os from "node:os";
const port=35500+Math.floor(Math.random()*400),url="http://127.0.0.1:"+port;
let proc,temp,owner,guest,server;
const png="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const gif="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
async function req(route,method="GET",data,auth){const response=await fetch(url+route,{method,headers:{"Content-Type":"application/json",...(auth?{Cookie:auth}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});
const setCookie=response.headers.get("set-cookie")||"";
const jar=(setCookie.match(/sesh_session=[^;]*/)||[])[0]||auth||"";




return {status:response.status,cookie:jar,token:jar,...await response.json()};}
before(async()=>{
 temp=await mkdtemp(path.join(os.tmpdir(),"sesh-regressions-"));
 proc=spawn(process.execPath,["server.js"],{cwd:process.cwd(),env:{...process.env,HOST:"127.0.0.1",PORT:String(port),DATABASE_URL:"",DATA_FILE:path.join(temp,"data.json"),SEED_DEMO_USER:"true",MASTER_ADMIN_EMAIL:"test-admin@sesh.local",MASTER_ADMIN_PASSWORD:"test-admin-password",MASTER_ADMIN_EMAILS:"",CREATOR_EMAIL:"",CREATOR_EMAILS:"",RESEND_API_KEY:""},stdio:"ignore"});

 for(let i=0;i<100;i++){try{if((await fetch(url+"/api/health")).ok)break;}catch{}await new Promise(r=>setTimeout(r,50));}
 owner=await req("/api/auth/login","POST",{username:"demo",password:"demo123"});

 guest=await req("/api/auth/register","POST",{username:"testguest",email:"testguest@sesh.local",password:"Hospede-975310",displayName:"Visitante"});

 server=(await req("/api/servers","POST",{name:"Regressions"},owner.token)).server;
 await req("/api/servers/"+server.inviteCode+"/join","POST",{},guest.token);
});
after(async()=>{if(proc&&!proc.killed){const ended=new Promise(r=>proc.once("exit",r));proc.kill();await ended;}if(temp)await rm(temp,{recursive:true,force:true});

});
test("cadastro entra sem Resend e aceita @ único, e-mail e ID público",async()=>{
 const account=await req("/api/auth/register","POST",{username:"loginoptional",email:"loginoptional@sesh.test",displayName:"Apelido diferente",password:"Opcional-135790"});
  assert.equal(account.status,201);assert.equal(account.verificationRequired,false);assert.equal(account.verificationEmailSent,false);
  assert.equal(account.user.emailVerified,false);
 assert.match(account.user.publicId,/^S-[A-F0-9]{10}$/);
 assert.equal((await req("/api/auth/register","POST",{username:"abc",email:"short@sesh.test",password:"Opcional-135790"})).status,400);
 for(const identifier of ["loginoptional"," LOGINOPTIONAL ","loginoptional@sesh.test","@loginoptional",account.user.publicId,"@loginoptional#"+account.user.tag]){
  const result=await req("/api/auth/login","POST",{username:identifier,password:"Opcional-135790"});
  assert.equal(result.status,200,identifier);assert.equal(result.user.id,account.user.id);
 }
 assert.equal((await req("/api/auth/login","POST",{username:"loginoptional#0001",password:"Opcional-135790"})).status,401);
 assert.equal((await req("/api/auth/login","POST",{username:"loginoptional",password:"errada"})).status,401);
});
test("perfil é atômico e imagem estática persiste",async()=>{
 assert.equal((await req("/api/auth/me","PATCH",{username:"abc"},guest.token)).status,400);
 const markup='<img src=x onerror="alert(document.cookie)">';
 const rejectedName=await req("/api/auth/me","PATCH",{displayName:markup},guest.token);
 assert.equal(rejectedName.status,400);assert.match(rejectedName.error,/não use tags/i);
 const encodedName='## &lt;img src=x onerror=alert(1)&gt;';
 const rejectedEncodedName=await req("/api/auth/me","PATCH",{displayName:encodedName},guest.token);
 assert.equal(rejectedEncodedName.status,400);assert.match(rejectedEncodedName.error,/não use tags/i);
 assert.equal((await req("/api/auth/me","GET",undefined,guest.token)).user.displayName,"Visitante");
 assert.equal((await req("/api/auth/me","PATCH",{avatar:png,banner:png},guest.token)).status,200);
 const failed=await req("/api/auth/me","PATCH",{bio:"nao deve salvar",banner:"invalid"},guest.token);
 assert.equal(failed.status,400);const result=await req("/api/auth/me","GET",undefined,guest.token);
 assert.equal(result.user.bio,"");assert.equal(result.user.banner,png);assert.equal(result.user.avatar,png);
 assert.equal((await req("/api/auth/me","PATCH",null,guest.token)).status,400);
});
test("GIF exige Nitro ativo no backend",async()=>{
 assert.equal((await req("/api/auth/me","PATCH",{avatar:gif},guest.token)).status,403);
 const admin=await req("/api/auth/login","POST",{username:"test-admin@sesh.local",password:"test-admin-password"});

 const granted=await req("/api/admin/users/"+guest.user.id+"/subscription","PATCH",{planId:"classic",status:"active"},admin.token);
 assert.equal(granted.status,200);
 const result=await req("/api/auth/me","PATCH",{avatar:gif,banner:gif},guest.token);assert.equal(result.status,200);assert.equal(result.user.avatar,gif);
});
test("e-mail não permite assumir privilégio administrativo",async()=>{
 const result=await req("/api/auth/me","PATCH",{email:"test-admin@sesh.local"},guest.token);assert.equal(result.status,403);
});
test("cargos, emoji, ícone e permissões persistem; anexos são validados",async()=>{
 const roles=[...server.roles.map(role=>role.id==="member"?{...role,permissions:{...role.permissions,attachFiles:false}}:role),{id:"moderator",name:"Guardiões",color:"#ab88ff",style:"dark_wave",emoji:"🛡️",icon:gif,permissions:{sendMessages:true,connectVoice:true},hoist:true}];
 const changed=await req("/api/servers/"+server.id,"PATCH",{roles},owner.token);assert.equal(changed.status,200);
 const reloaded=await req("/api/servers/"+server.id,"GET",undefined,owner.token);
 assert.ok(reloaded.server.roles.some(role=>role.id==="moderator"));assert.equal(reloaded.server.roles.find(role=>role.id==="moderator").style,"dark_wave");assert.equal(reloaded.server.roles.find(role=>role.id==="moderator").emoji,"🛡️");assert.equal(reloaded.server.roles.find(role=>role.id==="moderator").icon,gif);assert.equal(reloaded.server.roles.find(role=>role.id==="member").permissions.attachFiles,false);
 assert.equal((await req("/api/channels/"+server.channels[0].id+"/messages","POST",{attachment:png},guest.token)).status,403);
 const invalid=await req("/api/servers/"+server.id,"PATCH",{name:"nao deve salvar",memberRoles:{[guest.user.id]:"missing"}},owner.token);assert.equal(invalid.status,400);
 assert.equal((await req("/api/servers/"+server.id,"GET",undefined,owner.token)).server.name,"Regressions");
 assert.equal((await req("/api/servers/"+server.id,"PATCH",{icon:"RG",memberRoles:{[guest.user.id]:"moderator"}},owner.token)).status,200);
 const ownRole=await req("/api/servers/"+server.id,"PATCH",{memberRoles:{[owner.user.id]:"moderator"}},owner.token);
 assert.equal(ownRole.status,200);assert.equal(ownRole.server.role,"owner");
 const ownerView=await req("/api/servers/"+server.id,"GET",undefined,owner.token);
 assert.equal(ownerView.members.find(member=>member.id===owner.user.id).roleId,"moderator");
});
test("DM persiste texto e imagem e respeita preferências",async()=>{
 assert.equal((await req("/api/direct/"+owner.user.id+"/messages","POST",{content:"oi"},guest.token)).status,403);
 await req("/api/friends","POST",{username:"demo"},guest.token);
 await req("/api/friends","POST",{username:guest.user.publicId},owner.token);
 const sent=await req("/api/direct/"+owner.user.id+"/messages","POST",{content:"Olá 🎮 ❤️",attachment:png},guest.token);assert.equal(sent.status,201);
 const inbox=await req("/api/direct/"+guest.user.id+"/messages","GET",undefined,owner.token);assert.equal(inbox.messages[0].content,"Olá 🎮 ❤️");assert.equal(inbox.messages[0].attachment,png);
 await req("/api/auth/me","PATCH",{preferences:{allowDirectMessages:false}},owner.token);
 assert.equal((await req("/api/direct/"+owner.user.id+"/messages","POST",{content:"bloqueada"},guest.token)).status,403);
});
test("banner animado mantém bytes e enquadramento com Nitro",async()=>{
 const admin=await req("/api/auth/login","POST",{username:"test-admin@sesh.local",password:"test-admin-password"});
 await req("/api/admin/users/"+guest.user.id+"/subscription","PATCH",{planId:"classic",status:"active"},admin.token);
 const result=await req("/api/auth/me","PATCH",{banner:gif,bannerPositionX:25,bannerPositionY:80,effectSpeed:"slow",effectIntensity:"subtle",profileEffect:"butterflies"},guest.token);
 assert.equal(result.status,200);assert.equal(result.user.banner,gif);assert.equal(result.user.bannerPositionY,80);
 const profile=await req("/api/users/"+guest.user.id,"GET",undefined,owner.token);
 assert.match(profile.user.banner,/^\/api\/users\/.+\/media\/banner\?v=[a-f0-9]{12}$/);assert.equal(profile.user.bannerPositionX,25);assert(profile.user.badges.includes("nitro_classic"));
 const media=await fetch(url+profile.user.banner,{headers:{Cookie:owner.token}});assert.equal(media.status,200);assert.deepEqual(Buffer.from(await media.arrayBuffer()),Buffer.from(gif.split(",")[1],"base64"));
 const invalid=await req("/api/auth/me","PATCH",{bannerPositionY:101,bio:"invalid changes"},guest.token);assert.equal(invalid.status,400);
 assert.equal((await req("/api/auth/me","GET",undefined,guest.token)).user.bannerPositionY,80);
 await req("/api/admin/users/"+guest.user.id+"/subscription","PATCH",{planId:"classic",status:"canceled"},admin.token);
});
test("favorito acompanha seleção e limpa quando remove jogos",async()=>{
 const games=(await req("/api/games","GET",undefined,guest.token)).games;
 const result=await req("/api/auth/me","PATCH",{favoriteGame:"valor antigo",gameInterests:[games[0].id,games[1].id]},guest.token);
 assert.equal(result.user.favoriteGame,games[0].name);
 assert.deepEqual((await req("/api/users/"+guest.user.id,"GET",undefined,owner.token)).user.gameInterests,[games[0].id,games[1].id]);
 const cleared=await req("/api/auth/me","PATCH",{gameInterests:[]},guest.token);assert.equal(cleared.user.favoriteGame,"");
});
test("Nitro manual do admin libera GIF e membro não concede insígnias",async()=>{
 const admin=await req("/api/auth/login","POST",{username:"test-admin@sesh.local",password:"test-admin-password"});
 const granted=await req("/api/users/"+guest.user.id+"/badges","PATCH",{badges:["nitro_classic","cacador_bugs"]},admin.token);
 assert.equal(granted.status,200);assert(granted.user.badges.includes("nitro_classic"));assert(granted.user.badges.includes("cacador_bugs"));
 assert.equal((await req("/api/auth/me","PATCH",{banner:gif},guest.token)).status,200);
 const fresh=await req("/api/auth/login","POST",{username:"testguest",password:"Hospede-975310"});assert(fresh.user.badges.includes("nitro_classic"));
 assert.equal((await req("/api/auth/me","PATCH",{badges:["criador"]},guest.token)).status,403);
 assert.equal((await req("/api/users/"+owner.user.id+"/badges","PATCH",{badges:["nitro_classic"]},guest.token)).status,403);
});
test("arquivos de chat são validados e respeitam permissão de anexar",async()=>{
 const file={name:"notas.txt",size:5,data:"data:application/octet-stream;base64,aGVsbG8="};
 const route="/api/channels/"+server.channels[0].id+"/messages";
 assert.equal((await req(route,"POST",{attachment:file},owner.token)).status,201);
 const rows=await req(route,"GET",undefined,owner.token);assert(rows.messages.some(message=>message.attachment?.name==="notas.txt"));
 assert.equal((await req(route,"POST",{attachment:file},guest.token)).status,403);
 for(const changes of [{name:"../bad.html"},{size:7},{data:"data:text/html;base64,aGVsbG8="}]){
  assert.equal((await req(route,"POST",{attachment:{...file,...changes}},owner.token)).status,400);
 }
});
test("sobreposição e cores personalizadas persistem e validam entradas",async()=>{
 const input={profileOverlay:"lunar-orbit",profilePrimaryColor:"#080c30",profileAccentColor:"#81bcff"};
 const updated=await req("/api/auth/me","PATCH",input,guest.token);assert.equal(updated.status,200);
 const publicProfile=await req("/api/users/"+guest.user.id,"GET",undefined,owner.token);
 for(const [key,value] of Object.entries(input))assert.equal(publicProfile.user[key],value);
 assert.equal((await req("/api/auth/me","PATCH",{profilePrimaryColor:"url(bad)"},guest.token)).status,400);
 assert.equal((await req("/api/auth/me","PATCH",{profileOverlay:"unknown"},guest.token)).status,400);
});
test("novos cosméticos são aceitos e persistidos",async()=>{
 const result=await req("/api/auth/me","PATCH",{avatarFrame:"glitch",profileEffect:"flames",nameEffect:"red_black_pulse"},guest.token);assert.equal(result.status,200);
 assert.equal(result.user.avatarFrame,"glitch");assert.equal(result.user.profileEffect,"flames");assert.equal(result.user.nameEffect,"red_black_pulse");
 const plain=await req("/api/auth/register","POST",{username:"plainuser",email:"plain@sesh.local",password:"Valida-975310!Z",displayName:"Plain"});assert.equal(plain.status,201);
 const plainNameEffect=await req("/api/auth/me","PATCH",{nameEffect:"rgb"},plain.token);assert.equal(plainNameEffect.status,200);assert.equal(plainNameEffect.user.nameEffect,"rgb");
});
test("envio rápido usa identificador idempotente sem duplicar mensagens",async()=>{
 const channel=server.channels.find(item=>item.type==="text");
 const clientMessageId="fast-send-12345678";
 const first=await req("/api/channels/"+channel.id+"/messages","POST",{content:"mensagem rápida",clientMessageId},guest.token);
 const repeated=await req("/api/channels/"+channel.id+"/messages","POST",{content:"mensagem rápida",clientMessageId},guest.token);
 assert.equal(first.status,201);assert.equal(repeated.status,200);assert.equal(repeated.duplicate,true);assert.equal(repeated.message.id,first.message.id);
 const history=await req("/api/channels/"+channel.id+"/messages","GET",undefined,guest.token);
 assert.equal(history.messages.filter(message=>message.clientMessageId===clientMessageId).length,1);
});
test("gestor cria cargo inferior sem elevar privilégios",async()=>{
 const current=(await req("/api/servers/"+server.id,"GET",undefined,owner.token)).server;
 const manager={id:"manager",name:"Gestor",permissions:{...current.roles.find(r=>r.id==="owner").permissions}};
 let roles=[current.roles.find(r=>r.id==="owner"),manager,...current.roles.filter(r=>r.id!=="owner")];
 assert.equal((await req("/api/servers/"+server.id,"PATCH",{roles,memberRoles:{[guest.user.id]:"manager"}},owner.token)).status,200);
 roles=(await req("/api/servers/"+server.id,"GET",undefined,guest.token)).server.roles;
 assert.equal((await req("/api/servers/"+server.id,"PATCH",{roles:[...roles,{id:"helper",name:"Ajudante",permissions:{sendMessages:true}}]},guest.token)).status,200);
 const latest=(await req("/api/servers/"+server.id,"GET",undefined,guest.token)).server;
 const selfChange=latest.roles.map(r=>r.id==="manager"?{...r,name:"Não autorizado"}:r);
 assert.equal((await req("/api/servers/"+server.id,"PATCH",{roles:selfChange},guest.token)).status,403);
 assert.equal((await req("/api/servers/"+server.id,"PATCH",{memberRoles:{[guest.user.id]:"helper"}},guest.token)).status,403);
 assert.equal((await req("/api/servers/"+server.id,"PATCH",{roles:{}},owner.token)).status,400);
});

import { _electron as electron } from "@playwright/test";
import {mkdtemp,rm} from "node:fs/promises";
import path from "node:path";import os from "node:os";
const temp=await mkdtemp(path.join(os.tmpdir(),"sesh-desktop-smoke-"));
let app;
try{
 app=await electron.launch({executablePath:path.resolve("release/win-unpacked/Sesh.exe"),args:["--user-data-dir="+temp],env:{...process.env,SESH_DESKTOP_SMOKE_TEST:"1"},timeout:30000});
 const win=await app.firstWindow();await win.waitForURL("https://sesh-web-08o6.onrender.com/app",{timeout:60000});
 await win.waitForLoadState("domcontentloaded");
 const version=await app.evaluate(({app})=>app.getVersion());
 if(version!=="1.2.0")throw new Error("Versão incorreta: "+version);
 console.log(JSON.stringify({version,url:win.url(),title:await win.title(),visible:await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible())}));
}finally{await app?.close();await rm(temp,{recursive:true,force:true});}

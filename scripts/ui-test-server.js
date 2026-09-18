import {mkdtemp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const temp=await mkdtemp(path.join(os.tmpdir(),"sesh-browser-"));
Object.assign(process.env,{HOST:"127.0.0.1",PORT:"34170",DATA_FILE:path.join(temp,"database.json"),DATABASE_URL:"",SEED_DEMO_USER:"true",MASTER_ADMIN_EMAIL:"browser-admin@sesh.test",MASTER_ADMIN_EMAILS:"",MASTER_ADMIN_PASSWORD:"browser-admin-test-only",CREATOR_EMAIL:"",CREATOR_EMAILS:"",RESEND_API_KEY:""});
process.env.SHORT_USERNAME_EMAILS="short@sesh.test";
const {server}=await import("../server.js");
let closing=false;
process.on("SIGTERM",()=>{
 if(closing)return;closing=true;
 server.close();server.closeAllConnections?.();server.closeIdleConnections?.();
 const finish=()=>rm(temp,{recursive:true,force:true}).finally(()=>process.exit());
 setTimeout(finish,100).unref?.();
});

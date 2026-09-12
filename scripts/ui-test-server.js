import {mkdtemp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const temp=await mkdtemp(path.join(os.tmpdir(),"sesh-browser-"));
Object.assign(process.env,{HOST:"127.0.0.1",PORT:"34170",DATA_FILE:path.join(temp,"database.json"),DATABASE_URL:"",SEED_DEMO_USER:"true",MASTER_ADMIN_EMAIL:"",MASTER_ADMIN_EMAILS:"",MASTER_ADMIN_PASSWORD:"",CREATOR_EMAIL:"",CREATOR_EMAILS:"",RESEND_API_KEY:""});
const {server}=await import("../server.js");
process.on("SIGTERM",()=>{server.close();rm(temp,{recursive:true,force:true}).finally(()=>process.exit());});

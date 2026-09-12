export const FILE_LIMIT = 3 * 1024 * 1024;
export async function readAttachment(file){
 if(!file||!file.size)throw new Error("O arquivo está vazio.");
 if(file.size>FILE_LIMIT)throw new Error("Envie um arquivo de até 3 MB.");
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer()),header=String.fromCharCode(...bytes);
 const mime=/^GIF8[79]a/.test(header)?"image/gif":bytes[0]===137&&bytes[1]===80?"image/png":bytes[0]===255&&bytes[1]===216?"image/jpeg":header.startsWith("RIFF")&&header.slice(8)==="WEBP"?"image/webp":"application/octet-stream";
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Não foi possível ler esse arquivo."));reader.readAsDataURL(new Blob([file],{type:mime}));});
 return mime.startsWith("image/")?data:{name:file.name.replace(/[\\/\x00-\x1f]/g,"_").slice(0,180)||"arquivo",size:file.size,data};
}

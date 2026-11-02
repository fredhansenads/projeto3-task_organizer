"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {authClient} from "../../lib/supabase";
import {inspectFile} from "../../lib/attachment";

export async function materialAction(school:string,op:string,token:string,form:FormData):Promise<{id?:string;error?:string}> {
  const client=await authClient();
  const data:Record<string,unknown>=Object.fromEntries([...form].filter(([,v])=>typeof v==="string"));
  data.ids=form.getAll("ids");
  const command=async (action:string,body:Record<string,unknown>,key:string)=>{
    const {data:id,error}=await client.rpc("material_command",{sid:school,token:key,op:action,d:body});
    if(error) {
      if(error.code==="P0001") throw Error(error.message);
      if(error.code==="23505") throw Error("Este cadastro já existe.");
      if(error.code==="23503") throw Error("Confira os vínculos do cadastro com a escola e o ano.");
      throw Error("Não foi possível gravar. Confira os campos e o acesso à escola.");
    }
    return String(id);
  };
  try {
    let id:string;
    if(op==="upload") {
      const file=form.get("file");
      if(!(file instanceof File)) throw Error("Selecione o arquivo.");
      const {bytes,mime}=await inspectFile(file);
      const aid=String(data.attachment||token);
      if(!data.attachment) await command("reserve",{id:aid,version:data.version,name:file.name,size:file.size,mime},token);
      const {data:record}=await client.from("attachments").select("object_path,file_name,mime_type,byte_size,ready").eq("school_id",school).eq("id",aid).eq("version_id",data.version).maybeSingle();
      if(!record || record.file_name!==file.name || record.byte_size!==file.size || record.mime_type!==mime) throw Error("Selecione o mesmo arquivo da tentativa anterior.");
      if(!record.ready) {
        const {error}=await client.storage.from("materiais").upload(record.object_path,bytes,{contentType:mime,upsert:false});
        if(error && !["409","400"].includes(String(error.statusCode))) throw Error("Falha no envio. Selecione o mesmo arquivo e tente novamente.");
        await command("confirm",{id:aid},randomUUID());
      }
      id=aid;
    } else {
      if(op==="reserve") throw Error("Use o formulário de anexo.");
      id=await command(op,data,token);
    }
    revalidatePath("/painel"); return {id};
  } catch(e) {return {error:e instanceof Error?e.message:"Falha ao salvar. Tente novamente."};}
}

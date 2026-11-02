import {authClient} from "../../../lib/supabase";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const client=await authClient();
  const {data}=await client.from("attachments").select("object_path,file_name").eq("id",(await params).id).eq("ready",true).maybeSingle();
  if(!data) return new Response("Arquivo indisponível.",{status:404});
  const {data:link}=await client.storage.from("materiais").createSignedUrl(data.object_path,60,{download:data.file_name});
  if(!link) return new Response("Não foi possível abrir o arquivo.",{status:404});
  return new Response(null,{status:302,headers:{Location:link.signedUrl,"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}

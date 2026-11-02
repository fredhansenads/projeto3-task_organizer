"use server";
import { revalidatePath } from "next/cache";
import { authClient } from "../../lib/supabase";

type Change =
  | {kind:"task"; id:string; revision:number; fields:Record<string,string>; steps:{id:string;title:string;done:boolean}[]}
  | {kind:"transition"; id:string; revision:number; operation:string; confirmed:boolean; note:string}
  | {kind:"event"; id:string; revision:number; title:string; start:string; end:string; note:string};

export async function save(school:string, change:Change):Promise<{error?:string}> {
  const client=await authClient();
  const args={sid:school,expected:change.revision};
  let result;
  switch(change.kind) {
    case "task":
      result=await client.rpc("save_task",{...args,tid:change.id,fields:change.fields,steps:change.steps}); break;
    case "transition":
      result=await client.rpc("task_transition",{...args,tid:change.id,operation:change.operation,confirmed:change.confirmed,note:change.note}); break;
    case "event":
      result=await client.rpc("save_event",{...args,eid:change.id,title_text:change.title,start_local:change.start,end_local:change.end,note:change.note}); break;
    default: return {error:"Ação inválida."};
  }
  if(result.error) {
    if(result.error.code==="P0001") return {error:result.error.message};
    if(result.error.code==="23503") return {error:"Confira a turma, a disciplina e o ano letivo da escola."};
    return {error:"Não foi possível salvar. Confira os campos e sua conexão."};
  }
  revalidatePath("/painel");
  return {};
}

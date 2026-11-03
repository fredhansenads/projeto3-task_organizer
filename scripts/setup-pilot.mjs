import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { localStack, check } from "./local.mjs";

// Identificadores estáveis permitem retomar a preparação sem desfazer o trabalho do avaliador.
const id = n => "a6dfadd1-7183-47bc-8af1-" + String(n).padStart(12,"0");
const school = id(1);
const name = "Escola Horizonte · Piloto";
const {url, key, admin} = localStack();
const demo = JSON.parse(readFileSync(".env.demo.local","utf8"));
if (demo.email !== "coordenacao@example.test") throw Error("Use a conta de demonstração local do projeto.");
const actor = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {user} = check(await actor.auth.signInWithPassword({email:demo.email,password:demo.password}));
if (user.id !== demo.userId) throw Error("Conta de demonstração diferente da configuração local.");

check(await admin.from("schools").upsert({id:school,name},{onConflict:"id",ignoreDuplicates:true}));
const base = check(await admin.from("schools").select("name,created_at").eq("id",school).single());
if (base.name !== name) throw Error("O identificador do piloto já está em uso por outra escola.");
check(await admin.from("school_memberships").upsert({school_id:school,user_id:user.id},{onConflict:"school_id,user_id",ignoreDuplicates:true}));
const day = new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(base.created_at));
function date(offset) {
  const value = new Date(day+"T12:00:00Z");
  value.setUTCDate(value.getUTCDate()+offset);
  return value.toISOString().slice(0,10);
}
const command = async (n,op,d) => check(await actor.rpc("material_command",{sid:school,token:id(n),op,d}));
const year = await command(2,"year",{year:Number(day.slice(0,4))});
const turma = await command(3,"class",{year,name:"7º A"});
const subject = await command(4,"subject",{name:"Matemática"});
const ana = await command(5,"teacher",{name:"Ana Lima"});
const bruno = await command(6,"teacher",{name:"Bruno Reis"});
for (const [n,teacher] of [[7,ana],[8,bruno]]) {
  await command(n,"assign",{teacher,year,class:turma,subject});
}
const request = await command(9,"request",{title:"Plano de avaliação do 7º A",type:"Plano de avaliação",year,class:turma,
  subject,period:"Ciclo do piloto",instructions:"Informar objetivos e critérios de correção.",date:date(1),ids:[ana,bruno]});
const delivery = check(await actor.from("delivery_obligations").select("id").eq("school_id",school).eq("request_id",request).eq("teacher_id",bruno).single());
await command(10,"receive",{id:delivery.id,revision:1,channel:"email",received:date(-1)+"T14:00",notes:"Primeira versão do plano."});
await command(11,"adjust",{id:delivery.id,revision:2,reason:"Detalhar os critérios de correção.",correction:date(2)});

async function task(n,area,title,offset,steps) {
  check(await actor.rpc("save_task",{sid:school,tid:id(n),expected:0,
    fields:{area,title,date:date(offset),year,class:turma,subject,priority:"normal",status:"pendente"},
    steps:steps.map(([index,text])=>({id:id(index),title:text,done:false}))}));
}
await task(12,"coordenacao","Conferir os planos do 7º A",0,[[13,"Consultar as entregas"],[14,"Registrar as devolutivas"]]);
await task(15,"docencia","Preparar a atividade de frações",1,[]);
check(await actor.rpc("save_event",{sid:school,eid:id(16),expected:0,title_text:"Reunião de planejamento do 7º A",
  start_local:date(2)+"T14:00",end_local:date(2)+"T14:30",note:"Revisar os planos e alinhar a próxima atividade."}));
console.log("Piloto disponível em http://127.0.0.1:3000/painel?escola="+school);
console.log("Data de referência: "+day+". Acesso com a conta de demonstração local.");

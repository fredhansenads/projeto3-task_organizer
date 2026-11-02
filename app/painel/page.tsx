import { redirect } from "next/navigation";
import { authClient } from "../../lib/supabase";
import type { Task, Step, Appointment, SchoolOption, History } from "../../lib/rotina";
import { logout } from "../actions";
import Routine from "./routine";
import { materialScreens, type Delivery, type Teacher, type Assignment, type RequestRow, type Receipt, type Attachment, type ChangeLog } from "../../lib/materiais";

export default async function Page({searchParams}:{searchParams:Promise<{escola?:string;tela?:string;id?:string}>}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");
  const client = await authClient(true);
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/");
  const {data:schools,error}=await client.from("schools").select("id,name").order("name");
  if(error) throw Error("Não foi possível consultar as escolas.");
  const params=await searchParams;
  const school=schools.find(s=>s.id===params.escola) || schools[0];
  if(!school) return <section><h1>Vínculo pendente</h1><p>Peça à administração para vincular sua conta a uma escola.</p><form action={logout}><button>Sair</button></form></section>;

  async function rows<T>(table:string,columns:string,historyId?:string,filterColumn="task_ref"):Promise<T[]> {
    const result:T[]=[];
    for(let offset=0;;offset+=500) {
      let query=client.from(table).select(columns).eq("school_id",school.id);
      if(historyId) query=query.eq(filterColumn,historyId);
      const part=await query.order("id").range(offset,offset+499);
      if(part.error) throw Error("Não foi possível carregar a rotina da escola.");
      result.push(...part.data as unknown as T[]);
      if(part.data.length<500) return result;
    }
  }
  const detail=params.tela==="tarefa" && /^[a-f\d-]{36}$/i.test(params.id||"") ? params.id : undefined;
  const [tasks,steps,events,years,classes,subjects,history]=await Promise.all([
    rows<Task>("tasks","id,title,description,notes,area,priority,status,due_date,due_at,completed_at,completion_note,year_id,class_id,subject_id,archived,revision"),
    rows<Step>("task_steps","id,task_id,title,done,position"),
    rows<Appointment>("events","id,title,starts_at,ends_at,notes,revision"),
    rows<{id:string;year:number}>("academic_years","id,year"),
    rows<SchoolOption>("classes","id,name,year_id"), rows<SchoolOption>("subjects","id,name"),
    detail ? rows<History>("audit_events","id,entity,operation,created_at,before_data,after_data",detail) : [],
  ]);
  const screen=params.tela||"inicio";
  const materials=materialScreens.includes(screen);
  const deliveryId=screen==="entrega" && /^[a-f\d-]{36}$/i.test(params.id||"") ? params.id : undefined;
  const [deliveries,teachers,assignments,requests,versions,files,changes]=await Promise.all([
    materials||screen==="agenda"||screen==="inicio" ? rows<Delivery>("delivery_summary","*") : [],
    materials ? rows<Teacher>("teachers","id,name,contact,active") : [],
    screen==="professores" ? rows<Assignment>("teaching_assignments","*") : [],
    materials ? rows<RequestRow>("material_requests","*") : [],
    deliveryId ? rows<Receipt>("receipt_versions","*",deliveryId,"obligation_id") : [],
    deliveryId ? rows<Attachment>("attachments","id,version_id,file_name,byte_size,ready,receipt_versions!inner(obligation_id)",deliveryId,"receipt_versions.obligation_id") : [],
    deliveryId ? rows<ChangeLog>("audit_events","id,created_at,before_data,after_data",deliveryId,"record_id") : []
  ]);
  return <div className="school-work"><div className="school-bar"><div><small>MINHA ESCOLA</small><strong>{school.name}</strong></div>
    {schools.length>1 && <nav aria-label="Escolher escola">{schools.map(s=><a key={s.id} href={"/painel?escola="+s.id}>{s.name}</a>)}</nav>}
    <form action={logout}><button className="quiet">Sair</button></form></div>
    <Routine key={school.id} school={school.id} screen={params.tela||"inicio"} selected={params.id||""}
      now={new Date().toISOString()} tasks={tasks} steps={steps} events={events} history={history}
      materials={{deliveries,teachers,assignments,requests,versions,files,history:changes}}
      catalog={{years:years.sort((a,b)=>b.year-a.year).map(y=>({id:y.id,name:String(y.year)})),classes,subjects}} />
  </div>;
}

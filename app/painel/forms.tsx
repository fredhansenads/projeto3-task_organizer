"use client";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { areas, priorities, statuses, localStamp, type Appointment, type Catalog, type SchoolOption, type Step, type Task } from "../../lib/rotina";
import { save } from "./mutations";

type Change=Parameters<typeof save>[1];
type Context={school:string; link:(screen:string,id?:string)=>string};
function SaveForm({school,change,after,button,children}:{school:string;change:(data:FormData)=>Change;after:string;button:string;children?:ReactNode}) {
  const router=useRouter();
  const guard=useRef(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(guard.current) return;
    const data=new FormData(e.currentTarget);
    const source=window.location.pathname+window.location.search;
    guard.current=true; setPending(true); setError("");
    try {
      const result=await save(school,change(data));
      if(result.error) setError(result.error);
      else if(source!==after && source===window.location.pathname+window.location.search) router.push(after);
    } catch {setError("A conexão falhou. Seus dados continuam no formulário. Tente novamente.");}
    finally {guard.current=false; setPending(false);}
  }
  return <form onSubmit={submit}>{children}{error && <p role="alert">{error}</p>}<button disabled={pending}>{pending?"Salvando…":button}</button></form>;
}
function options(items:SchoolOption[]) {return items.map(o=><option key={o.id} value={o.id}>{o.name}</option>);}
export function TaskForm({task,steps,catalog,school,link}:{task?:Task;steps:Step[];catalog:Catalog}&Context) {
  const [revision]=useState(task?.revision||0);
  const [id]=useState(()=>task?.id || crypto.randomUUID());
  const [list,setList]=useState(steps.map(({id,title,done})=>({id,title,done})));
  const [year,setYear]=useState(task?.year_id || "");
  const [classId,setClass]=useState(task?.class_id || "");
  const due=task?.due_at ? localStamp(task.due_at).split("T") : [task?.due_date||"",""];
  return <section><small>MINHAS TAREFAS</small><h1>{task?"Editar tarefa":"Nova tarefa"}</h1>
    <SaveForm school={school} after={link("tarefa",id)} button="Salvar tarefa" change={data=>({
      kind:"task",id,revision,fields:Object.fromEntries([...data].map(([k,v])=>[k,String(v)])),steps:list
    })}>
      <label>Título<input name="title" required maxLength={240} defaultValue={task?.title}/></label>
      <div className="fields"><label>Área<select aria-label="Área" name="area" defaultValue={task?.area||"coordenacao"}>{Object.entries(areas).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <label>Prioridade<select aria-label="Prioridade" name="priority" defaultValue={task?.priority||"normal"}>{Object.entries(priorities).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <label>Situação<select aria-label="Situação" name="status" defaultValue={task?.status||"pendente"}>{Object.entries(statuses).filter(([k])=>k!=="concluida").map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
      <label>Descrição<textarea name="description" defaultValue={task?.description||""}/></label>
      <div className="fields"><label>Data do prazo<input type="date" name="date" defaultValue={due[0]}/></label>
      <label>Horário opcional<input type="time" name="time" defaultValue={due[1]}/></label></div>
      <div className="fields"><label>Ano letivo<select aria-label="Ano letivo" name="year" value={year} onChange={e=>{setYear(e.target.value);setClass("");}}><option value="">Sem vínculo</option>{options(catalog.years)}</select></label>
      <label>Turma<select aria-label="Turma" name="class" value={classId} onChange={e=>setClass(e.target.value)}><option value="">Sem turma</option>{options(catalog.classes.filter(c=>c.year_id===year))}</select></label>
      <label>Disciplina<select aria-label="Disciplina" name="subject" defaultValue={task?.subject_id||""}><option value="">Sem disciplina</option>{options(catalog.subjects)}</select></label></div>
      <label>Observações<textarea name="notes" defaultValue={task?.notes||""}/></label>
      <fieldset><legend>Etapas da tarefa</legend>{list.map((s,i)=><div key={s.id} className="step-row">
        <input aria-label={"Etapa "+(i+1)+" realizada"} type="checkbox" checked={s.done} onChange={e=>setList(list.map(item=>item.id===s.id?{...item,done:e.target.checked}:item))}/>
        <input aria-label={"Título da etapa "+(i+1)} required value={s.title} onChange={e=>setList(list.map(item=>item.id===s.id?{...item,title:e.target.value}:item))}/>
        <button type="button" className="quiet" aria-label={"Remover etapa "+(i+1)} onClick={()=>setList(list.filter(item=>item.id!==s.id))}>Remover</button></div>)}
        <button type="button" className="quiet" disabled={list.length>=100} onClick={()=>setList([...list,{id:crypto.randomUUID(),title:"",done:false}])}>Adicionar etapa</button></fieldset>
    </SaveForm></section>;
}
export function Actions({task,steps,school,link}:{task:Task;steps:Step[]}&Context) {
  const pending=steps.filter(s=>!s.done).length;
  function action(op:string,label:string,children?:ReactNode) {
    return <SaveForm school={school} after={link("tarefa",task.id)} button={label} change={d=>({
      kind:"transition",id:task.id,revision:task.revision,operation:op,confirmed:d.get("confirm")==="on",note:String(d.get("note")||"")
    })}>{children}</SaveForm>;
  }
  if(task.archived) return action("restore","Restaurar tarefa");
  return <div className="actions">{task.completed_at ? action("reopen","Reabrir tarefa") :
    action("complete","Marcar como realizada",<><label>Observação da conclusão <textarea name="note" rows={2}/></label>
      {pending>0 && <label className="check"><input type="checkbox" name="confirm" required/>Concluir mesmo com {pending} etapa(s) pendente(s)</label>}</>)}
    <details><summary>Arquivamento</summary><p>A tarefa ficará disponível em Arquivadas.</p>{action("archive","Arquivar tarefa")}</details></div>;
}
export function EventForm({event,school,link,day}:{event?:Appointment;day:string}&Context) {
  const [revision]=useState(event?.revision||0);
  const [id]=useState(()=>event?.id || crypto.randomUUID());
  const [start,setStart]=useState(event?localStamp(event.starts_at):day+"T08:00");
  return <section><small>AGENDA</small><h1>{event?"Editar compromisso":"Novo compromisso"}</h1>
    <SaveForm school={school} after={link("compromisso",id)} button="Salvar compromisso" change={d=>({
      kind:"event",id,revision,title:String(d.get("title")),start,end:String(d.get("end")),note:String(d.get("note")||"")
    })}>
    <label>Título<input name="title" required defaultValue={event?.title} maxLength={240}/></label>
    <div className="fields"><label>Início<input type="datetime-local" value={start} required onChange={e=>setStart(e.target.value)}/></label>
    <label>Término<input name="end" type="datetime-local" defaultValue={event?localStamp(event.ends_at):day+"T09:00"} min={start} required/></label></div>
    <label>Observações<textarea name="note" defaultValue={event?.notes||""}/></label></SaveForm></section>;
}

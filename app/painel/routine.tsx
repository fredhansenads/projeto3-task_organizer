"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { areas, priorities, statuses, br, display, dueDay, dueText, late, localDay, localStamp, calendarDays, shiftDay,
  type Appointment, type Catalog, type Task, type Step, type History } from "../../lib/rotina";
import { Actions, EventForm, TaskForm } from "./forms";
import Materials from "./materials";
import Reports,{Metrics} from "./reports";
import {currentCompletions,deliveryTotals,type Activity} from "../../lib/reporting";
import {materialScreens,type Delivery,type MaterialData} from "../../lib/materiais";

type Props={school:string;screen:string;selected:string;now:string;tasks:Task[];steps:Step[];events:Appointment[];history:History[];catalog:Catalog;materials:MaterialData};
type Href=(screen:string,id?:string)=>string;
const tabs={inicio:"Início",tarefas:"Minhas tarefas",realizadas:"Realizadas",agenda:"Agenda",entregas:"Entregas",professores:"Professores",cadastros:"Turmas e disciplinas",arquivadas:"Arquivadas",relatorios:"Relatórios"};
function TaskList({items,link,now}:{items:Task[];link:Href;now:string}) {
  return items.length ? <ul className="records">{items.map(t=><li key={t.id}><div><Link href={link("tarefa",t.id)}>{t.title}</Link>
    <small>{areas[t.area]} · {priorities[t.priority]} · {statuses[t.status]}</small></div>
    <span>{dueText(t)}{late(t,now) && <b className="late">{t.completed_at?"Concluída após o prazo":"Atrasada"}</b>}</span></li>)}</ul>
    : <p className="empty">Nenhuma tarefa nesta seleção.</p>;
}
function Tasks({tasks,screen,link,now,catalog}:{tasks:Task[];screen:string;link:Href;now:string;catalog:Catalog}) {
  const [filter,set]=useState<Record<string,string>>({});
  function field(key:string,label:string,choices?:Record<string,string>,type="text") {
    const props={value:filter[key]||"",onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>set({...filter,[key]:e.target.value})};
    return <label>{label}{choices?<select aria-label={label} {...props}><option value="">Todas</option>{Object.entries(choices).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>:<input type={type} {...props}/>}</label>;
  }
  const choices=(items:{id:string;name:string}[])=>Object.fromEntries(items.map(x=>[x.id,x.name]));
  const items=tasks.filter(t=>{
    if(screen==="arquivadas"?!t.archived:t.archived||(screen==="realizadas")!==!!t.completed_at) return false;
    const day=screen==="realizadas"&&t.completed_at?localDay(t.completed_at):dueDay(t);
    return Object.entries({area:t.area,status:t.status,priority:t.priority,year:t.year_id,class:t.class_id,subject:t.subject_id}).every(([k,v])=>!filter[k]||filter[k]===v)
      && (!filter.from || day>=filter.from) && (!filter.to || (!!day && day<=filter.to))
      && [t.title,t.description,t.notes].join(" ").toLocaleLowerCase("pt-BR").includes((filter.text||"").trim().toLocaleLowerCase("pt-BR"));
  }).sort((a,b)=>screen==="realizadas"?(b.completed_at||"").localeCompare(a.completed_at||""):(dueDay(a)||"9999").localeCompare(dueDay(b)||"9999")||a.title.localeCompare(b.title));
  return <section><div className="heading"><h1>{tabs[screen as keyof typeof tabs]}</h1><Link className="cta" href={link("nova")}>Nova tarefa</Link></div>
    <div className="search">{field("text","Buscar tarefa")}</div><details><summary>Filtros</summary><div className="fields">
      {field("area","Área",areas)}{field("status","Situação",statuses)}{field("priority","Prioridade",priorities)}
      {field("year","Ano letivo",choices(catalog.years))}{field("class","Turma",choices(catalog.classes))}{field("subject","Disciplina",choices(catalog.subjects))}
      {field("from",screen==="realizadas"?"Conclusão de":"Prazo de",undefined,"date")}{field("to","Até",undefined,"date")}</div>
      <button className="quiet" onClick={()=>set({})}>Limpar filtros</button></details>
    <p>{items.length} tarefa(s)</p><TaskList items={items} link={link} now={now}/></section>;
}

function Calendar({tasks,events,today,link,deliveries}:{tasks:Task[];events:Appointment[];today:string;link:Href;deliveries:Delivery[]}) {
  const [anchor,setAnchor]=useState(today),[month,setMonth]=useState(false);
  const days=calendarDays(anchor,month);
  function move(delta:number) {
    if(!month) return setAnchor(shiftDay(anchor,7*delta));
    const date=new Date(anchor.slice(0,7)+"-01T12:00:00Z"); date.setUTCMonth(date.getUTCMonth()+delta); setAnchor(date.toISOString().slice(0,10));
  }
  return <section><div className="heading"><h1>Agenda</h1><Link className="cta" href={link("novo-compromisso")}>Novo compromisso</Link></div>
    <div className="tools"><button className="quiet" onClick={()=>move(-1)}>Anterior</button><button className="quiet" onClick={()=>setAnchor(today)}>Hoje</button>
    <button className="quiet" onClick={()=>move(1)}>Próximo</button><label>Visualização<select aria-label="Visualização" value={month?"mes":"semana"} onChange={e=>setMonth(e.target.value==="mes")}><option value="semana">Semana</option><option value="mes">Mês</option></select></label>
    <label>Ir para a data<input type="date" value={anchor} onChange={e=>{if(e.target.value) setAnchor(e.target.value);}}/></label></div>
    <h2>{month?new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(anchor+"T12:00Z")):br(days[0])+" a "+br(days[6])}</h2>
    <div className="calendar">{days.map(day=><div key={day} className={day===today?"day today":"day"}>
      <strong>{new Intl.DateTimeFormat("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit",timeZone:"UTC"}).format(new Date(day+"T12:00Z"))}</strong>
      {tasks.filter(t=>!t.archived&&dueDay(t)===day).map(t=><Link key={t.id} href={link("tarefa",t.id)}>Prazo · {t.title}</Link>)}
      {deliveries.filter(d=>d.state!=="dispensado" && (dueDay(d)===day || (d.review==="ajustes" && d.correction_due===day))).map(d=><Link key={d.id} href={link("entrega",d.id)}>{d.review==="ajustes" && d.correction_due===day?"Correção":"Entrega"} · {d.teacher_name} · {d.request_title}</Link>)}
      {events.filter(e=>localDay(e.starts_at)<=day && localDay(e.ends_at)>=day).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).map(e=><Link key={e.id} href={link("compromisso",e.id)}>{localDay(e.starts_at)===day?localStamp(e.starts_at).slice(11):"Continua"} · {e.title}</Link>)}</div>)}</div></section>;
}
function historyText(h:History) {
  const before=h.before_data,after=h.after_data;
  if(h.entity==="task_steps") return (h.operation==="DELETE"?"Etapa removida":h.operation==="INSERT"?"Etapa adicionada":after?.done?"Etapa marcada ou atualizada":"Etapa atualizada")+" · "+(after?.title||before?.title);
  if(!before) return "Tarefa criada · "+after?.title;
  if(!after) return "Tarefa removida";
  const changes:string[]=[];
  if(before.archived!==after.archived) changes.push(after.archived?"Arquivada":"Restaurada");
  if(before.status!==after.status && after.status) changes.push(after.completed_at?"Concluída"+(after.completion_note?" · "+after.completion_note:""):before.completed_at?"Reaberta":statuses[after.status]);
  if(before.title!==after.title) changes.push("Título: "+before.title+" → "+after.title);
  if(before.due_date!==after.due_date||before.due_at!==after.due_at) {
    const due=(s:Partial<Task>)=>dueText({due_date:s.due_date||null,due_at:s.due_at||null});
    changes.push("Prazo: "+due(before)+" → "+due(after));
  }
  return changes.join(" · ")||"Tarefa atualizada";
}
export default function Routine(p:Props & {schoolName:string;activity:Activity[]}) {
  const {school,screen,selected,steps,events,tasks,catalog}=p;
  const [now,setNow]=useState(p.now);
  const [menuOpen,setMenuOpen]=useState(false);
  const totals=deliveryTotals(p.materials.deliveries);
  useEffect(()=>{setNow(p.now);const timer=setInterval(()=>setNow(new Date().toISOString()),30000);return ()=>clearInterval(timer);},[p.now]);
  const today=localDay(now);
  const link:Href=(screen,id)=>"/painel?"+new URLSearchParams({escola:school,tela:screen,...(id?{id}:{})});
  const task=tasks.find(t=>t.id===selected),event=events.find(e=>e.id===selected);
  const checklist=steps.filter(s=>s.task_id===selected).sort((a,b)=>a.position-b.position);
  const active=tasks.filter(t=>!t.archived&&!t.completed_at);
  const upcoming=events.filter(e=>Date.parse(e.ends_at)>=Date.parse(now)).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,5);
  const missed=<section><h1>Registro indisponível</h1><Link href={link("inicio")}>Voltar ao início</Link></section>;
  let content;
  if(screen==="nova" || screen==="editar") content=screen==="editar"&&(!task||task.archived||task.completed_at)?missed:<TaskForm key={screen+selected} task={screen==="editar"?task:undefined} steps={screen==="editar"?checklist:[]} catalog={catalog} school={school} link={link}/>;
  else if(screen==="tarefa") content=!task?missed:<section><small>{task.archived?"ARQUIVADA":statuses[task.status].toLocaleUpperCase("pt-BR")}</small>
    <div className="heading"><h1>{task.title}</h1>{!task.archived&&!task.completed_at&&<Link className="cta" href={link("editar",task.id)}>Editar tarefa e etapas</Link>}</div>
    <p>{areas[task.area]} · Prioridade {priorities[task.priority].toLowerCase()} · {dueText(task)}
    {late(task,now)&&<b className="late">{task.completed_at?"Concluída após o prazo":"Atrasada"}</b>}</p>
    <p>{[...catalog.years,...catalog.classes,...catalog.subjects].filter(c=>[task.year_id,task.class_id,task.subject_id].includes(c.id)).map(c=>c.name).join(" · ")}</p>
    {task.description&&<p className="multiline">{task.description}</p>}{task.notes&&<p className="multiline">Observações: {task.notes}</p>}
    {task.completed_at&&<p>Realizada em {display(task.completed_at)}. {task.completion_note}</p>}
    {checklist.length>0 && <><h2>Etapas</h2><ul>{checklist.map(s=><li key={s.id}>{s.done?"✓ Realizada":"○ Pendente"} · {s.title}</li>)}</ul></>}
    <Actions key={task.id+":"+task.revision} task={task} steps={checklist} school={school} link={link}/>
    <h2>Histórico</h2><ul className="history">{[...p.history].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(h=><li key={h.id}><time>{display(h.created_at)}</time> · {historyText(h)}</li>)}</ul></section>;
  else if(["tarefas","realizadas","arquivadas"].includes(screen)) content=<Tasks key={screen} {...{tasks,screen,link,now,catalog}}/>;
  else if(screen==="agenda") content=<Calendar {...{tasks,events,today,link}} deliveries={p.materials.deliveries}/>;
  else if(screen==="relatorios") content=<Reports school={p.schoolName} initial={selected} now={now} link={link}
    source={{tasks,activity:p.activity,catalog,deliveries:p.materials.deliveries,requests:p.materials.requests}}/>;
  else if(materialScreens.includes(screen)) content=<Materials key={screen+selected} {...{school,screen,selected,catalog,link,now}} data={p.materials}/>;
  else if(screen==="novo-compromisso"||screen==="editar-compromisso") content=screen==="editar-compromisso"&&!event?missed:<EventForm key={screen+selected} event={event} school={school} day={today} link={link}/>;
  else if(screen==="compromisso") content=!event?missed:<section><small>COMPROMISSO</small><h1>{event.title}</h1><p>{display(event.starts_at)} até {display(event.ends_at)}</p><p className="multiline">{event.notes}</p><Link className="cta" href={link("editar-compromisso",event.id)}>Editar compromisso</Link></section>;
  else content=<section><small>{br(today)}</small><div className="heading"><h1>Minha rotina de hoje</h1><Link className="cta" href={link("nova")}>Nova tarefa</Link></div>
    <h2>Tarefas de hoje</h2><TaskList items={active.filter(t=>dueDay(t)===today)} link={link} now={now}/>
    <h2>Atrasadas</h2><TaskList items={active.filter(t=>late(t,now))} link={link} now={now}/>
    <h2>Indicadores da escola</h2><Metrics values={[["Minhas tarefas realizadas",currentCompletions(tasks).length],["Materiais exigidos",totals.required],["Recebidos",totals.received],["Conferidos",totals.approved],["Pendentes",totals.pending],["Taxa de recebimento",totals.rate]]}/>
    <div className="tools"><Link href={link("relatorios")}>Consultar relatório de entregas</Link><Link href={link("relatorios","realizadas")}>Consultar relatório de realizadas</Link></div>
    <h2>Materiais pendentes</h2><Link href={link("entregas")}>{totals.pending} entrega(s) pendente(s) · Ver solicitações</Link>
    <h2>Próximos compromissos</h2>{upcoming.length?<ul className="records">{upcoming.map(e=><li key={e.id}><Link href={link("compromisso",e.id)}>{e.title}</Link>{display(e.starts_at)}</li>)}</ul>:<p>Nenhum compromisso agendado.</p>}</section>;
  return <><button className="quiet mobile-menu" aria-controls="routine-nav" aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>Menu da escola</button>
    <nav id="routine-nav" className={"routine-nav"+(menuOpen?" expanded":"")} aria-label="Rotina escolar">{Object.entries(tabs).map(([k,v])=><Link key={k} onClick={()=>setMenuOpen(false)} aria-current={screen===k?"page":undefined} href={link(k)}>{v}</Link>)}</nav>{content}</>;
}

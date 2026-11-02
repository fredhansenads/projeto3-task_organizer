"use client";
import Link from "next/link";
import {useState} from "react";
import {type Delivery,stateLabels,reviewLabels,channels} from "../../lib/materiais";
import {br,display,dueText,late,localDay,localStamp} from "../../lib/rotina";
import Faculty from "./faculty";
import {deliveryTotals} from "../../lib/reporting";
import {Checks,Command,Deadline,SchoolFields,type Context} from "./material-forms";

function Badge({d,now}:{d:Delivery;now:string}) {
  const overdue=d.state==="pendente" && late({...d,completed_at:null},now);
  return <span>{stateLabels[d.state]}{d.review && " · "+reviewLabels[d.review]}{(overdue||d.first_late)&&<b className="late">{d.first_late?"Primeira entrega atrasada":"Prazo vencido"}</b>}</span>;
}
function Detail(p:Context,d:Delivery) {
  const {data,school,link,now}=p, versions=[...data.versions].sort((a,b)=>b.version-a.version);
  const current=versions.find(v=>!v.invalid_reason);
  const hidden={id:d.id,revision:String(d.revision)};
  const first=versions.filter(v=>!v.invalid_reason).at(-1);
  return <section><Link href={link("solicitacao",d.request_id)}>Voltar à solicitação</Link><h1>{d.teacher_name}</h1>
    <h2>{d.request_title}</h2><Badge d={d} now={now}/><p>Prazo aplicável: {dueText(d)}</p>
    {first&&<p>Primeira entrega válida: {display(first.received_at)} · Prazo no recebimento: {dueText({due_date:first.original_date,due_at:first.original_at})}</p>}
    {d.exemption_reason&&<p>Motivo da dispensa: {d.exemption_reason}</p>}
    {d.review==="ajustes" && d.correction_due && <p>Correção até {br(d.correction_due)}{localDay(now)>d.correction_due?" · Prazo de correção vencido":""}</p>}
    {d.state!=="dispensado" && (!current||current.review==="ajustes") && <div className="material-card"><h2>{current?"Receber nova versão":"Registrar recebimento"}</h2>
      <Command school={school} op="receive" label="Salvar recebimento" hidden={hidden}>
        <div className="fields"><label>Data real da entrega<input name="received" type="datetime-local" defaultValue={localStamp(now)} max={localStamp(now)} required/></label>
        <label>Canal<select aria-label="Canal" name="channel">{Object.entries(channels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
        <label>Observações<textarea name="notes"/></label><label>Link do material (opcional)<input name="link" type="url" placeholder="https://"/></label>
        <p>Após salvar, você poderá anexar arquivos a esta versão.</p></Command></div>}
    {d.review==="aguardando"&&<div className="material-card"><h2>Conferência</h2><Command school={school} op="approve" label="Marcar como conferido" hidden={hidden}/>
      <details><summary>Solicitar ajustes</summary><Command school={school} op="adjust" label="Enviar orientação de ajuste" hidden={hidden}>
        <label>Orientação<textarea name="reason" required/></label><label>Prazo de correção<input name="correction" type="date" required/></label></Command></details></div>}
    <h2>Versões e anexos</h2>{!versions.length&&<p>Nenhuma entrega registrada.</p>}
    {versions.map(v=><article key={v.id} className="material-card"><strong>Versão {v.version} · {v.invalid_reason?"Invalidada":reviewLabels[v.review]}</strong>
      <p>Entregue em {display(v.received_at)} · {channels[v.channel]||v.channel}<br/>Registrada no sistema em {display(v.created_at)}</p>
      {v.notes&&<p className="multiline">{v.notes}</p>}{v.link&&/^https?:\/\//i.test(v.link)&&<a href={v.link} target="_blank" rel="noreferrer">Abrir link do material</a>}
      {v.guidance&&<p>Orientação: {v.guidance}{v.correction_due&&" · Correção até "+br(v.correction_due)}</p>}{v.invalid_reason&&<p>Motivo da invalidação: {v.invalid_reason}</p>}
      {data.files.filter(f=>f.version_id===v.id).map(f=><div key={f.id}>{f.ready?<a href={"/anexos/"+f.id}>Baixar {f.file_name}</a>:<details><summary>Envio pendente · {f.file_name}</summary>
        <Command school={school} op="confirm" label="Verificar arquivo no armazenamento" hidden={{id:f.id}}/>
        <Upload p={p} version={v.id} attachment={f.id}/></details>}</div>)}
      {!v.invalid_reason&&<details><summary>Anexar arquivo à versão {v.version}</summary><Upload p={p} version={v.id}/></details>}</article>)}
    <details><summary>Alterar prazo individual</summary><Command school={school} op="deadline" label="Alterar prazo deste professor" hidden={{id:d.request_id,ids:d.id}}>
      <Deadline/><label>Justificativa<textarea name="reason" required/></label></Command></details>
    {d.state==="pendente"&&<details><summary>Dispensar entrega</summary><Command school={school} op="exempt" label="Confirmar dispensa" hidden={hidden}><label>Motivo da dispensa<textarea name="reason" required/></label></Command></details>}
    {d.state==="dispensado"&&<Command school={school} op="reactivate" label="Reativar entrega" hidden={hidden}/>}
    {current&&<details><summary>Invalidar última versão</summary><p>O registro e seus anexos permanecem no histórico.</p><Command school={school} op="invalidate" label="Confirmar invalidação" hidden={hidden}>
      <label>Motivo da invalidação<textarea name="reason" required/></label></Command></details>}
    <h2>Histórico do acompanhamento</h2><ul>{[...data.history].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(h=>{
      const before=h.before_data,after=h.after_data;
      const change=!before?"Professor incluído":dueText(before)!==dueText(after)?"Prazo: "+dueText(before)+" → "+dueText(after)+" · "+after.change_reason:
        before.exemption_reason!==after.exemption_reason?(after.exemption_reason?"Dispensado · "+after.exemption_reason:"Reativado"):"";
      return change?<li key={h.id}>{display(h.created_at)} · {change}</li>:null;
    })}</ul></section>;
}
function Upload({p,version,attachment}:{p:Context;version:string;attachment?:string}) {
  return <Command school={p.school} op="upload" label={attachment?"Reenviar arquivo":"Enviar arquivo"} hidden={{version,...(attachment?{attachment}:{})}}>
    <label>Arquivo (até 10 MiB)<input type="file" name="file" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" required/></label></Command>;
}
export default function Materials(p:Context) {
  const {screen,data,catalog,school,selected,link}=p;
  const [filter,setFilter]=useState(""),[query,setQuery]=useState("");
  const active=data.teachers.filter(t=>t.active).sort((a,b)=>a.name.localeCompare(b.name));
  if(screen==="professores"||screen==="cadastros") return <Faculty {...p}/>;
  if(screen==="nova-solicitacao") return <section><small>ENTREGAS</small><h1>Nova solicitação</h1><Command school={school} op="request" label="Criar solicitação" after={id=>link("solicitacao",id)}>
    <label>Título do material<input name="title" required/></label><div className="fields"><label>Tipo de material<input name="type" required placeholder="Plano de aula"/></label>
    <label>Período de referência<input name="period" required placeholder="1º bimestre"/></label></div>
    <SchoolFields catalog={catalog} optional/><label>Orientações<textarea name="instructions"/></label><Deadline/>
    <Checks label="Professores envolvidos" items={active}/>{!active.length&&<Link href={link("professores")}>Cadastrar professor</Link>}</Command></section>;
  if(screen==="entrega") {
    const obligation=data.deliveries.find(d=>d.id===selected);
    return obligation?Detail(p,obligation):<section><h1>Entrega indisponível</h1></section>;
  }
  const req=data.requests.find(r=>r.id===selected);
  if(screen==="solicitacao"&&!req) return <section><h1>Solicitação indisponível</h1></section>;
  const rows=data.deliveries.filter(d=>screen!=="solicitacao"||d.request_id===selected);
  const shown=rows.filter(d=>(!filter||d.state===filter||d.review===filter) && (d.teacher_name+" "+d.request_title).toLowerCase().includes(query.trim().toLowerCase()));
  const {required,received,approved,rate}=deliveryTotals(shown);
  return <section><small>ACOMPANHAMENTO DE MATERIAIS</small><div className="heading"><h1>{req?req.title:"Entregas dos professores"}</h1><Link className="cta" href={link("nova-solicitacao")}>Nova solicitação</Link></div>
    {req?<><p>{req.material_type} · {req.period} · Prazo padrão: {dueText(req)}</p>
      <p>{[...catalog.years,...catalog.classes,...catalog.subjects].filter(c=>[req.year_id,req.class_id,req.subject_id].includes(c.id)).map(c=>c.name).join(" · ")}</p>
      {req.instructions&&<p className="multiline">{req.instructions}</p>}
      <details><summary>Adicionar professores</summary><Command school={school} op="add_teachers" label="Adicionar selecionados" hidden={{id:req.id}}>
        <Checks label="Professores disponíveis" items={active.filter(t=>!rows.some(d=>d.teacher_id===t.id))}/></Command></details>
      <details><summary>Alterar prazo coletivo</summary><Command school={school} op="deadline" label="Aplicar novo prazo" hidden={{id:req.id,collective:"on"}}>
        <Deadline/><label>Justificativa<textarea name="reason" required/></label>
        <Checks label="Aplicar também a estes acompanhamentos" items={rows.map(d=>({id:d.id,name:d.teacher_name}))}/></Command></details></>:
      <><h2>Solicitações</h2>{data.requests.length?<ul className="records">{data.requests.map(r=><li key={r.id}><Link href={link("solicitacao",r.id)}>{r.title}</Link><span>{r.period} · {dueText(r)}</span></li>)}</ul>:<p>Crie a primeira solicitação para acompanhar as entregas.</p>}</>}
    <h2>Acompanhamentos individuais</h2><p>{received} recebido(s) de {required} exigido(s) · {approved} conferido(s) · Recebimento: {rate}</p>
    <div className="fields"><label>Buscar professor ou material<input value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label>Situação<select aria-label="Situação da entrega" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Todas</option>{Object.entries({...stateLabels,...reviewLabels}).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
    <ul className="records">{shown.map(d=><li key={d.id}><div><Link href={link("entrega",d.id)}>{d.teacher_name} · {d.request_title}</Link><small>Prazo: {dueText(d)}</small></div><Badge d={d} now={p.now}/></li>)}</ul>{!shown.length&&<p>Nenhum acompanhamento nesta seleção.</p>}</section>;
}

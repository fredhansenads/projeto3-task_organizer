"use client";
import Link from "next/link";
import {Command,Pick,SchoolFields,type Context} from "./material-forms";
import {stateLabels} from "../../lib/materiais";

export default function Faculty(p:Context) {
  const {data,school,catalog,screen,link}=p;
  const label=(id:string)=>[...catalog.years,...catalog.classes,...catalog.subjects].find(i=>i.id===id)?.name;
  if(screen==="cadastros") return <section><small>ORGANIZAÇÃO ESCOLAR</small><h1>Turmas e disciplinas</h1>
    <div className="catalog-grid"><div><h2>Anos letivos</h2><p>{catalog.years.map(x=>x.name).join(" · ")||"Nenhum ano cadastrado."}</p>
      <Command school={school} op="year" label="Adicionar ano"><label>Ano<input name="year" type="number" min={1900} max={2200} required/></label></Command></div>
    <div><h2>Turmas</h2><ul>{catalog.classes.map(c=><li key={c.id}>{c.name} · {label(c.year_id!)}</li>)}</ul>
      <Command school={school} op="class" label="Adicionar turma"><Pick name="year" label="Ano da turma" items={catalog.years}/><label>Nome da turma<input name="name" required/></label></Command></div>
    <div><h2>Disciplinas</h2><p>{catalog.subjects.map(x=>x.name).join(" · ")||"Nenhuma disciplina cadastrada."}</p>
      <Command school={school} op="subject" label="Adicionar disciplina"><label>Nome da disciplina<input name="name" required/></label></Command></div></div></section>;
  return <section><small>EQUIPE ESCOLAR</small><h1>Professores</h1>
    <details open={!data.teachers.length}><summary>Cadastrar professor</summary><Command school={school} op="teacher" label="Salvar professor">
      <label>Nome do professor<input name="name" required/></label><label>Contato opcional<input name="contact"/></label></Command></details>
    {data.teachers.length===0&&<p>Cadastre o primeiro professor para solicitar materiais.</p>}
    {data.teachers.map(t=><details className="material-card" key={t.id}><summary>{t.name} · {t.active?"Ativo":"Inativo"}</summary><p>{t.contact}</p>
      <details><summary>Editar cadastro</summary><Command school={school} op="teacher" label="Salvar alterações" hidden={{id:t.id}}>
        <label>Nome<input name="name" required defaultValue={t.name}/></label><label>Contato<input name="contact" defaultValue={t.contact||""}/></label></Command></details>
      <Command school={school} op="teacher_active" label={t.active?"Inativar professor":"Reativar professor"} hidden={{id:t.id,active:String(!t.active)}}/>
      <h2>Vínculos docentes</h2>{data.assignments.filter(a=>a.teacher_id===t.id).map(a=><div key={a.id}><p>{label(a.year_id)} · {label(a.class_id)} · {label(a.subject_id)} · {a.active?"Ativo":"Encerrado"}</p>
        {a.active&&<Command school={school} op="unassign" label="Encerrar vínculo" hidden={{id:a.id}}/>}</div>)}
      {t.active&&<details><summary>Vincular turma e disciplina</summary><Command school={school} op="assign" label="Salvar vínculo" hidden={{teacher:t.id}}><SchoolFields catalog={catalog}/></Command></details>}
      <h2>Materiais solicitados</h2><ul>{data.deliveries.filter(d=>d.teacher_id===t.id).map(d=><li key={d.id}><Link href={link("entrega",d.id)}>{d.request_title} · {stateLabels[d.state]}</Link></li>)}</ul></details>)}</section>;
}

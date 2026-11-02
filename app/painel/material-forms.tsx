"use client";
import {useRef,useState,type FormEvent,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {materialAction} from "./material-actions";
import type {Choice,MaterialData} from "../../lib/materiais";
import type {Catalog} from "../../lib/rotina";

export type Context={school:string;screen:string;selected:string;catalog:Catalog;data:MaterialData;now:string;link:(screen:string,id?:string)=>string};
export function Command({school,op,label,hidden={},after,children}:{school:string;op:string;label:string;hidden?:Record<string,string>;after?:(id:string)=>string;children?:ReactNode}) {
  const router=useRouter(),busy=useRef(false),token=useRef("");
  const [working,setWorking]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(busy.current) return;
    const form=e.currentTarget, values=new FormData(form);
    for(const [key,value] of Object.entries(hidden)) values.set(key,value);
    token.current ||= crypto.randomUUID();
    busy.current=true; setWorking(true);setMessage("");
    try {
      const result=await materialAction(school,op,token.current,values);
      if(result.error) {setFailed(true);setMessage(result.error);return;}
      token.current=""; form.reset();setFailed(false);setMessage("Salvo.");
      if(after && result.id) router.push(after(result.id));
    } catch {setFailed(true);setMessage("Falha na conexão. Confira os dados e tente novamente.");}
    finally {busy.current=false;setWorking(false);}
  }
  return <form className="material-form" onSubmit={submit}>{children}
    {message&&<p role={failed?"alert":"status"}>{message}</p>}<button disabled={working}>{working?"Salvando…":label}</button></form>;
}
export function Pick({name,label,items,optional=false,value,onChange}:{name:string;label:string;items:Choice[];optional?:boolean;value?:string;onChange?:(v:string)=>void}) {
  return <label>{label}<select aria-label={label} name={name} required={!optional} value={value} onChange={onChange?e=>onChange(e.target.value):undefined}>
    <option value="">{optional?"Sem vínculo":"Selecione"}</option>{items.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>;
}
export function SchoolFields({catalog,optional=false}:{catalog:Catalog;optional?:boolean}) {
  const [year,setYear]=useState("");
  return <div className="fields"><Pick name="year" label="Ano letivo" items={catalog.years} value={year} onChange={setYear}/>
    <Pick key={year} name="class" label="Turma" items={catalog.classes.filter(c=>c.year_id===year)} optional={optional}/>
    <Pick name="subject" label="Disciplina" items={catalog.subjects} optional={optional}/></div>;
}
export function Checks({items,label}:{items:Choice[];label:string}) {
  return <fieldset><legend>{label}</legend>{items.map(i=><label className="check" key={i.id}><input type="checkbox" name="ids" value={i.id}/>{i.name}</label>)}
    {!items.length&&<p>Nenhum professor disponível nesta seleção.</p>}</fieldset>;
}
export function Deadline() {return <div className="fields"><label>Data do prazo<input type="date" name="date" required/></label><label>Horário opcional<input type="time" name="time"/></label></div>;}

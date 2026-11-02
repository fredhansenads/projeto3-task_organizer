"use client";
import Link from "next/link";
import {useState} from "react";
import {areas,br,priorities} from "../../lib/rotina";
import {reviewLabels,stateLabels} from "../../lib/materiais";
import {makeReport,emptyFilters,reportNames,reportCsv,type ReportKind,type ReportSource,type Filters,type Metric} from "../../lib/reporting";

export function Metrics({values}:{values:Metric[]}) {
  return <dl className="report-metrics">{values.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export default function Reports({source,school,now,initial,link}:{source:ReportSource;school:string;now:string;initial:string;link:(screen:string,id?:string)=>string}) {
  const [kind,setKind]=useState<ReportKind>(initial==="realizadas"||initial==="historico"?initial:"materiais");
  const [filters,setFilters]=useState<Filters>(emptyFilters);
  const set=(field:keyof Filters,value:string)=>setFilters(prev=>({...prev,[field]:value,...(field==="year"?{classId:"",request:""}:{})}));
  const invalid=!!filters.from&&!!filters.to&&filters.from>filters.to;
  const report=makeReport(kind,filters,source,now);
  const choice=(rows:{id:string;name:string}[])=>Object.fromEntries(rows.map(r=>[r.id,r.name]));
  const selects:{key:keyof Filters;label:string;options:Record<string,string>}[]=[
    {key:"year",label:"Ano letivo",options:choice(source.catalog.years)},
    {key:"classId",label:"Turma",options:choice(source.catalog.classes.filter(c=>!filters.year||c.year_id===filters.year))},
    {key:"subject",label:"Disciplina",options:choice(source.catalog.subjects)},
  ];
  if(kind==="materiais") selects.push(
    {key:"teacher",label:"Professor",options:Object.fromEntries(source.deliveries.map(d=>[d.teacher_id,d.teacher_name]))},
    {key:"request",label:"Solicitação",options:Object.fromEntries(source.requests.filter(r=>!filters.year||r.year_id===filters.year).map(r=>[r.id,r.title]))},
    {key:"state",label:"Recebimento",options:stateLabels},
    {key:"review",label:"Conferência",options:reviewLabels}
  ); else {
    selects.push({key:"area",label:"Área",options:areas},{key:"priority",label:"Prioridade",options:priorities});
    if(kind==="historico") selects.push({key:"action",label:"Ação",options:Object.fromEntries(["Criação","Edição","Conclusão","Reabertura","Arquivamento","Restauração"].map(v=>[v,v]))});
  }
  const criteria=[
    filters.from?"De "+br(filters.from):"",filters.to?"Até "+br(filters.to):"",
    ...selects.filter(s=>filters[s.key]).map(s=>s.label+": "+s.options[filters[s.key]]),
    filters.text.trim()?"Busca: "+filters.text.trim():""
  ].filter(Boolean).join(" · ")||"Todos os registros do relatório";
  function download() {
    const csv=reportCsv(reportNames[kind],school,criteria,report);
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="relatorio-"+kind+".csv";anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="report"><small>COORDENAÇÃO ESCOLAR</small><h1>Relatórios</h1>
    <div className="report-controls">
      <label>Tipo de relatório<select aria-label="Tipo de relatório" value={kind} onChange={e=>{setKind(e.target.value as ReportKind);setFilters(emptyFilters);}}>
        {Object.entries(reportNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <div className="fields"><label>De<input type="date" value={filters.from} onChange={e=>set("from",e.target.value)}/></label>
        <label>Até<input type="date" value={filters.to} onChange={e=>set("to",e.target.value)}/></label>
        <label>Buscar no relatório<input type="search" value={filters.text} onChange={e=>set("text",e.target.value)}/></label></div>
      <details><summary>Mais filtros</summary><div className="fields">{selects.map(s=><label key={s.key}>{s.label}
        <select aria-label={s.label} value={filters[s.key]} onChange={e=>set(s.key,e.target.value)}><option value="">Todos</option>
        {Object.entries(s.options).sort((a,b)=>a[1].localeCompare(b[1],"pt-BR")).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>)}</div></details>
      <div className="tools"><button className="quiet" onClick={()=>setFilters(emptyFilters)}>Limpar filtros</button>
        <button disabled={invalid} onClick={download}>Exportar CSV</button><button className="quiet" disabled={invalid} onClick={()=>window.print()}>Imprimir / salvar PDF</button></div>
    </div>
    {invalid?<p role="alert">A data final precisa ser igual ou posterior à inicial.</p>:<>
      <h2>{reportNames[kind]}</h2><p><strong>{school}</strong> · Horário de São Paulo</p>
      <p><strong>Filtros:</strong> {criteria}</p><p>{report.rule}</p>
      <Metrics values={report.metrics}/><p aria-live="polite">{report.rows.length} registro(s) na seleção.</p>
      {report.rows.length?<div className="report-scroll" role="region" aria-label="Detalhamento do relatório" tabIndex={0}>
        <table><caption>Detalhamento por {kind==="materiais"?"professor e solicitação":kind==="historico"?"evento":"tarefa"}</caption>
          <thead><tr>{report.headers.map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead>
          <tbody>{report.rows.map(r=><tr key={r.id}>{r.cells.map((cell,i)=>i===0?<th scope="row" key={i}><Link href={link(kind==="materiais"?"entrega":"tarefa",r.target)}>{cell}</Link></th>:<td key={i}>{cell}</td>)}</tr>)}</tbody>
        </table></div>:<p>Nenhum registro corresponde aos filtros.</p>}
    </>}
  </section>;
}

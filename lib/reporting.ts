import {areas,priorities,display,dueText,dueDay,late,localDay,type Task,type Catalog} from "./rotina";
import {reviewLabels,stateLabels,type Delivery,type RequestRow} from "./materiais";

export const reportNames={materiais:"Entregas de materiais",realizadas:"Tarefas realizadas",historico:"Histórico de tarefas"};
export type ReportKind=keyof typeof reportNames;
export type Activity=Pick<Task,"title"|"area"|"priority"|"year_id"|"class_id"|"subject_id">&{
  id:string;task_id:string;created_at:string;action:string
};
export type Filters={year:string;from:string;to:string;text:string;area:string;priority:string;classId:string;subject:string;teacher:string;request:string;state:string;review:string;action:string};
export const emptyFilters:Filters={year:"",from:"",to:"",text:"",area:"",priority:"",classId:"",subject:"",teacher:"",request:"",state:"",review:"",action:""};
export type Metric=[string,string|number];
type Line={id:string;target:string;cells:string[]};
export type Report={headers:string[];rows:Line[];metrics:Metric[];rule:string};
export const currentCompletions=(tasks:Task[])=>tasks.filter(t=>!t.archived && t.status==="concluida" && !!t.completed_at);
export function deliveryTotals(rows:Delivery[]) {
  const received=rows.filter(d=>d.state==="recebido").length;
  const pending=rows.filter(d=>d.state==="pendente").length;
  const required=received+pending;
  const approved=rows.filter(d=>d.state==="recebido"&&d.review==="aprovado").length;
  return {received,pending,required,approved,exempt:rows.length-required,rate:required?Math.round(100*received/required)+"%":"Não se aplica"};
}
export type ReportSource={tasks:Task[];deliveries:Delivery[];requests:RequestRow[];activity:Activity[];catalog:Catalog};
export function makeReport(kind:ReportKind,f:Filters,source:ReportSource,now:string):Report {
  const {tasks,deliveries,requests,activity,catalog}=source;
  const matches=(filter:string,value:string|null|undefined)=>!filter||filter===value;
  const inPeriod=(date:string)=>(!f.from||date>=f.from)&&(!f.to||(!!date&&date<=f.to));
  const text=f.text.toLocaleLowerCase("pt-BR").trim();
  const search=(value:string)=>value.toLocaleLowerCase("pt-BR").includes(text);
  const context=(row:{year_id:string|null;class_id:string|null;subject_id:string|null})=>
    matches(f.year,row.year_id)&&matches(f.classId,row.class_id)&&matches(f.subject,row.subject_id);
  const byId=new Map([...catalog.years,...catalog.classes,...catalog.subjects].map(i=>[i.id,i.name]));
  const name=(id:string|null)=>id?byId.get(id)||"—":"—";
  if(kind==="materiais") {
    const requestMap=new Map(requests.map(r=>[r.id,r]));
    const selected=deliveries.filter(d=>{
      const request=requestMap.get(d.request_id);
      return context({year_id:d.year_id,class_id:request?.class_id||null,subject_id:request?.subject_id||null})
        && matches(f.teacher,d.teacher_id)&&matches(f.request,d.request_id)&&matches(f.state,d.state)&&matches(f.review,d.review)
        && inPeriod(dueDay(d))&&search(d.teacher_name+" "+d.request_title);
    }).sort((a,b)=>a.teacher_name.localeCompare(b.teacher_name,"pt-BR")||a.request_title.localeCompare(b.request_title,"pt-BR"));
    const m=deliveryTotals(selected);
    return {rule:"Período pelo prazo individual. Cada professor conta uma vez por solicitação. Dispensados ficam fora do total exigido. A taxa divide recebidos por exigidos na seleção.",
      metrics:[["Exigidos",m.required],["Recebidos",m.received],["Conferidos",m.approved],["Pendentes",m.pending],["Dispensados",m.exempt],["Taxa de recebimento",m.rate]],
      headers:["Professor","Material","Prazo individual","Recebimento","Conferência","Primeira entrega válida","Pontualidade"],
      rows:selected.map(d=>({id:d.id,target:d.id,cells:[d.teacher_name,d.request_title,dueText(d),stateLabels[d.state],reviewLabels[d.review||""]||"—",d.first_received?display(d.first_received):"—",
        d.state==="recebido"?(d.first_late===null?"Sem referência":d.first_late?"Atrasada":"No prazo"):d.state==="pendente"&&late({...d,completed_at:null},now)?"Prazo vencido":"—"]}))};
  }
  const taskMatch=(t:Activity|Task)=>context(t)&&matches(f.area,t.area)&&matches(f.priority,t.priority)&&search(t.title);
  if(kind==="historico") {
    const selected=activity.filter(a=>taskMatch(a)&&inPeriod(localDay(a.created_at))&&matches(f.action,a.action))
      .sort((a,b)=>b.created_at.localeCompare(a.created_at));
    return {rule:"Período pela data da ação. Cada linha é um evento da sua tarefa, inclusive conclusões anteriores e reaberturas.",
      metrics:[["Eventos",selected.length],["Conclusões",selected.filter(a=>a.action==="Conclusão").length],["Reaberturas",selected.filter(a=>a.action==="Reabertura").length]],
      headers:["Tarefa","Data da ação","Ação","Área","Ano letivo"],
      rows:selected.map(a=>({id:a.id,target:a.task_id,cells:[a.title,display(a.created_at),a.action,areas[a.area],name(a.year_id)]}))};
  }
  const selected=currentCompletions(tasks).filter(t=>taskMatch(t)&&inPeriod(localDay(t.completed_at!))).sort((a,b)=>b.completed_at!.localeCompare(a.completed_at!));
  return {rule:"Período pela conclusão atual. Cada tarefa concluída e não arquivada conta uma vez. Reabrir a tarefa a retira deste total.",
    metrics:[["Realizadas",selected.length],...Object.entries(areas).map(([id,title]):Metric=>[title,selected.filter(t=>t.area===id).length])],
    headers:["Tarefa","Conclusão atual","Área","Prioridade","Ano letivo","Turma","Disciplina","Prazo","Pontualidade"],
    rows:selected.map(t=>({id:t.id,target:t.id,cells:[t.title,display(t.completed_at!),areas[t.area],priorities[t.priority],name(t.year_id),name(t.class_id),name(t.subject_id),dueText(t),!dueDay(t)?"Sem prazo":late(t,now)?"Após o prazo":"No prazo"]}))};
}
export function reportCsv(title:string,school:string,filters:string,report:Report) {
  const cell=(value:string|number)=>{
    let s=String(value);
    if(/^[\s\u0000-\u001f\ufeff]*[=+@\-＝＋－＠]/u.test(s)||/^[\t\r\n]/.test(s)) s="'"+s;
    return '"'+s.replaceAll('"','""')+'"';
  };
  const grid=[[title],["Escola",school],["Filtros",filters],["Critério",report.rule],["Fuso","America/Sao_Paulo"],...report.metrics,[],report.headers,...report.rows.map(r=>r.cells)];
  return "\ufeff"+grid.map(row=>row.map(cell).join(";")).join("\r\n");
}

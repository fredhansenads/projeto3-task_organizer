export const areas = { coordenacao: "Coordenação", docencia: "Docência", pessoal: "Pessoal" };
export const priorities = { baixa: "Baixa", normal: "Normal", alta: "Alta" };
export const statuses = { pendente: "A fazer", em_andamento: "Em andamento", aguardando: "Aguardando retorno", concluida: "Concluída" };
export type Task = {
  id:string; title:string; description:string|null; notes:string|null; area:keyof typeof areas;
  priority:keyof typeof priorities; status:keyof typeof statuses; due_date:string|null; due_at:string|null;
  completed_at:string|null; completion_note:string|null; year_id:string|null; class_id:string|null;
  subject_id:string|null; revision:number; archived:boolean;
};
export type Step = {id:string; task_id:string; title:string; done:boolean; position:number};
export type Appointment = {id:string; title:string; starts_at:string; ends_at:string; notes:string|null; revision:number};
export type SchoolOption = {id:string; name:string; year_id?:string};
export type Catalog = { years:SchoolOption[]; classes:SchoolOption[]; subjects:SchoolOption[] };
export type History = {id:string; created_at:string; entity:string; operation:string; before_data:Partial<Task & Step>|null; after_data:Partial<Task & Step>|null};
const formatter = new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
export function localStamp(instant:string) { return formatter.format(new Date(instant)).replace(" ","T"); }
export function localDay(instant:string) { return localStamp(instant).slice(0,10); }
export function br(day:string) { return day.split("-").reverse().join("/"); }
export function display(instant:string) { const [day,time]=localStamp(instant).split("T"); return br(day)+" às "+time; }
export function dueDay(t:Pick<Task,"due_date"|"due_at">) { return t.due_date || (t.due_at ? localDay(t.due_at) : ""); }
export function dueText(t:Pick<Task,"due_date"|"due_at">) { return t.due_at ? display(t.due_at) : t.due_date ? br(t.due_date) : "Sem prazo"; }
export function late(t:Pick<Task,"due_date"|"due_at"|"completed_at">,now:string) {
  const reference = t.completed_at || now;
  return t.due_at ? Date.parse(reference)>Date.parse(t.due_at) : !!t.due_date && localDay(reference)>t.due_date;
}
export function shiftDay(day:string,delta:number) {
  const date=new Date(day+"T12:00:00Z"); date.setUTCDate(date.getUTCDate()+delta);
  return date.toISOString().slice(0,10);
}
export function calendarDays(day:string,month:boolean) {
  const anchor=month ? day.slice(0,7)+"-01" : day;
  const weekday=new Date(anchor+"T12:00:00Z").getUTCDay();
  const first=shiftDay(anchor,-((weekday+6)%7));
  const last=month ? new Date(Date.UTC(Number(day.slice(0,4)),Number(day.slice(5,7)),0)).getUTCDate() : 7;
  const count=month ? 7*Math.ceil((((weekday+6)%7)+last)/7) : 7;
  return Array.from({length:count},(_,i)=>shiftDay(first,i));
}

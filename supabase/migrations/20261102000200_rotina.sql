alter table public.tasks drop constraint tasks_status_check;
alter table public.tasks
  add check (status in ('pendente','em_andamento','aguardando','concluida')),
  add column notes text,
  add column completion_note text,
  add column archived boolean not null default false,
  add column revision integer not null default 1,
  add column year_id uuid,
  add column class_id uuid,
  add column subject_id uuid,
  add check (class_id is null or year_id is not null),
  add foreign key (school_id, year_id) references public.academic_years(school_id,id),
  add foreign key (school_id, year_id, class_id) references public.classes(school_id,year_id,id),
  add foreign key (school_id, subject_id) references public.subjects(school_id,id);
alter table public.task_steps add column position integer not null default 0;
alter table public.events add column notes text, add column revision integer not null default 1;
alter table public.audit_events add column task_ref uuid generated always as
  (case when entity='tasks' then record_id when entity='task_steps' then
    (coalesce(after_data,before_data)->>'task_id')::uuid end) stored;
create index audit_task_history on public.audit_events(task_ref,created_at);
create index task_steps_parent on public.task_steps(task_id,position);

-- Todas as escritas de uma tarefa (inclusive checklist e histórico) são uma transação.
create function public.save_task(sid uuid, tid uuid, expected integer, fields jsonb, steps jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  current_task public.tasks;
  step record;
  date_only date := nullif(fields->>'date','')::date;
  clock_time time := nullif(fields->>'time','')::time;
  instant timestamptz;
  step_id uuid;
begin
  if uid is null or not private.has_access(sid) then raise exception 'Acesso negado.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(tid::text,0));
  select * into current_task from public.tasks where id=tid and school_id=sid and owner_id=uid for update;
  if found and expected=0 then return tid; end if;
  if coalesce(current_task.revision,0) is distinct from expected then raise exception 'Registro alterado. Atualize a página.'; end if;
  if current_task.archived or current_task.status='concluida' then raise exception 'Restaure ou reabra a tarefa para editar.'; end if;
  if fields->>'status' not in ('pendente','em_andamento','aguardando') then raise exception 'Situação inválida.'; end if;
  if clock_time is not null then
    if date_only is null then raise exception 'Informe a data do prazo.'; end if;
    instant := (date_only + clock_time) at time zone 'America/Sao_Paulo';
    date_only := null;
  end if;
  if jsonb_typeof(steps) is distinct from 'array' or jsonb_array_length(steps)>100 then raise exception 'Use até 100 etapas.'; end if;
  if exists (select 1 from jsonb_array_elements(steps) item group by item->>'id' having count(*)>1) then
    raise exception 'Etapa duplicada.';
  end if;
  if current_task.id is null then
    insert into public.tasks(id,school_id,owner_id,title,description,notes,area,priority,status,due_date,due_at,year_id,class_id,subject_id)
    values(tid,sid,uid,trim(fields->>'title'),fields->>'description',fields->>'notes',fields->>'area',fields->>'priority',
      fields->>'status',date_only,instant,nullif(fields->>'year','')::uuid,nullif(fields->>'class','')::uuid,nullif(fields->>'subject','')::uuid);
  else
    update public.tasks set title=trim(fields->>'title'),description=fields->>'description',notes=fields->>'notes',
      area=fields->>'area',priority=fields->>'priority',status=fields->>'status',due_date=date_only,due_at=instant,
      year_id=nullif(fields->>'year','')::uuid,class_id=nullif(fields->>'class','')::uuid,
      subject_id=nullif(fields->>'subject','')::uuid,revision=revision+1 where id=tid;
  end if;
  delete from public.task_steps s where s.task_id=tid and not exists
    (select 1 from jsonb_array_elements(steps) item where item->>'id'=s.id::text);
  for step in select value, ordinality from jsonb_array_elements(steps) with ordinality loop
    step_id := (step.value->>'id')::uuid;
    insert into public.task_steps as s(id,school_id,owner_id,task_id,title,done,position)
      values(step_id,sid,uid,tid,trim(step.value->>'title'),(step.value->>'done')::boolean,step.ordinality)
      on conflict(id) do update set title=excluded.title,done=excluded.done,position=excluded.position
      where s.task_id=tid and (s.title,s.done,s.position) is distinct from (excluded.title,excluded.done,excluded.position);
    if not exists(select 1 from public.task_steps where id=step_id and task_id=tid) then raise exception 'Etapa inválida.'; end if;
  end loop;
  return tid;
end $$;

create function public.task_transition(sid uuid, tid uuid, expected integer, operation text, confirmed boolean default false, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.tasks;
begin
  select * into t from public.tasks where id=tid and school_id=sid and owner_id=auth.uid() and private.has_access(sid) for update;
  if not found then raise exception 'Tarefa indisponível.'; end if;
  if operation='archive' and t.archived or operation='restore' and not t.archived then return; end if;
  if t.archived and operation<>'restore' then raise exception 'Restaure a tarefa primeiro.'; end if;
  if operation='complete' and t.status='concluida' then return; end if;
  if t.revision is distinct from expected then raise exception 'Registro alterado. Atualize a página.'; end if;
  case operation
    when 'complete' then
      if not coalesce(confirmed,false) and exists(select 1 from public.task_steps where task_id=tid and not done) then
        raise exception 'Confirme a conclusão com etapas pendentes.';
      end if;
      update public.tasks set status='concluida',completed_at=clock_timestamp(),completion_note=nullif(trim(note),''),revision=revision+1 where id=tid;
    when 'reopen' then
      if t.status<>'concluida' then raise exception 'A tarefa já está aberta.'; end if;
      update public.tasks set status='pendente',completed_at=null,completion_note=null,revision=revision+1 where id=tid;
    when 'archive','restore' then
      update public.tasks set archived=(operation='archive'),revision=revision+1 where id=tid;
    else raise exception 'Ação inválida.';
  end case;
end $$;

create function public.save_event(sid uuid, eid uuid, expected integer, title_text text,
  start_local timestamp, end_local timestamp, note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare prior integer;
begin
  if auth.uid() is null or not private.has_access(sid) then raise exception 'Acesso negado.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(eid::text,0));
  select revision into prior from public.events where id=eid and school_id=sid and owner_id=auth.uid() for update;
  if found and expected=0 then return eid; end if;
  if coalesce(prior,0) is distinct from expected then raise exception 'Registro alterado. Atualize a página.'; end if;
  if end_local < start_local then raise exception 'O término deve ser igual ou posterior ao início.'; end if;
  if prior is null then
    insert into public.events(id,school_id,owner_id,title,starts_at,ends_at,notes)
    values(eid,sid,auth.uid(),trim(title_text),start_local at time zone 'America/Sao_Paulo',end_local at time zone 'America/Sao_Paulo',note);
  else
    update public.events set title=trim(title_text),starts_at=start_local at time zone 'America/Sao_Paulo',
      ends_at=end_local at time zone 'America/Sao_Paulo', notes=note,revision=revision+1 where id=eid;
  end if;
  return eid;
end $$;
revoke all on function public.save_task(uuid,uuid,integer,jsonb,jsonb), public.task_transition(uuid,uuid,integer,text,boolean,text),
  public.save_event(uuid,uuid,integer,text,timestamp,timestamp,text) from public, anon;
grant execute on function public.save_task(uuid,uuid,integer,jsonb,jsonb), public.task_transition(uuid,uuid,integer,text,boolean,text),
  public.save_event(uuid,uuid,integer,text,timestamp,timestamp,text) to authenticated;

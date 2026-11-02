alter table public.material_requests
  add column material_type text,
  add column class_id uuid,
  add column subject_id uuid,
  add foreign key (school_id,year_id,class_id) references public.classes(school_id,year_id,id),
  add foreign key (school_id,subject_id) references public.subjects(school_id,id);
alter table public.delivery_obligations add column change_reason text, add column revision integer not null default 1;
alter table public.receipt_versions add column link text, add column guidance text,
  add column original_date date, add column original_at timestamptz, add column invalid_reason text;
update public.receipt_versions v set original_date=o.due_date,original_at=o.due_at
from public.delivery_obligations o where o.id=v.obligation_id;
alter table public.teaching_assignments add column active boolean not null default true;
alter table public.attachments add column ready boolean not null default true;
create trigger log_change after insert or update on public.teaching_assignments
for each row execute function private.log_change();
create index delivery_version_lookup on public.receipt_versions(obligation_id,version desc);
create index delivery_history_lookup on public.audit_events(record_id,created_at);

-- O comprovante da operação é gravado na mesma transação. Uma retransmissão não duplica cadastros ou versões.
create table private.material_operations (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null, token uuid not null, fingerprint text not null, result uuid not null,
  primary key(school_id,user_id,token)
);

create function private.catalog_change(sid uuid, op text, d jsonb) returns uuid
language plpgsql set search_path='' as $$
declare rid uuid:=coalesce(nullif(d->>'id','')::uuid,gen_random_uuid()); label text:=trim(d->>'name');
begin
  case op
  when 'year' then insert into public.academic_years(id,school_id,year) values(rid,sid,(d->>'year')::int);
  when 'class' then insert into public.classes(id,school_id,year_id,name) values(rid,sid,(d->>'year')::uuid,label);
  when 'subject' then insert into public.subjects(id,school_id,name) values(rid,sid,label);
  when 'teacher' then
    if nullif(d->>'id','') is null then
      insert into public.teachers(id,school_id,name,contact) values(rid,sid,label,nullif(trim(d->>'contact'),''));
    else
      update public.teachers set name=label,contact=nullif(trim(d->>'contact'),'') where school_id=sid and id=rid;
      if not found then raise exception 'Professor indisponível.'; end if;
    end if;
  when 'teacher_active' then
    update public.teachers set active=(d->>'active')::boolean where school_id=sid and id=rid;
    if not found then raise exception 'Professor indisponível.'; end if;
  when 'assign' then
    perform 1 from public.teachers where school_id=sid and id=(d->>'teacher')::uuid and active for share;
    if not found then raise exception 'Selecione um professor ativo.'; end if;
    insert into public.teaching_assignments(id,school_id,year_id,teacher_id,class_id,subject_id)
    values(rid,sid,(d->>'year')::uuid,(d->>'teacher')::uuid,(d->>'class')::uuid,(d->>'subject')::uuid)
    on conflict(school_id,year_id,teacher_id,class_id,subject_id) do update set active=true returning id into rid;
  when 'unassign' then
    update public.teaching_assignments set active=false where school_id=sid and id=rid;
    if not found then raise exception 'Vínculo indisponível.'; end if;
  else raise exception 'Cadastro inválido.'; end case;
  return rid;
end $$;

create function private.request_change(sid uuid, op text, d jsonb) returns uuid
language plpgsql set search_path='' as $$
declare rid uuid:=coalesce(nullif(d->>'id','')::uuid,gen_random_uuid());
  req public.material_requests; who uuid; ids uuid[];
  deadline date:=nullif(d->>'date','')::date; instant timestamptz;
  reason text:=nullif(trim(d->>'reason'),'');
begin
  if op in ('request','deadline') then
    if deadline is null then raise exception 'Informe o prazo.'; end if;
    if nullif(d->>'time','') is not null then
      instant:=(deadline+(d->>'time')::time) at time zone 'America/Sao_Paulo'; deadline:=null;
    end if;
  end if;
  if op='request' then
    if nullif(trim(d->>'type'),'') is null or nullif(trim(d->>'period'),'') is null then raise exception 'Informe tipo e período.'; end if;
    insert into public.material_requests(id,school_id,title,year_id,material_type,period,instructions,class_id,subject_id,due_date,due_at)
    values(rid,sid,trim(d->>'title'),(d->>'year')::uuid,trim(d->>'type'),trim(d->>'period'),d->>'instructions',
      nullif(d->>'class','')::uuid,nullif(d->>'subject','')::uuid,deadline,instant);
  end if;
  select * into strict req from public.material_requests where id=rid and school_id=sid for update;
  ids:=array(select distinct value::uuid from jsonb_array_elements_text(d->'ids'));
  if cardinality(ids)=0 then raise exception 'Selecione ao menos um professor.'; end if;
  if op in ('request','add_teachers') then
    foreach who in array ids loop
      perform 1 from public.teachers where school_id=sid and id=who and active for share;
      if not found then raise exception 'Todos os professores selecionados devem estar ativos nesta escola.'; end if;
      insert into public.delivery_obligations(school_id,request_id,teacher_id,due_date,due_at)
      values(sid,rid,who,req.due_date,req.due_at) on conflict(request_id,teacher_id) do nothing;
    end loop;
  elsif op='deadline' then
    if reason is null then raise exception 'Justifique a mudança de prazo.'; end if;
    if (select count(*) from public.delivery_obligations where request_id=rid and id=any(ids))<>cardinality(ids)
      then raise exception 'Seleção de acompanhamentos inválida.'; end if;
    if d->>'collective'='on' then update public.material_requests set due_date=deadline,due_at=instant where id=rid; end if;
    update public.delivery_obligations set due_date=deadline,due_at=instant,change_reason=reason,revision=revision+1
    where request_id=rid and id=any(ids);
  else raise exception 'Operação inválida.'; end if;
  return rid;
end $$;

create function private.delivery_change(sid uuid, op text, d jsonb) returns uuid
language plpgsql set search_path='' as $$
declare ob public.delivery_obligations; latest public.receipt_versions;
  reason text:=nullif(trim(d->>'reason'),''); received timestamptz; url text:=nullif(trim(d->>'link'),'');
  seq int; due date;
begin
  select * into strict ob from public.delivery_obligations where school_id=sid and id=(d->>'id')::uuid for update;
  if ob.revision is distinct from (d->>'revision')::int then raise exception 'O acompanhamento mudou. Atualize a página.'; end if;
  select * into latest from public.receipt_versions where obligation_id=ob.id and invalid_reason is null order by version desc limit 1;
  if ob.exemption_reason is not null and op<>'reactivate' then raise exception 'Reative o acompanhamento primeiro.'; end if;
  case op
  when 'receive' then
    received:=(d->>'received')::timestamp at time zone 'America/Sao_Paulo';
    if received is null or received>clock_timestamp() then raise exception 'A entrega precisa ter uma data real até o momento atual.'; end if;
    if latest.id is not null and (latest.review<>'ajustes' or received<latest.received_at) then
      raise exception 'A revisão exige pedido de ajustes e data igual ou posterior à entrega anterior.'; end if;
    if coalesce(d->>'channel','') not in ('papel','email','whatsapp','outro') then raise exception 'Selecione um canal válido.'; end if;
    if url is not null and url !~* '^https?://[^[:space:]/]+' then raise exception 'Use um link HTTP ou HTTPS.'; end if;
    select coalesce(max(version),0)+1 into seq from public.receipt_versions where obligation_id=ob.id;
    insert into public.receipt_versions(school_id,obligation_id,version,received_at,channel,notes,link,original_date,original_at)
    values(sid,ob.id,seq,received,d->>'channel',d->>'notes',url,ob.due_date,ob.due_at);
  when 'approve','adjust' then
    if latest.id is null or latest.review<>'aguardando' then raise exception 'É preciso ter uma versão aguardando conferência.'; end if;
    if op='adjust' then
      due:=nullif(d->>'correction','')::date;
      if reason is null or due is null then raise exception 'Informe orientação e prazo de correção.'; end if;
    end if;
    update public.receipt_versions set review=case when op='approve' then 'aprovado' else 'ajustes' end,
      guidance=reason,correction_due=due where id=latest.id;
  when 'invalidate' then
    if latest.id is null or reason is null then raise exception 'Informe a versão e o motivo da invalidação.'; end if;
    update public.receipt_versions set invalid_reason=reason where id=latest.id;
  when 'exempt' then
    if latest.id is not null or reason is null then raise exception 'A dispensa exige uma pendência e uma justificativa.'; end if;
    update public.delivery_obligations set exemption_reason=reason where id=ob.id;
  when 'reactivate' then
    if ob.exemption_reason is null then raise exception 'O acompanhamento não está dispensado.'; end if;
    update public.delivery_obligations set exemption_reason=null where id=ob.id;
  else raise exception 'Ação de entrega inválida.'; end case;
  update public.delivery_obligations set revision=revision+1 where id=ob.id;
  return ob.id;
end $$;
create function private.attachment_change(sid uuid, op text, d jsonb) returns uuid
language plpgsql set search_path='' as $$
declare aid uuid:=(d->>'id')::uuid; vid uuid:=(d->>'version')::uuid;
  a public.attachments; meta jsonb; mime text:=d->>'mime'; name text:=trim(d->>'name');
begin
  if op='reserve' then
    perform 1 from public.receipt_versions where school_id=sid and id=vid and invalid_reason is null;
    if not found then raise exception 'Versão indisponível.'; end if;
    if mime is distinct from (case lower(substring(name from '[^.]+$'))
      when 'pdf' then 'application/pdf' when 'jpg' then 'image/jpeg' when 'jpeg' then 'image/jpeg'
      when 'png' then 'image/png' when 'docx' then 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      when 'xlsx' then 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' else null end)
      then raise exception 'Tipo de arquivo incompatível.'; end if;
    insert into public.attachments(id,school_id,version_id,file_name,object_path,mime_type,byte_size,ready)
    values(aid,sid,vid,name,sid::text||'/'||vid::text||'/'||aid::text,mime,(d->>'size')::bigint,false);
  elsif op='confirm' then
    select * into strict a from public.attachments where id=aid and school_id=sid for update;
    select metadata into meta from storage.objects where bucket_id='materiais' and storage.objects.name=a.object_path;
    if meta is null or (meta->>'size')::bigint is distinct from a.byte_size or meta->>'mimetype' is distinct from a.mime_type
      then raise exception 'O armazenamento ainda não confirmou este arquivo. Envie-o novamente.'; end if;
    update public.attachments set ready=true where id=aid and not ready;
  end if;
  return aid;
end $$;

create function public.material_command(sid uuid, token uuid, op text, d jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare saved private.material_operations; rid uuid; signature text:=md5(op||d::text); uid uuid:=auth.uid();
begin
  if uid is null or not private.has_access(sid) then raise exception 'Acesso negado.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(token::text,1));
  select * into saved from private.material_operations m where m.school_id=sid and m.user_id=uid and m.token=material_command.token;
  if found then
    if saved.fingerprint<>signature then raise exception 'Dados alterados. Inicie um novo envio.'; end if;
    return saved.result;
  end if;
  case
  when op in ('teacher','teacher_active','assign','unassign','year','class','subject') then rid:=private.catalog_change(sid,op,d);
  when op in ('request','deadline','add_teachers') then rid:=private.request_change(sid,op,d);
  when op in ('receive','approve','adjust','exempt','reactivate','invalidate') then rid:=private.delivery_change(sid,op,d);
  when op in ('reserve','confirm') then rid:=private.attachment_change(sid,op,d);
  else raise exception 'Ação inválida.'; end case;
  insert into private.material_operations values(sid,uid,token,signature,rid);
  return rid;
end $$;
revoke all on function private.catalog_change(uuid,text,jsonb),private.request_change(uuid,text,jsonb),
  private.delivery_change(uuid,text,jsonb),private.attachment_change(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.material_command(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.material_command(uuid,uuid,text,jsonb) to authenticated;

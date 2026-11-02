-- A consulta respeita as políticas de escola e proprietário de audit_events.
create view public.task_activity_report with (security_invoker=true) as
select id, school_id, record_id as task_id, created_at,
  after_data->>'title' as title, after_data->>'area' as area,
  after_data->>'priority' as priority, after_data->>'year_id' as year_id,
  after_data->>'class_id' as class_id, after_data->>'subject_id' as subject_id,
  case
    when operation='INSERT' then 'Criação'
    when before_data->>'archived' is distinct from after_data->>'archived'
      then case when (after_data->>'archived')::boolean then 'Arquivamento' else 'Restauração' end
    when before_data->>'status' is distinct from after_data->>'status' and after_data->>'status'='concluida' then 'Conclusão'
    when before_data->>'status'='concluida' and after_data->>'status'<>'concluida' then 'Reabertura'
    else 'Edição'
  end as action
from public.audit_events where entity='tasks' and operation in ('INSERT','UPDATE');
revoke all on public.task_activity_report from public, anon;
grant select on public.task_activity_report to authenticated;

create view public.delivery_summary with (security_invoker=true) as
select o.*, t.name as teacher_name, r.title as request_title, r.year_id,
  case when o.exemption_reason is not null then 'dispensado' when latest.id is null then 'pendente' else 'recebido' end as state,
  latest.review, latest.correction_due, first_version.received_at as first_received,
  case when first_version.original_at is not null then first_version.received_at>first_version.original_at
       when first_version.original_date is not null then (first_version.received_at at time zone 'America/Sao_Paulo')::date>first_version.original_date end as first_late
from public.delivery_obligations o
join public.material_requests r on r.id=o.request_id join public.teachers t on t.id=o.teacher_id
left join lateral (select v.* from public.receipt_versions v where v.obligation_id=o.id and v.invalid_reason is null order by version desc limit 1) latest on true
left join lateral (select v.* from public.receipt_versions v where v.obligation_id=o.id and v.invalid_reason is null order by version limit 1) first_version on true;
revoke all on public.delivery_summary from public, anon;
grant select on public.delivery_summary to authenticated, service_role;

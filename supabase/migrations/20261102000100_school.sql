create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.school_memberships (
  school_id uuid not null references public.schools(id),
  user_id uuid not null references auth.users(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  year integer not null check (year between 1900 and 2200),
  created_at timestamptz not null default now(),
  unique (school_id, id),
  unique (school_id, year)
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  name text not null check (length(trim(name)) > 0),
  contact text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  year_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  foreign key (school_id, year_id) references public.academic_years(school_id, id),
  unique (school_id, year_id, id),
  unique (school_id, year_id, name)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (school_id, id),
  unique (school_id, name)
);

create table public.teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  year_id uuid not null,
  teacher_id uuid not null,
  class_id uuid not null,
  subject_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (school_id, teacher_id) references public.teachers(school_id, id),
  foreign key (school_id, subject_id) references public.subjects(school_id, id),
  foreign key (school_id, year_id, class_id) references public.classes(school_id, year_id, id),
  unique (school_id, year_id, teacher_id, class_id, subject_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  owner_id uuid not null references auth.users(id),
  title text not null check (length(trim(title)) > 0),
  description text,
  area text not null check (area in ('coordenacao','docencia','pessoal')),
  priority text not null default 'normal' check (priority in ('baixa','normal','alta')),
  status text not null default 'pendente' check (status in ('pendente','em_andamento','concluida')),
  due_date date,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(due_date, due_at) <= 1),
  check ((status = 'concluida') = (completed_at is not null)),
  unique (school_id, owner_id, id)
);

create table public.task_steps (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  owner_id uuid not null references auth.users(id),
  task_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (school_id, owner_id, task_id) references public.tasks(school_id, owner_id, id)
);

create table public.material_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  year_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  instructions text,
  period text,
  due_date date,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(due_date, due_at) <= 1),
  foreign key (school_id, year_id) references public.academic_years(school_id, id),
  unique (school_id, id)
);

create table public.delivery_obligations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  request_id uuid not null,
  teacher_id uuid not null,
  due_date date,
  due_at timestamptz,
  exemption_reason text check (length(trim(exemption_reason)) > 0),
  created_at timestamptz not null default now(),
  check (num_nonnulls(due_date, due_at) <= 1),
  foreign key (school_id, request_id) references public.material_requests(school_id, id),
  foreign key (school_id, teacher_id) references public.teachers(school_id, id),
  unique (request_id, teacher_id),
  unique (school_id, id)
);

create table public.receipt_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  obligation_id uuid not null,
  version integer not null check (version > 0),
  received_at timestamptz not null,
  channel text not null,
  review text not null default 'aguardando' check (review in ('aguardando','aprovado','ajustes')),
  notes text,
  correction_due date,
  created_at timestamptz not null default now(),
  foreign key (school_id, obligation_id) references public.delivery_obligations(school_id, id),
  unique (obligation_id, version),
  unique (school_id, id)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  version_id uuid not null,
  file_name text not null,
  object_path text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size between 1 and 10485760),
  created_at timestamptz not null default now(),
  foreign key (school_id, version_id) references public.receipt_versions(school_id, id),
  check (object_path = school_id::text || '/' || version_id::text || '/' || id::text)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  owner_id uuid not null references auth.users(id),
  title text not null check (length(trim(title)) > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at >= starts_at),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  owner_id uuid,
  actor_id uuid,
  entity text not null,
  record_id uuid not null,
  operation text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.has_access(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.school_memberships
    where school_id = sid and user_id = (select auth.uid()) and active)
$$;
revoke all on function private.has_access(uuid) from public;
grant execute on function private.has_access(uuid) to authenticated;

-- Os módulos das etapas seguintes liberarão escritas junto com suas regras de negócio.
alter table public.schools enable row level security;
revoke all on public.schools from public, anon, authenticated;
grant select on public.schools to authenticated;
grant all on public.schools to service_role;
create policy read_schools on public.schools for select to authenticated
using (private.has_access(id));

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy read_profiles on public.profiles for select to authenticated
using (id = (select auth.uid()));

alter table public.school_memberships enable row level security;
revoke all on public.school_memberships from public, anon, authenticated;
grant select on public.school_memberships to authenticated;
grant all on public.school_memberships to service_role;
create policy read_school_memberships on public.school_memberships for select to authenticated
using (user_id = (select auth.uid()));

alter table public.academic_years enable row level security;
revoke all on public.academic_years from public, anon, authenticated;
grant select on public.academic_years to authenticated;
grant all on public.academic_years to service_role;
create policy read_academic_years on public.academic_years for select to authenticated
using (private.has_access(school_id));

alter table public.teachers enable row level security;
revoke all on public.teachers from public, anon, authenticated;
grant select on public.teachers to authenticated;
grant all on public.teachers to service_role;
create policy read_teachers on public.teachers for select to authenticated
using (private.has_access(school_id));

alter table public.classes enable row level security;
revoke all on public.classes from public, anon, authenticated;
grant select on public.classes to authenticated;
grant all on public.classes to service_role;
create policy read_classes on public.classes for select to authenticated
using (private.has_access(school_id));

alter table public.subjects enable row level security;
revoke all on public.subjects from public, anon, authenticated;
grant select on public.subjects to authenticated;
grant all on public.subjects to service_role;
create policy read_subjects on public.subjects for select to authenticated
using (private.has_access(school_id));

alter table public.teaching_assignments enable row level security;
revoke all on public.teaching_assignments from public, anon, authenticated;
grant select on public.teaching_assignments to authenticated;
grant all on public.teaching_assignments to service_role;
create policy read_teaching_assignments on public.teaching_assignments for select to authenticated
using (private.has_access(school_id));

alter table public.tasks enable row level security;
revoke all on public.tasks from public, anon, authenticated;
grant select on public.tasks to authenticated;
grant all on public.tasks to service_role;
create policy read_tasks on public.tasks for select to authenticated
using (private.has_access(school_id) and owner_id = (select auth.uid()));

alter table public.task_steps enable row level security;
revoke all on public.task_steps from public, anon, authenticated;
grant select on public.task_steps to authenticated;
grant all on public.task_steps to service_role;
create policy read_task_steps on public.task_steps for select to authenticated
using (private.has_access(school_id) and owner_id = (select auth.uid()));

alter table public.material_requests enable row level security;
revoke all on public.material_requests from public, anon, authenticated;
grant select on public.material_requests to authenticated;
grant all on public.material_requests to service_role;
create policy read_material_requests on public.material_requests for select to authenticated
using (private.has_access(school_id));

alter table public.delivery_obligations enable row level security;
revoke all on public.delivery_obligations from public, anon, authenticated;
grant select on public.delivery_obligations to authenticated;
grant all on public.delivery_obligations to service_role;
create policy read_delivery_obligations on public.delivery_obligations for select to authenticated
using (private.has_access(school_id));

alter table public.receipt_versions enable row level security;
revoke all on public.receipt_versions from public, anon, authenticated;
grant select on public.receipt_versions to authenticated;
grant all on public.receipt_versions to service_role;
create policy read_receipt_versions on public.receipt_versions for select to authenticated
using (private.has_access(school_id));

alter table public.attachments enable row level security;
revoke all on public.attachments from public, anon, authenticated;
grant select on public.attachments to authenticated;
grant all on public.attachments to service_role;
create policy read_attachments on public.attachments for select to authenticated
using (private.has_access(school_id));

alter table public.events enable row level security;
revoke all on public.events from public, anon, authenticated;
grant select on public.events to authenticated;
grant all on public.events to service_role;
create policy read_events on public.events for select to authenticated
using (private.has_access(school_id) and owner_id = (select auth.uid()));

alter table public.audit_events enable row level security;
revoke all on public.audit_events from public, anon, authenticated;
grant select on public.audit_events to authenticated;
grant all on public.audit_events to service_role;
create policy read_audit_events on public.audit_events for select to authenticated
using (private.has_access(school_id) and (owner_id is null or owner_id = (select auth.uid())));
create index membership_user on public.school_memberships(user_id, school_id) where active;
create index tasks_owner on public.tasks(owner_id, school_id);
create index events_owner on public.events(owner_id, school_id);

create function private.log_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  prior jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  later jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  record_data jsonb := coalesce(later, prior);
begin
  insert into public.audit_events(school_id, owner_id, actor_id, entity, record_id, operation, before_data, after_data)
  values ((record_data->>'school_id')::uuid, (record_data->>'owner_id')::uuid, auth.uid(),
          tg_table_name, (record_data->>'id')::uuid, tg_op, prior, later);
  return null;
end $$;
revoke all on function private.log_change() from public;
create trigger log_change after insert or update or delete on public.tasks
for each row execute function private.log_change();
create trigger log_change after insert or update or delete on public.task_steps
for each row execute function private.log_change();
create trigger log_change after insert or update or delete on public.events
for each row execute function private.log_change();
create trigger log_change after insert or update or delete on public.teachers
for each row execute function private.log_change();
create trigger log_change after insert or update or delete on public.material_requests
for each row execute function private.log_change();
create trigger log_change after insert or update or delete on public.delivery_obligations
for each row execute function private.log_change();
create trigger log_change after insert or update or delete on public.receipt_versions
for each row execute function private.log_change();
create trigger log_change after insert or update or delete on public.attachments
for each row execute function private.log_change();

-- O nome do objeto é escola/versão/anexo. A linha de metadados autoriza o caminho exato.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('materiais','materiais',false,10485760,array[
  'application/pdf','image/jpeg','image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);
create policy school_material_read on storage.objects for select to authenticated
using (bucket_id = 'materiais' and exists (
  select 1 from public.attachments a where a.object_path = storage.objects.name
));
create policy school_material_upload on storage.objects for insert to authenticated
with check (bucket_id = 'materiais' and exists (
  select 1 from public.attachments a where a.object_path = storage.objects.name
));

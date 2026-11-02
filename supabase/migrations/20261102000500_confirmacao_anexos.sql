-- Reservas permanecem privadas até a confirmação dos metadados pelo Storage.
alter table public.attachments alter column ready set default false;
update public.attachments a set ready=false where ready and not exists (
  select 1 from storage.objects o where o.bucket_id='materiais' and o.name=a.object_path
    and (o.metadata->>'size')::bigint=a.byte_size and o.metadata->>'mimetype'=a.mime_type
);
alter policy school_material_read on storage.objects using (
  bucket_id='materiais' and exists(select 1 from public.attachments a where a.object_path=storage.objects.name and a.ready)
);
alter policy school_material_upload on storage.objects with check (
  bucket_id='materiais' and exists(select 1 from public.attachments a where a.object_path=storage.objects.name and not a.ready)
);

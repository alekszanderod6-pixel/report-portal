-- Add source + file_url columns to reports table
alter table public.reports
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'uploaded')),
  add column if not exists file_url text;

-- Storage bucket for uploaded PDFs (run once)
insert into storage.buckets (id, name, public)
values ('report-uploads', 'report-uploads', false)
on conflict (id) do nothing;

-- Allow admins to insert reports on behalf of any user
create policy "Admin insert any report"
  on public.reports for insert
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- Allow admins to upload to the storage bucket
create policy "Admin upload reports"
  on storage.objects for insert
  with check (
    bucket_id = 'report-uploads'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow users to read their own uploaded files
create policy "Users read own uploads"
  on storage.objects for select
  using (
    bucket_id = 'report-uploads'
    and (
      -- file path starts with their user_id
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );

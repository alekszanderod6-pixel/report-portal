create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

create table public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  date_from date not null,
  date_to date not null,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.report_entries (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  serial_number integer not null,
  important_work text not null default '',
  completion_process text not null default '',
  is_completed text not null default 'In Progress'
    check (is_completed in ('Yes', 'No', 'In Progress')),
  spare_parts text not null default '',
  created_at timestamptz default now()
);

create index idx_reports_user_id on public.reports(user_id);
create index idx_reports_status on public.reports(status);
create index idx_entries_report_id on public.report_entries(report_id);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_entries enable row level security;

create policy "Own profile select" on public.profiles for select using (auth.uid() = id);
create policy "Own profile update" on public.profiles for update using (auth.uid() = id);
create policy "Own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "Admin view all profiles" on public.profiles for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Own reports select" on public.reports for select using (auth.uid() = user_id);
create policy "Own reports insert" on public.reports for insert with check (auth.uid() = user_id);
create policy "Own reports update" on public.reports for update using (auth.uid() = user_id);
create policy "Own reports delete" on public.reports for delete using (auth.uid() = user_id);
create policy "Admin view all reports" on public.reports for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admin delete any report" on public.reports for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Own entries select" on public.report_entries for select using (exists (select 1 from public.reports where id = report_id and user_id = auth.uid()));
create policy "Own entries insert" on public.report_entries for insert with check (exists (select 1 from public.reports where id = report_id and user_id = auth.uid()));
create policy "Own entries update" on public.report_entries for update using (exists (select 1 from public.reports where id = report_id and user_id = auth.uid()));
create policy "Own entries delete" on public.report_entries for delete using (exists (select 1 from public.reports where id = report_id and user_id = auth.uid()));
create policy "Admin view all entries" on public.report_entries for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create or replace function public.handle_new_user()
returns trigger as $`$`begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case
      when new.email = 'alekszanderod6-pixel@users.noreply.github.com' then 'admin'
      else 'user'
    end
  );
  return new;
end;
`$` language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger as $`$`begin
  new.updated_at = now();
  return new;
end;
`$` language plpgsql;

create trigger on_report_updated
  before update on public.reports
  for each row execute procedure public.update_updated_at();

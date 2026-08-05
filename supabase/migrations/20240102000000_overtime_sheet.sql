-- Monthly Overtime Authorization Sheet table
-- 月度加班授权表

create table public.overtime_sheets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  dept text not null default 'Maintenance: I&C',
  month text not null default '',
  employee_name text not null default '',
  status text not null default 'draft' check (status in ('draft', 'completed')),
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_overtime_user_id on public.overtime_sheets(user_id);
create index idx_overtime_status on public.overtime_sheets(status);

alter table public.overtime_sheets enable row level security;

create policy "Own overtime select" on public.overtime_sheets for select using (auth.uid() = user_id);
create policy "Own overtime insert" on public.overtime_sheets for insert with check (auth.uid() = user_id);
create policy "Own overtime update" on public.overtime_sheets for update using (auth.uid() = user_id);
create policy "Own overtime delete" on public.overtime_sheets for delete using (auth.uid() = user_id);
create policy "Admin view all overtime" on public.overtime_sheets for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admin delete any overtime" on public.overtime_sheets for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create trigger on_overtime_updated
  before update on public.overtime_sheets
  for each row execute procedure public.update_updated_at();

-- Fix infinite recursion in RLS policies
-- The "Admin view all profiles" policy was querying the profiles table
-- from within a policy ON the profiles table — causing infinite recursion.
-- Solution: use a SECURITY DEFINER function to check admin role, bypassing RLS.

-- ── Step 1: Create a helper function that checks admin role safely ─────────────
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

-- ── Step 2: Fix profiles policies ─────────────────────────────────────────────
drop policy if exists "Admin view all profiles" on public.profiles;

create policy "Admin view all profiles" on public.profiles
  for select using ( public.is_admin() );

-- ── Step 3: Fix reports policies ──────────────────────────────────────────────
drop policy if exists "Admin view all reports" on public.reports;
drop policy if exists "Admin delete any report" on public.reports;

create policy "Admin view all reports" on public.reports
  for select using ( public.is_admin() );

create policy "Admin delete any report" on public.reports
  for delete using ( public.is_admin() );

-- ── Step 4: Fix report_entries policies ───────────────────────────────────────
drop policy if exists "Admin view all entries" on public.report_entries;

create policy "Admin view all entries" on public.report_entries
  for select using ( public.is_admin() );

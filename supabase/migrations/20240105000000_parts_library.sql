-- ── Parts Library ─────────────────────────────────────────────────────────────
-- Stores all spare parts / materials / model numbers as a shared lookup table.
-- Items are added automatically when a report entry is saved, or manually by admin.

create table if not exists public.parts_library (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,                          -- the part name/model number
  category    text not null default 'General',        -- grouping label (CCTV, Network, etc.)
  source      text not null default 'auto'
              check (source in ('auto', 'manual')),   -- auto = captured from report, manual = admin added
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  -- Prevent exact-duplicate names (case-insensitive)
  constraint parts_library_name_unique unique (name)
);

-- Index for fast search
create index idx_parts_library_name on public.parts_library using gin (to_tsvector('english', name));
create index idx_parts_library_category on public.parts_library (category);

-- RLS
alter table public.parts_library enable row level security;

-- All authenticated users can read the library
create policy "Anyone reads parts library"
  on public.parts_library for select
  using (auth.role() = 'authenticated');

-- Only admins can insert/update/delete manually
create policy "Admin manages parts library"
  on public.parts_library for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ── Auto-capture function ──────────────────────────────────────────────────────
-- Runs after every insert/update on report_entries.
-- Parses spare_parts text → splits by newline / comma → upserts into library.
create or replace function public.auto_capture_parts()
returns trigger as $$
declare
  raw_line   text;
  clean_name text;
  lines      text[];
begin
  if new.spare_parts is null or trim(new.spare_parts) = '' or lower(trim(new.spare_parts)) = 'none' then
    return new;
  end if;

  -- Split on newlines first, then commas within lines
  lines := string_to_array(new.spare_parts, E'\n');

  foreach raw_line in array lines loop
    -- Strip leading numbering like "1. " "1) " "• " "- "
    clean_name := regexp_replace(trim(raw_line), '^(\d+[\.\)]\s*|[•\-]\s*)', '', 'g');
    clean_name := trim(clean_name);

    -- Skip empty lines, "None", "N/A", very short strings
    if length(clean_name) < 3
       or lower(clean_name) in ('none', 'n/a', 'na', 'nil', '-')
    then
      continue;
    end if;

    -- Upsert — do nothing if name already exists (case-insensitive via unique index)
    insert into public.parts_library (name, source)
    values (clean_name, 'auto')
    on conflict (name) do nothing;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_entry_parts_capture
  after insert or update of spare_parts
  on public.report_entries
  for each row
  execute procedure public.auto_capture_parts();

-- ── Seed: Alexander Opoku Dwumaah's known parts ────────────────────────────────
-- Gathered from all manual reports and uploaded documents.
insert into public.parts_library (name, category, source) values
  -- CCTV Cameras
  ('DS-2DC4220IW-D',            'CCTV',    'manual'),
  ('DS-2DC42201W-D',            'CCTV',    'manual'),
  ('DS-2CD2143G2-I',            'CCTV',    'manual'),
  ('DS-2CD2T47G2-L',            'CCTV',    'manual'),
  ('DS-2DE4A425IWG-E',          'CCTV',    'manual'),
  ('DS-2PT2D4TRW-SZ',           'CCTV',    'manual'),
  ('DS-2CD2T47G2-L(2.8mm)',     'CCTV',    'manual'),
  ('DS-2CD2385G1-I',            'CCTV',    'manual'),
  ('DS-2DE4A425IWG-E(T5)',      'CCTV',    'manual'),
  -- NVR / DVR
  ('DS-7716NI-I4/16P',          'NVR/DVR', 'manual'),
  ('DS-7608NI-I2/8P',           'NVR/DVR', 'manual'),
  ('DS-7608NXI-I2/8P',          'NVR/DVR', 'manual'),
  -- Network Equipment
  ('RG-AP680-O(P)',             'Network', 'manual'),
  ('RG-AP820-L(V3)',            'Network', 'manual'),
  ('RG-S1920-24GT4SFP-P-E',    'Network', 'manual'),
  ('RG-NBS3100-24GT4SFP-P',    'Network', 'manual'),
  ('RG-ES224GC',               'Network', 'manual'),
  ('RG-S5750C-28GT4XS-H',      'Network', 'manual'),
  -- Instrumentation / Analyser
  ('1720E Controller SC200',    'Instrumentation', 'manual'),
  ('SC200',                     'Instrumentation', 'manual'),
  ('1720E',                     'Instrumentation', 'manual'),
  ('Turbidimeter Module 1720E', 'Instrumentation', 'manual'),
  -- Power / Electrical
  ('UPS 1000VA',               'Electrical', 'manual'),
  ('CHNT NXB-63 C16',          'Electrical', 'manual'),
  ('CHNT NXB-63 C10',          'Electrical', 'manual'),
  -- Accessories / Mounts
  ('PTZ Bracket Heavy Duty',   'Accessories', 'manual'),
  ('DS-1602ZJ',                'Accessories', 'manual'),
  ('Cat6 UTP Cable (per metre)','Accessories', 'manual'),
  ('RJ45 Connector',           'Accessories', 'manual'),
  ('PoE Injector 48V',         'Accessories', 'manual'),
  ('SFP Module 1G LX',        'Accessories', 'manual')
on conflict (name) do update
  set category = excluded.category,
      source   = case when public.parts_library.source = 'auto' then excluded.source
                      else public.parts_library.source end;

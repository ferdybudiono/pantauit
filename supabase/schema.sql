-- Enable extensions
create extension if not exists "uuid-ossp";

-- Organizations (Tenants)
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Profiles (Users linked to Auth + Org)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  full_name text,
  created_at timestamptz not null default now()
);

-- Devices (Owned by Org)
create table public.devices (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  hostname text not null,
  api_key text not null unique,
  os_type text,
  created_at timestamptz not null default now()
);
create index idx_devices_org on public.devices(organization_id);
create index idx_devices_api_key on public.devices(api_key);

-- Telemetry Logs (High volume, partitioned by time recommended)
create table public.telemetry_logs (
  id bigserial primary key,
  device_id uuid not null references public.devices(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cpu_usage numeric(5,2),
  disk_usage numeric(5,2),
  ssd_health integer,
  logged_at timestamptz not null default now()
);
create index idx_telemetry_org_time on public.telemetry_logs(organization_id, logged_at desc);
create index idx_telemetry_device on public.telemetry_logs(device_id, logged_at desc);

-- Alerts
create table public.alerts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  severity text not null check (severity in ('low','medium','high','critical')),
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_alerts_org on public.alerts(organization_id);
create index idx_alerts_device on public.alerts(device_id);

-- Row Level Security
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.telemetry_logs enable row level security;
alter table public.alerts enable row level security;

-- Helper function: current user's org id
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- RLS Policies: Organizations
create policy "org_select" on public.organizations
  for select using (id = public.current_org_id());

-- RLS Policies: Profiles
create policy "profile_select" on public.profiles
  for select using (organization_id = public.current_org_id());
create policy "profile_update" on public.profiles
  for update using (organization_id = public.current_org_id());

-- RLS Policies: Devices
create policy "device_all" on public.devices
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- RLS Policies: Telemetry (user-facing, agent uses anon API key + device api_key via route handler, not RLS)
create policy "telemetry_select" on public.telemetry_logs
  for select using (organization_id = public.current_org_id());

-- RLS Policies: Alerts
create policy "alert_all" on public.alerts
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

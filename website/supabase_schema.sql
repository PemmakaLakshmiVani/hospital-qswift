-- Hospital Qswift — Supabase Postgres Database Schema & Row Level Security (RLS) Policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if recreating schema
drop table if exists public.leave_requests cascade;
drop table if exists public.reviews cascade;
drop table if exists public.queue_tokens cascade;
drop table if exists public.family_members cascade;
drop table if exists public.clinic_staff_accounts cascade;
drop table if exists public.doctors cascade;
drop table if exists public.hospitals cascade;
drop table if exists public.profiles cascade;

-- 1. USER PROFILES (Linked with Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text default 'patient',
  hospital_id text,
  blood_group text,
  emergency_contact text,
  medical_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. HOSPITALS / CLINICS
create table public.hospitals (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text not null check (type in ('hospital', 'clinic', 'diagnostic_center')),
  address text not null,
  lat double precision not null,
  lng double precision not null,
  photo_url text,
  is_open boolean default true,
  phone text,
  emergency_contact text,
  verification_status text default 'verified' check (verification_status in ('pending', 'verified', 'rejected')),
  clinical_license_no text,
  council_reg_no text,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- 3. DOCTORS
create table public.doctors (
  id text primary key default gen_random_uuid()::text,
  hospital_id text references public.hospitals(id) on delete cascade not null,
  name text not null,
  specialty text not null,
  consultation_fee numeric(10,2) not null default 500,
  avg_consult_minutes int default 15,
  available_days text[] default array['Mon','Tue','Wed','Thu','Fri','Sat'],
  available_from time default '09:00:00',
  available_to time default '17:00:00',
  qualification text,
  experience_years int default 5,
  is_available boolean default true,
  is_resigned boolean default false,
  status text default 'active',
  username text,
  password text,
  created_at timestamptz default now()
);

-- 4. CLINIC STAFF OPERATOR ACCOUNTS
create table public.clinic_staff_accounts (
  id text primary key default gen_random_uuid()::text,
  hospital_id text references public.hospitals(id) on delete cascade not null,
  doctor_id text references public.doctors(id) on delete set null,
  staff_name text not null,
  username text unique not null,
  password_hash text not null,
  role text default 'token_operator',
  created_at timestamptz default now()
);

-- 5. FAMILY MEMBERS (For booking on behalf of family)
create table public.family_members (
  id text primary key default gen_random_uuid()::text,
  patient_id text,
  full_name text not null,
  relationship text not null check (relationship in ('self', 'parent', 'child', 'spouse', 'other')),
  age int,
  gender text,
  created_at timestamptz default now()
);

-- 6. LIVE / DAILY OPD QUEUE TOKENS
create table public.queue_tokens (
  id text primary key default gen_random_uuid()::text,
  hospital_id text references public.hospitals(id) on delete cascade not null,
  doctor_id text references public.doctors(id) on delete cascade not null,
  patient_id text,
  family_member_id text references public.family_members(id) on delete set null,
  patient_name text not null,
  token_number int not null,
  status text not null default 'waiting' check (status in ('waiting', 'serving', 'done', 'cancelled', 'no_show')),
  is_priority boolean default false,
  priority_reason text,
  queue_date date not null default current_date,
  booking_type text default 'on_the_spot',
  joined_at timestamptz default now(),
  called_at timestamptz,
  completed_at timestamptz
);

-- 7. REVIEWS
create table public.reviews (
  id text primary key default gen_random_uuid()::text,
  hospital_id text references public.hospitals(id) on delete cascade not null,
  doctor_id text references public.doctors(id) on delete cascade,
  patient_id text,
  patient_name text default 'Anonymous Patient',
  rating int not null check (rating between 1 and 5),
  comment text,
  response text,
  created_at timestamptz default now()
);

-- 8. DOCTOR LEAVE REQUESTS
create table public.leave_requests (
  id text primary key default gen_random_uuid()::text,
  doctor_id text references public.doctors(id) on delete cascade not null,
  hospital_id text references public.hospitals(id) on delete cascade not null,
  doctor_name text not null,
  specialty text,
  from_date date not null,
  to_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.doctors enable row level security;
alter table public.clinic_staff_accounts enable row level security;
alter table public.family_members enable row level security;
alter table public.queue_tokens enable row level security;
alter table public.reviews enable row level security;
alter table public.leave_requests enable row level security;

-- Profiles: Anyone can view, user can manage only own profile
create policy "Profiles are viewable by all" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Hospitals: Publicly viewable and manageable by hospital business owner
create policy "Hospitals are publicly viewable" on public.hospitals for select using (true);
create policy "Hospital owners can insert hospitals" on public.hospitals for insert with check (auth.uid()::text = owner_id);
create policy "Hospital owners can update hospitals" on public.hospitals for update using (auth.uid()::text = owner_id);

-- Doctors: Publicly viewable, manageable by clinic owner or the doctor
create policy "Doctors are publicly viewable" on public.doctors for select using (true);
create policy "Hospital owners can insert doctors" on public.doctors for insert with check (
  exists (select 1 from public.hospitals where hospitals.id = doctors.hospital_id and hospitals.owner_id = auth.uid()::text)
);
create policy "Hospital owners can update doctors" on public.doctors for update using (
  exists (select 1 from public.hospitals where hospitals.id = doctors.hospital_id and hospitals.owner_id = auth.uid()::text)
  or doctors.id = auth.uid()::text
);

-- Staff Accounts: Viewable and manageable only by hospital business owner
create policy "Staff accounts viewable by hospital owner" on public.clinic_staff_accounts for select using (
  exists (select 1 from public.hospitals where hospitals.id = clinic_staff_accounts.hospital_id and hospitals.owner_id = auth.uid()::text)
);
create policy "Staff accounts insertable by hospital owner" on public.clinic_staff_accounts for insert with check (
  exists (select 1 from public.hospitals where hospitals.id = clinic_staff_accounts.hospital_id and hospitals.owner_id = auth.uid()::text)
);
create policy "Staff accounts updatable by hospital owner" on public.clinic_staff_accounts for update using (
  exists (select 1 from public.hospitals where hospitals.id = clinic_staff_accounts.hospital_id and hospitals.owner_id = auth.uid()::text)
);
create policy "Staff accounts deletable by hospital owner" on public.clinic_staff_accounts for delete using (
  exists (select 1 from public.hospitals where hospitals.id = clinic_staff_accounts.hospital_id and hospitals.owner_id = auth.uid()::text)
);

-- Family Members: Strictly isolated per patient (Patient can only access their own family members)
create policy "Family members viewable only by owner patient" on public.family_members for select using (auth.uid()::text = patient_id);
create policy "Family members insertable only by owner patient" on public.family_members for insert with check (auth.uid()::text = patient_id);
create policy "Family members updatable only by owner patient" on public.family_members for update using (auth.uid()::text = patient_id) with check (auth.uid()::text = patient_id);
create policy "Family members deletable only by owner patient" on public.family_members for delete using (auth.uid()::text = patient_id);

-- Queue Tokens: Patients can view/manage own tokens; staff & doctors can view/manage tokens for their assigned hospital
create policy "Tokens are viewable by owner patient or clinic staff" on public.queue_tokens for select using (
  auth.uid()::text = patient_id 
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.hospital_id = queue_tokens.hospital_id)
);
create policy "Tokens are insertable by authenticated patient or staff" on public.queue_tokens for insert with check (
  auth.uid()::text = patient_id 
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.hospital_id = queue_tokens.hospital_id)
);
create policy "Tokens are updatable by patient or hospital staff" on public.queue_tokens for update using (
  auth.uid()::text = patient_id 
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.hospital_id = queue_tokens.hospital_id)
);
create policy "Tokens are deletable by patient or hospital staff" on public.queue_tokens for delete using (
  auth.uid()::text = patient_id 
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.hospital_id = queue_tokens.hospital_id)
);

-- Reviews: Publicly viewable, insertable by verified patients
create policy "Reviews are viewable by all" on public.reviews for select using (true);
create policy "Reviews insertable by patient" on public.reviews for insert with check (auth.uid()::text = patient_id);
create policy "Reviews updatable by reviewer or clinic" on public.reviews for update using (
  auth.uid()::text = patient_id 
  or exists (select 1 from public.hospitals where hospitals.id = reviews.hospital_id and hospitals.owner_id = auth.uid()::text)
);

-- Leave Requests:
-- Leave Requests: Doctors can manage own leave requests; hospital owners can view and approve
create policy "Leave requests viewable by doctor or hospital owner" on public.leave_requests for select using (
  auth.uid()::text = doctor_id
  or exists (select 1 from public.hospitals where hospitals.id = leave_requests.hospital_id and hospitals.owner_id = auth.uid()::text)
);
create policy "Leave requests insertable by doctor" on public.leave_requests for insert with check (auth.uid()::text = doctor_id);
create policy "Leave requests updatable by hospital owner or doctor" on public.leave_requests for update using (
  auth.uid()::text = doctor_id
  or exists (select 1 from public.hospitals where hospitals.id = leave_requests.hospital_id and hospitals.owner_id = auth.uid()::text)
);
create policy "Leave requests deletable by doctor" on public.leave_requests for delete using (auth.uid()::text = doctor_id);

--------------------------------------------------------------------------------
-- AUTH HOOK TRIGGER (Auto-create profile row on signup)
--------------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, hospital_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'hospital_id'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    hospital_id = excluded.hospital_id,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Realtime on queue_tokens, reviews, leave_requests, hospitals, doctors
alter publication supabase_realtime add table public.queue_tokens;
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.hospitals;
alter publication supabase_realtime add table public.doctors;
alter publication supabase_realtime add table public.leave_requests;

-- Supabase SQL Schema for AI 금쪽이 모니터
-- Copy and paste this into the Supabase SQL Editor and run it.

-- 1. Create users table (Renamed to chatbot_users to avoid conflicts)
create table public.chatbot_users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  role text not null default 'teacher' check (role in ('admin', 'teacher')),
  description text, -- Added description field for admin memos
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create devices table (Renamed to chatbot_devices)
create table public.chatbot_devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.chatbot_users(id) on delete cascade,
  device_id text not null,
  alias text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, device_id)
);

-- 3. Insert default admin account
-- ID: admin / PW: admin123
insert into public.chatbot_users (username, password, role) values ('admin', 'admin123', 'admin');

-- 4. Set up Row Level Security (RLS) - Optional but recommended
alter table public.chatbot_users enable row level security;
alter table public.chatbot_devices enable row level security;

-- Allow all operations for now (since we are not using Supabase Auth, but custom auth)
create policy "Allow all operations on chatbot_users" on public.chatbot_users for all using (true);
create policy "Allow all operations on chatbot_devices" on public.chatbot_devices for all using (true);

-- Create meetings table
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null default current_date,
  audio_file_url text,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'error')),
  participants text,
  summary text,
  transcription text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.meetings enable row level security;

-- Policies for meetings
create policy "meetings_select_own" on public.meetings 
  for select using (auth.uid() = user_id);

create policy "meetings_insert_own" on public.meetings 
  for insert with check (auth.uid() = user_id);

create policy "meetings_update_own" on public.meetings 
  for update using (auth.uid() = user_id);

create policy "meetings_delete_own" on public.meetings 
  for delete using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists meetings_user_id_idx on public.meetings(user_id);
create index if not exists meetings_date_idx on public.meetings(date);

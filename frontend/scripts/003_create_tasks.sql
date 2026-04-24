-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  assignee text,
  due_date date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  created_automatically boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.tasks enable row level security;

-- Policies for tasks (user can access tasks for their own meetings)
create policy "tasks_select_own" on public.tasks 
  for select using (
    exists (
      select 1 from public.meetings 
      where meetings.id = tasks.meeting_id 
      and meetings.user_id = auth.uid()
    )
  );

create policy "tasks_insert_own" on public.tasks 
  for insert with check (
    exists (
      select 1 from public.meetings 
      where meetings.id = tasks.meeting_id 
      and meetings.user_id = auth.uid()
    )
  );

create policy "tasks_update_own" on public.tasks 
  for update using (
    exists (
      select 1 from public.meetings 
      where meetings.id = tasks.meeting_id 
      and meetings.user_id = auth.uid()
    )
  );

create policy "tasks_delete_own" on public.tasks 
  for delete using (
    exists (
      select 1 from public.meetings 
      where meetings.id = tasks.meeting_id 
      and meetings.user_id = auth.uid()
    )
  );

-- Create index for faster queries
create index if not exists tasks_meeting_id_idx on public.tasks(meeting_id);

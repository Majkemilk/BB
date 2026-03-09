-- Create the templates table for user-created task templates ("Seedlings")
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  task_data jsonb not null,
  created_at timestamp with time zone not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.templates enable row level security;

-- Policy: Allow users to SELECT (read) their own templates
create policy "Users can select their own templates"
  on public.templates
  for select
  using (auth.uid() = user_id);

-- Policy: Allow users to INSERT templates for themselves
create policy "Users can insert their own templates"
  on public.templates
  for insert
  with check (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own templates
create policy "Users can update their own templates"
  on public.templates
  for update
  using (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own templates
create policy "Users can delete their own templates"
  on public.templates
  for delete
  using (auth.uid() = user_id);
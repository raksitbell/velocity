-- Create activity_logs table
create table activity_logs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) not null,
  user_id uuid references auth.users(id) not null,
  user_email text,
  action text not null, -- 'create', 'move', 'delete'
  details jsonb not null default '{}'::jsonb, -- e.g. { "task_title": "Fix bug", "from_status": "todo", "to_status": "in-progress" }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table activity_logs enable row level security;

-- Policy: Users can view logs for projects they own (or belong to, for now owner)
create policy "Users can view logs for their projects"
on activity_logs for select
using (
  project_id in (
    select id from projects where owner_id = auth.uid()
  )
);

-- Policy: Users can insert logs for their projects
create policy "Users can insert logs for their projects"
on activity_logs for insert
with check (
  project_id in (
    select id from projects where owner_id = auth.uid()
  )
);

-- Create tags table
create table tags (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) not null,
  name text not null,
  color text not null default '#6b7280', -- Tailwind gray-500
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create task_tags junction table
create table task_tags (
  task_id uuid references tasks(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (task_id, tag_id)
);

-- Enable RLS
alter table tags enable row level security;
alter table task_tags enable row level security;

-- Policies for Tags
create policy "Users can view tags for their projects"
on tags for select
using (
  project_id in (
    select id from projects where owner_id = auth.uid()
  )
);

create policy "Users can create tags for their projects"
on tags for insert
with check (
  project_id in (
    select id from projects where owner_id = auth.uid()
  )
);

-- Policies for Task Tags
create policy "Users can view task tags for their projects"
on task_tags for select
using (
  task_id in (
    select id from tasks where project_id in (
        select id from projects where owner_id = auth.uid()
    )
  )
);

create policy "Users can assign tags for their projects"
on task_tags for insert
with check (
  task_id in (
    select id from tasks where project_id in (
        select id from projects where owner_id = auth.uid()
    )
  )
);

create policy "Users can remove tags for their projects"
on task_tags for delete
using (
  task_id in (
    select id from tasks where project_id in (
        select id from projects where owner_id = auth.uid()
    )
  )
);

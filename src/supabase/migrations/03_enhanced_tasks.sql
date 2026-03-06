-- Add new columns to tasks table
alter table tasks 
add column if not exists assignee_id uuid references auth.users(id),
add column if not exists attachments jsonb default '[]'::jsonb,
add column if not exists priority text default 'Medium', -- Ensure this exists if not already
add column if not exists due_date timestamp with time zone;

-- Update RLS policies if needed (existing ones usually cover 'all' operations for project members)
-- If tasks policies rely on project_id, they should be fine.

-- We might need a bucket for task attachments
insert into storage.buckets (id, name, public) 
values ('task-attachments', 'task-attachments', true)
on conflict (id) do nothing;

-- Storage Policy: Allow authenticated users to upload
create policy "Authenticated users can upload task attachments"
on storage.objects for insert
with check (
  bucket_id = 'task-attachments' and
  auth.role() = 'authenticated'
);

-- Storage Policy: Allow users to view attachments
create policy "Users can view task attachments"
on storage.objects for select
using (
  bucket_id = 'task-attachments'
);

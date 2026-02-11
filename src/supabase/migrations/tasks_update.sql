-- Add project_id to tasks table if it doesn't exist
alter table tasks 
add column if not exists project_id uuid references projects(id) on delete cascade;

-- Make board_id nullable as we are transitioning to project_id based tasks
alter table tasks alter column board_id drop not null;

-- Policies (Drop first to avoid errors on re-run)
drop policy if exists "Authenticated users can view tasks" on tasks;
drop policy if exists "Authenticated users can create tasks" on tasks;
drop policy if exists "Authenticated users can update tasks" on tasks;
drop policy if exists "Authenticated users can delete tasks" on tasks;

create policy "Authenticated users can view tasks" on tasks for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create tasks" on tasks for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update tasks" on tasks for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete tasks" on tasks for delete using (auth.role() = 'authenticated');

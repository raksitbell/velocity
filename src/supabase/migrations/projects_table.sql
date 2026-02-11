-- Create projects table
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  cover_image text,
  owner_id uuid references auth.users not null
);

-- Enable RLS
alter table projects enable row level security;

-- Policies
create policy "Authenticated users can view projects" on projects for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create projects" on projects for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own projects" on projects for update using (auth.uid() = owner_id);
create policy "Users can delete their own projects" on projects for delete using (auth.uid() = owner_id);

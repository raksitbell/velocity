-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- WORKSPACES
create table workspaces (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  owner_id uuid references profiles(id) not null
);

-- BOARDS (Kanban)
create table boards (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  workspace_id uuid references workspaces(id) on delete cascade not null
);

-- LISTS (Columns in Board)
create table lists (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  position integer not null default 0,
  board_id uuid references boards(id) on delete cascade not null
);

-- TASKS (Cards / Issues)
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  status text default 'todo', -- 'todo', 'in-progress', 'done' (or linked to list)
  priority text default 'medium', -- 'low', 'medium', 'high'
  position integer not null default 0,
  due_date timestamp with time zone,
  
  list_id uuid references lists(id) on delete cascade, -- Optional if just Backlog
  board_id uuid references boards(id) on delete cascade not null,
  assignee_id uuid references profiles(id)
);

-- DOCUMENTS (Notion-like)
create table documents (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null default 'Untitled',
  content text, -- JSON or HTML content
  workspace_id uuid references workspaces(id) on delete cascade not null
);

-- RLS POLICIES (Simple for now: allow authenticated access)
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table boards enable row level security;
alter table lists enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Workspace policies (Simplified: Owner only for now, or public if needed)
-- In a real app, you'd have a workspace_members table.
create policy "Authenticated users can view workspaces" on workspaces for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create workspaces" on workspaces for insert with check (auth.role() = 'authenticated');

-- Generic policies for children (boards, lists, tasks, docs)
-- Ideally check if user is member of workspace, here just checking auth for simplicity of demo
create policy "Enable all access for authenticated users" on boards for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on lists for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on tasks for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on documents for all using (auth.role() = 'authenticated');

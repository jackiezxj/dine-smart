-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  is_admin boolean default false,
  avatar_url text,
  updated_at timestamp with time zone,
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Dishes Table
create table dishes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  calories integer not null,
  protein float not null, -- grams
  carbs float not null, -- grams
  fat float not null, -- grams
  image_url text,
  tags text[], -- Array of tags
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Reviews Table
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  dish_id uuid references dishes(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Meal History / Recommendations
create table meal_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  dish_id uuid references dishes(id) on delete cascade not null,
  status text check (status in ('recommended', 'accepted', 'rejected', 'eaten')),
  log_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
alter table profiles enable row level security;
alter table dishes enable row level security;
alter table reviews enable row level security;
alter table meal_logs enable row level security;

-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Dishes: Public read, Admin write
create policy "Dishes are viewable by everyone." on dishes for select using (true);
create policy "Admins can insert dishes." on dishes for insert with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Admins can update dishes." on dishes for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Reviews: Public read, Authenticated create
create policy "Reviews are viewable by everyone." on reviews for select using (true);
create policy "Authenticated users can create reviews." on reviews for insert with check (auth.role() = 'authenticated');

-- Triggers for handling new user creation
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, is_admin)
  values (new.id, new.raw_user_meta_data->>'username', false);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

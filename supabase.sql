-- Run once in Supabase: SQL Editor > New query
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  city text not null, image text, description text,
  created_at timestamptz default now(),
  unique (user_id, city)
);
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  city text not null, name text not null,
  rating int not null check (rating between 1 and 5),
  text text not null,
  created_at timestamptz default now()
);
create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  city text not null, name text, email text,
  people int not null default 1,
  checkin date not null, checkout date not null, notes text,
  status text not null default 'pending',
  created_at timestamptz default now()
);
alter table favorites enable row level security;
alter table reviews   enable row level security;
alter table bookings  enable row level security;

create policy "own favorites" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read reviews"  on reviews for select using (true);
create policy "add review"    on reviews for insert with check (auth.uid() = user_id);
create policy "delete review" on reviews for delete using (auth.uid() = user_id);
create policy "read booking"  on bookings for select using (auth.uid() = user_id);
create policy "add booking"   on bookings for insert with check (auth.uid() = user_id);
create policy "edit booking"  on bookings for update using (auth.uid() = user_id);

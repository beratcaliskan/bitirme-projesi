-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum type for order status
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- Create users table (standalone without Supabase auth)
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text unique not null,
  password text not null,
  phone text unique,
  email_verified boolean default false,
  phone_verified boolean default false,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create addresses table
create table public.addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null, -- Ev, İş vb.
  full_name text not null,
  phone text not null,
  city text not null,
  district text not null,
  neighborhood text not null,
  full_address text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payment_methods table
create table public.payment_methods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  card_holder text not null,
  -- Encrypt sensitive data in production
  card_number text not null,
  expire_month integer not null,
  expire_year integer not null,
  cvv text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null,
  stock integer default 0 not null,
  images text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  address_id uuid references public.addresses not null,
  payment_method_id uuid references public.payment_methods not null,
  status order_status default 'PENDING' not null,
  total_amount decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders on delete cascade not null,
  product_id uuid references public.products not null,
  quantity integer not null,
  price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index addresses_user_id_idx on public.addresses(user_id);
create index payment_methods_user_id_idx on public.payment_methods(user_id);
create index orders_user_id_idx on public.orders(user_id);
create index orders_address_id_idx on public.orders(address_id);
create index orders_payment_method_id_idx on public.orders(payment_method_id);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

-- Create functions for managing default addresses and payment methods
create or replace function public.set_default_address()
returns trigger as $$
begin
  if NEW.is_default then
    update public.addresses
    set is_default = false
    where user_id = NEW.user_id
    and id != NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger set_default_address_trigger
before insert or update of is_default on public.addresses
for each row
execute function public.set_default_address();

create or replace function public.set_default_payment_method()
returns trigger as $$
begin
  if NEW.is_default then
    update public.payment_methods
    set is_default = false
    where user_id = NEW.user_id
    and id != NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger set_default_payment_method_trigger
before insert or update of is_default on public.payment_methods
for each row
execute function public.set_default_payment_method();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql security definer;

-- Add updated_at triggers to all tables
create trigger handle_updated_at_users
before update on public.users
for each row execute function public.handle_updated_at();

create trigger handle_updated_at_addresses
before update on public.addresses
for each row execute function public.handle_updated_at();

create trigger handle_updated_at_payment_methods
before update on public.payment_methods
for each row execute function public.handle_updated_at();

create trigger handle_updated_at_products
before update on public.products
for each row execute function public.handle_updated_at();

create trigger handle_updated_at_orders
before update on public.orders
for each row execute function public.handle_updated_at();

create trigger handle_updated_at_order_items
before update on public.order_items
for each row execute function public.handle_updated_at(); 
-- Create carts table
create table if not exists public.carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cart_items table
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references public.carts(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null check (quantity > 0),
  color_id uuid references public.colors(id),
  size_id uuid references public.sizes(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cart_id, product_id, color_id, size_id)
);

-- Create indexes
create index if not exists carts_user_id_idx on public.carts(user_id);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists cart_items_product_id_idx on public.cart_items(product_id);

-- Create RLS policies
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Carts policies
create policy "Users can view their own cart"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cart"
  on public.carts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cart"
  on public.carts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cart"
  on public.carts for delete
  using (auth.uid() = user_id);

-- Cart items policies
create policy "Users can view their cart items"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert items to their cart"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update their cart items"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete their cart items"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id
      and user_id = auth.uid()
    )
  );

-- Create functions
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger handle_updated_at_carts
  before update on public.carts
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at_cart_items
  before update on public.cart_items
  for each row
  execute procedure public.handle_updated_at(); 
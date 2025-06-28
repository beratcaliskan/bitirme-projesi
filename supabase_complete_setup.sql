-- Complete Supabase Database Setup Script
-- This script creates all tables, enums, indexes, triggers, and policies
-- Run this script in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
DO $$ 
BEGIN
    -- Create admin_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE admin_role AS ENUM ('admin', 'super_admin', 'moderator');
    END IF;
    
    -- Create order_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');
    END IF;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password text NOT NULL,
    phone text UNIQUE,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    image text,
    address text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email text NOT NULL UNIQUE,
    password text NOT NULL,
    role admin_role NOT NULL DEFAULT 'admin'::admin_role,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT admins_pkey PRIMARY KEY (id)
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    city text NOT NULL,
    district text NOT NULL,
    neighborhood text NOT NULL,
    full_address text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT addresses_pkey PRIMARY KEY (id),
    CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    card_holder text NOT NULL,
    card_number text NOT NULL,
    expire_month integer NOT NULL,
    expire_year integer NOT NULL,
    cvv text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
    CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    image_url text DEFAULT 'NULL'::text,
    sizes jsonb DEFAULT '[]'::jsonb,
    colors jsonb DEFAULT '[]'::jsonb,
    stock jsonb DEFAULT '[]'::jsonb,
    type character varying DEFAULT 'simple'::character varying CHECK (type::text = ANY (ARRAY['simple'::character varying::text, 'color'::character varying::text, 'size'::character varying::text, 'size+color'::character varying::text])),
    brand text,
    category text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    address_id uuid NOT NULL,
    payment_method_id uuid NOT NULL,
    status order_status NOT NULL DEFAULT 'PENDING'::order_status,
    total_amount numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    name text NOT NULL,
    quantity integer NOT NULL,
    price numeric NOT NULL,
    image_url text,
    variants jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Create carts table
CREATE TABLE IF NOT EXISTS public.carts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'active'::text,
    total_amount numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT carts_pkey PRIMARY KEY (id)
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    cart_id uuid NOT NULL,
    product_id text NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    image_url text,
    variants jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT cart_items_pkey PRIMARY KEY (id),
    CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE
);

-- Create support_chats table
CREATE TABLE IF NOT EXISTS public.support_chats (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    admin_id uuid,
    status character varying NOT NULL DEFAULT 'OPEN'::character varying CHECK (status::text = ANY (ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'CLOSED'::character varying]::text[])),
    priority character varying NOT NULL DEFAULT 'MEDIUM'::character varying CHECK (priority::text = ANY (ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'URGENT'::character varying]::text[])),
    subject text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_message_at timestamp with time zone,
    CONSTRAINT support_chats_pkey PRIMARY KEY (id),
    CONSTRAINT fk_support_chats_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_chats_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_chats_admin FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE SET NULL
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    chat_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_type character varying NOT NULL CHECK (sender_type::text = ANY (ARRAY['USER'::character varying, 'ADMIN'::character varying]::text[])),
    message text NOT NULL,
    message_type character varying NOT NULL DEFAULT 'TEXT'::character varying CHECK (message_type::text = ANY (ARRAY['TEXT'::character varying, 'IMAGE'::character varying, 'FILE'::character varying]::text[])),
    file_url text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT support_messages_pkey PRIMARY KEY (id),
    CONSTRAINT fk_support_messages_chat FOREIGN KEY (chat_id) REFERENCES public.support_chats(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_order_id ON public.support_chats(order_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_user_id ON public.support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_admin_id ON public.support_chats(admin_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON public.support_chats(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_chat_id ON public.support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON public.support_messages(sender_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carts_updated_at ON public.carts;
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_chats_updated_at ON public.support_chats;
CREATE TRIGGER update_support_chats_updated_at BEFORE UPDATE ON public.support_chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at BEFORE UPDATE ON public.support_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating last_message_at in support_chats
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.support_chats 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_chat_last_message_trigger ON public.support_messages;
CREATE TRIGGER update_chat_last_message_trigger 
    AFTER INSERT ON public.support_messages 
    FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- Enable Realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Create RLS policies for Realtime
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for development (adjust for production)
-- Allow all operations for authenticated users (you can make this more restrictive)
CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.admins FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.addresses FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.payment_methods FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.carts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.cart_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.support_chats FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.support_messages FOR ALL USING (true);

-- Create a function to check if realtime is properly configured
CREATE OR REPLACE FUNCTION check_realtime_config()
RETURNS TABLE(
    table_name text,
    is_in_publication boolean,
    rls_enabled boolean,
    policy_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        (EXISTS(
            SELECT 1 FROM pg_publication_tables pt 
            WHERE pt.pubname = 'supabase_realtime' 
            AND pt.tablename = t.table_name
        )) as is_in_publication,
        c.relrowsecurity as rls_enabled,
        (SELECT COUNT(*)::integer FROM pg_policies p WHERE p.tablename = t.table_name) as policy_count
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('users', 'admins', 'addresses', 'payment_methods', 'products', 'orders', 'order_items', 'carts', 'cart_items', 'support_chats', 'support_messages')
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Storage Setup for Product Images
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product images
-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow everyone to view product images
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Create policy to allow authenticated users to update their uploads
CREATE POLICY "Users can update product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete images
CREATE POLICY "Users can delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, admins, addresses, payment_methods, products, orders, order_items, carts, cart_items, support_chats, support_messages';
    RAISE NOTICE 'Storage bucket created: product-images with proper policies';
    RAISE NOTICE 'Indexes, triggers, and RLS policies have been applied.';
    RAISE NOTICE 'Realtime has been enabled for: support_chats, support_messages, orders, users';
    RAISE NOTICE 'Run "SELECT * FROM check_realtime_config();" to verify realtime configuration.';
END $$; 
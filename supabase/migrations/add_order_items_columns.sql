-- Add missing columns to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS variants jsonb;
 
-- Create index for better performance
CREATE INDEX IF NOT EXISTS order_items_variants_idx ON public.order_items USING gin(variants); 
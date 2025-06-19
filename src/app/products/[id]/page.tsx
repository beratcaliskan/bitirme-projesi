import ProductDetail from '@/components/products/ProductDetail';
import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';

interface Props {
  params: Promise<{
  id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  const { data: product } = await supabase
        .from('products')
    .select('name, description')
    .eq('id', id)
        .single();

  return {
    title: product?.name || 'Product Details',
    description: product?.description || 'Product details page'
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  
  return <ProductDetail productId={id} />;
} 
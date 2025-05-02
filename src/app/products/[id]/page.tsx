import ProductDetail from '@/components/products/ProductDetail';
import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';

interface Props {
  params: {
  id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: product } = await supabase
        .from('products')
    .select('name, description')
        .eq('id', params.id)
        .single();

  return {
    title: product?.name || 'Product Details',
    description: product?.description || 'Product details page'
  };
}

export default async function ProductPage({ params }: Props) {
  return <ProductDetail productId={params.id} />;
} 
import { supabase } from '../db/supabase';
import { CreateProductData, Product, UpdateProductData } from '@/types/product';

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Ürünler getirilirken bir hata oluştu');
  }

  return data as Product[];
}

export async function getProductById(id: number): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('Ürün bulunamadı');
  }

  return data as Product;
}

export async function createProduct(productData: CreateProductData): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error || !data) {
    throw new Error('Ürün oluşturulurken bir hata oluştu');
  }

  return data as Product;
}

export async function updateProduct({ id, ...updateData }: UpdateProductData): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Ürün güncellenirken bir hata oluştu');
  }

  return data as Product;
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Ürün silinirken bir hata oluştu');
  }
} 
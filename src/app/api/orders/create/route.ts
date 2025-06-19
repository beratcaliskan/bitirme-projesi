import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
  variants: Record<string, string>;
}

interface OrderRequest {
  user_id: string;
  address_id: string;
  payment_method_id: string;
  items: CartItem[];
  total_amount: number;
}

export async function POST(request: Request) {
  try {
    const orderData: OrderRequest = await request.json();
    const { user_id, address_id, payment_method_id, items, total_amount } = orderData;

    if (!user_id || !address_id || !payment_method_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Eksik bilgiler. Tüm alanları doldurun.' },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          address_id,
          payment_method_id,
          status: 'PENDING',
          total_amount,
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Sipariş oluşturulamadı');
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image_url: item.image_url || null,
      variants: item.variants || {}
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      throw new Error('Sipariş öğeleri oluşturulamadı');
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      message: 'Sipariş başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sipariş oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
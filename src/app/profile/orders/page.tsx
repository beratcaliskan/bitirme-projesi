'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, Product } from '@/lib/supabase';

interface ExtendedOrderItem extends OrderItem {
  product: Product;
}

interface ExtendedOrder extends Order {
  items: ExtendedOrderItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          address:addresses(city, district),
          payment_method:payment_methods(card_number)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items with product details for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              product:products(*)
            `)
            .eq('order_id', order.id);

          if (itemsError) throw itemsError;

          return {
            ...order,
            items: itemsData
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!user) {
    return <div className="text-center">Lütfen giriş yapın.</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Henüz siparişiniz bulunmuyor.</h3>
        <p className="mt-1 text-sm text-gray-500">Siparişleriniz burada listelenecektir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Sipariş #{order.id.slice(-8)}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" 
                  style={{
                    backgroundColor: getStatusColor(order.status).bg,
                    color: getStatusColor(order.status).text
                  }}
                >
                  {getStatusText(order.status)}
                </span>
                <span className="mt-1 text-sm font-medium text-gray-900">
                  {order.total_amount.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {order.items.map((item) => (
                  <li key={item.id} className="py-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} adet x {item.price.toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {(item.quantity * item.price).toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 bg-gray-50">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-600">Teslimat Adresi</p>
                <p className="mt-1 font-medium">
                  {order.address.district}, {order.address.city}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Ödeme Yöntemi</p>
                <p className="mt-1 font-medium">
                  **** {order.payment_method.card_number.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: Order['status']) {
  switch (status) {
    case 'PENDING':
      return { bg: '#FEF3C7', text: '#92400E' }; // Yellow
    case 'PROCESSING':
      return { bg: '#DBEAFE', text: '#1E40AF' }; // Blue
    case 'SHIPPED':
      return { bg: '#E0E7FF', text: '#3730A3' }; // Indigo
    case 'DELIVERED':
      return { bg: '#D1FAE5', text: '#065F46' }; // Green
    case 'CANCELLED':
      return { bg: '#FEE2E2', text: '#991B1B' }; // Red
    default:
      return { bg: '#F3F4F6', text: '#374151' }; // Gray
  }
}

function getStatusText(status: Order['status']) {
  switch (status) {
    case 'PENDING':
      return 'Onay Bekliyor';
    case 'PROCESSING':
      return 'Hazırlanıyor';
    case 'SHIPPED':
      return 'Kargoya Verildi';
    case 'DELIVERED':
      return 'Teslim Edildi';
    case 'CANCELLED':
      return 'İptal Edildi';
    default:
      return status;
  }
} 
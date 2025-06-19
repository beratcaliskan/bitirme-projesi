'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { OrderDetailModal } from '@/components/profile/OrderDetailModal';
import Image from 'next/image';
import { 
  Package, 
  Truck, 
  Check, 
  Clock, 
  X, 
  MapPin,
  CreditCard,
  Eye,
  ChevronRight,
  Calendar,
  Hash
} from 'lucide-react';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  image_url: string | null;
  variants: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  user_id: string;
  address_id: string;
  payment_method_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  address: {
    name: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    full_address: string;
  };
  payment_method: {
    card_holder: string;
    card_number: string;
  };
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          const { data: addressData } = await supabase
            .from('addresses')
            .select('name, phone, city, district, neighborhood, full_address')
            .eq('id', order.address_id)
            .single();

          const { data: paymentData } = await supabase
            .from('payment_methods')
            .select('card_holder, card_number')
            .eq('id', order.payment_method_id)
            .single();

          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
          }

          return {
            ...order,
            items: itemsData || [],
            address: addressData || {
              name: 'Bilinmeyen',
              phone: '',
              city: 'Bilinmeyen',
              district: 'Bilinmeyen',
              neighborhood: 'Bilinmeyen',
              full_address: 'Bilinmeyen'
            },
            payment_method: paymentData || {
              card_holder: 'Bilinmeyen',
              card_number: '0000'
            }
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] mx-4 sm:mx-0">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8 sm:py-12 mx-4 sm:mx-0">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">Lütfen giriş yapın.</h3>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm mx-4 sm:mx-0">
        <div className="max-w-md mx-auto px-4">
          <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">Henüz siparişiniz bulunmuyor</h3>
          <p className="mt-2 text-sm text-gray-500">
            Siparişleriniz burada görüntülenecektir.
          </p>
          <Button className="mt-6 w-full sm:w-auto" onClick={() => window.location.href = '/products'}>
            Alışverişe Başla
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Siparişlerim</h1>
        <div className="text-sm text-gray-500">
          Toplam {orders.length} sipariş
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6">
      {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-mono text-gray-600">
                      {order.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">
                      {new Date(order.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
              </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-200' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {order.status === 'PENDING' && <Clock className="w-3 h-3" />}
                    {order.status === 'PROCESSING' && <Package className="w-3 h-3" />}
                    {order.status === 'SHIPPED' && <Truck className="w-3 h-3" />}
                    {order.status === 'DELIVERED' && <Check className="w-3 h-3" />}
                    {order.status === 'CANCELLED' && <X className="w-3 h-3" />}
                    {order.status === 'PENDING' ? 'Onay Bekliyor' :
                     order.status === 'PROCESSING' ? 'Hazırlanıyor' :
                     order.status === 'SHIPPED' ? 'Kargoya Verildi' :
                     order.status === 'DELIVERED' ? 'Teslim Edildi' :
                     order.status === 'CANCELLED' ? 'İptal Edildi' : order.status}
                </span>
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {order.total_amount.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Ürünler ({order.items.length})
                  </h4>
                  <div className="space-y-3 max-h-40 sm:max-h-48 overflow-y-auto">
                    {order.items.map((item) => {
                      let variantItems = [];
                      try {
                        const parsed = typeof item.variants === 'string' 
                          ? JSON.parse(item.variants || '[]') 
                          : item.variants || [];
                        variantItems = Array.isArray(parsed) ? parsed : [];
                      } catch (e) {
                        console.error('Error parsing variants:', e);
                      }

                      const colorVariant = variantItems.find(v => v.code);
                      const sizeVariant = variantItems.find(v => !v.code && v.name);

                      return (
                        <div key={item.id} className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                      </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {item.name}
                        </p>
                            <div className="text-xs text-gray-500 space-y-1">
                              {(colorVariant || sizeVariant) && (
                                <p className="flex items-center gap-1">
                                  {colorVariant && (
                                    <>
                                      <span>{colorVariant.name}</span>
                                      {colorVariant.code && (
                                        <span 
                                          className="inline-block w-2 h-2 rounded-full border"
                                          style={{ backgroundColor: colorVariant.code }}
                                        />
                                      )}
                                    </>
                                  )}
                                  {colorVariant && sizeVariant && <span> - </span>}
                                  {sizeVariant && <span>{sizeVariant.name}</span>}
                                </p>
                              )}
                              <p className="text-xs">{item.quantity} adet × {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                      </div>
                      </div>
                    </div>
                      );
                    })}
            </div>
          </div>

                <div className="space-y-3 sm:space-y-4">
              <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Teslimat Adresi
                    </h4>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{order.address.name}</p>
                      <p className="text-xs text-gray-500">{order.address.phone}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {order.address.neighborhood}, {order.address.district}, {order.address.city}
                </p>
              </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Ödeme Yöntemi
                    </h4>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{order.payment_method.card_holder}</p>
                      <p className="text-xs text-gray-500">**** **** **** {order.payment_method.card_number.slice(-4)}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openOrderDetail(order)}
                      className="w-full flex items-center justify-center space-x-2 text-xs sm:text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Detay Görüntüle</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>

      <OrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}

 
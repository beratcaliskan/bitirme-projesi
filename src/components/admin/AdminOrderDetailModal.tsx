'use client';

import { useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast-provider';
import { 
  XCircle, 
  Package, 
  MapPin, 
  CreditCard, 
  Calendar,
  Truck,
  Check,
  Clock,
  X
} from 'lucide-react';
import Image from 'next/image';

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
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  created_at: string;
  updated_at?: string;
  shipping_address: string;
  payment_method?: string;
  notes?: string;
  user: {
    name: string;
    email: string;
  };
  address: {
    name: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    full_address: string;
  };
  items: OrderItem[];
}

interface AdminOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onStatusUpdate: (orderId: string, newStatus: Order['status']) => void;
}

export function AdminOrderDetailModal({ isOpen, onClose, order, onStatusUpdate }: AdminOrderDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  if (!isOpen || !order) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Sipariş durumu güncellendi',
        variant: 'success'
      });

      onStatusUpdate(order.id, newStatus as Order['status']);
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Hata',
        description: 'Sipariş durumu güncellenirken bir hata oluştu',
        variant: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sipariş Detayı #{order.id.slice(-6)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Sipariş Durumu</h3>
            <div className="flex items-center gap-4">
              <StatusBadge status={order.status} />
                             <div className="flex-1">
                 <select
                   value={order.status}
                   onChange={(e) => handleStatusUpdate(e.target.value)}
                   disabled={isUpdating}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 >
                   <option value="PENDING">Onay Bekliyor</option>
                   <option value="PROCESSING">Hazırlanıyor</option>
                   <option value="SHIPPED">Kargoya Verildi</option>
                   <option value="DELIVERED">Teslim Edildi</option>
                   <option value="CANCELLED">İptal Edildi</option>
                 </select>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Müşteri Bilgileri
              </h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Ad:</span> {order.user.name}</p>
                <p className="text-sm"><span className="font-medium">E-posta:</span> {order.user.email}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-600" />
                Sipariş Bilgileri
              </h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Sipariş ID:</span> #{order.id.slice(-8)}</p>
                <p className="text-sm"><span className="font-medium">Toplam:</span> {order.total_amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                <p className="text-sm"><span className="font-medium">Tarih:</span> {new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-red-600" />
              Teslimat Adresi
            </h3>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Alıcı:</span> {order.address.name}</p>
              <p className="text-sm"><span className="font-medium">Telefon:</span> {order.address.phone}</p>
              <p className="text-sm">
                <span className="font-medium">Adres:</span> {order.address.full_address}, {order.address.neighborhood}, {order.address.district}, {order.address.city}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
              Ödeme Bilgileri
            </h3>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Ödeme Yöntemi:</span> {order.payment_method || 'Belirtilmemiş'}</p>
              <p className="text-sm"><span className="font-medium">Tutar:</span> {order.total_amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sipariş İçeriği ({order.items.length} ürün)</h3>
            <div className="space-y-4">
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
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      {item.image_url ? (
                        <Image 
                          src={item.image_url} 
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {(colorVariant || sizeVariant) && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          {colorVariant && (
                            <>
                              <span>{colorVariant.name}</span>
                              {colorVariant.code && (
                                <span 
                                  className="inline-block w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: colorVariant.code }}
                                />
                              )}
                            </>
                          )}
                          {colorVariant && sizeVariant && <span> - </span>}
                          {sizeVariant && <span>{sizeVariant.name}</span>}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {item.quantity} adet × {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {(item.quantity * item.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          text: 'Onay Bekliyor',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'PROCESSING':
        return {
          icon: Package,
          text: 'Hazırlanıyor',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'SHIPPED':
        return {
          icon: Truck,
          text: 'Kargoya Verildi',
          className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        };
      case 'DELIVERED':
        return {
          icon: Check,
          text: 'Teslim Edildi',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'CANCELLED':
        return {
          icon: X,
          text: 'İptal Edildi',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          icon: Clock,
          text: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
} 
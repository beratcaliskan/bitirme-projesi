'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { 
  Package, 
  Truck, 
  Check, 
  Clock, 
  X, 
  MapPin, 
  CreditCard
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

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  const [showAllItems, setShowAllItems] = useState(false);

  if (!isOpen || !order) return null;

  return (
    <div 
      className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 z-30 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                  Sipariş Detayı
                </h3>
                <p className="text-sm text-gray-500 font-mono">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Sipariş Durumu</h4>
                <span className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <OrderProgressBar status={order.status} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Sipariş İçeriği</h4>
                <span className="text-sm text-gray-500">
                  {order.items.length} ürün
                </span>
              </div>
              <div className="space-y-4">
                {(showAllItems ? order.items : order.items.slice(0, 3)).map((item) => {
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
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg relative">
                      <div className="relative w-16 h-16 flex-shrink-0 z-0">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{item.name}</h5>
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
                
                {order.items.length > 3 && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllItems(!showAllItems)}
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      {showAllItems 
                        ? `Daha Az Göster` 
                        : `${order.items.length - 3} Ürün Daha Göster`
                      }
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Teslimat Adresi
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{order.address.name}</p>
                    <p className="text-gray-600">{order.address.phone}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-700">
                      <span className="font-medium">{order.address.neighborhood}</span> Mahallesi
                    </p>
                    <p className="text-gray-700">
                      {order.address.district} / {order.address.city}
                    </p>
                    <p className="text-gray-600 mt-1 text-xs">
                      {order.address.full_address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                  Ödeme Bilgileri
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{order.payment_method.card_holder}</p>
                    <p className="text-gray-600">**** **** **** {order.payment_method.card_number.slice(-4)}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Toplam Tutar:</span>
                      <span className="font-semibold text-lg text-gray-900">
                        {order.total_amount.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-600">Sipariş Tarihi:</span>
                      <span className="text-gray-700 text-xs">
                        {new Date(order.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderProgressBar({ status }: { status: Order['status'] }) {
  const steps = [
    { key: 'PENDING', label: 'Onay Bekliyor', icon: Clock },
    { key: 'PROCESSING', label: 'Hazırlanıyor', icon: Package },
    { key: 'SHIPPED', label: 'Kargoya Verildi', icon: Truck },
    { key: 'DELIVERED', label: 'Teslim Edildi', icon: Check },
  ];

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
        <X className="w-5 h-5 text-red-600 mr-2" />
        <span className="text-red-800 font-medium">Sipariş İptal Edildi</span>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(step => step.key === status);
  const isCompleted = (stepIndex: number) => stepIndex <= currentStepIndex;
  const isCurrent = (stepIndex: number) => stepIndex === currentStepIndex;

  return (
    <div className="relative">
      <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500 ease-out"
          style={{ 
            width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' 
          }}
        />
      </div>

      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const completed = isCompleted(index);
          const current = isCurrent(index);
          
          return (
            <div key={step.key} className="flex flex-col items-center">
              <div className={`
                relative z-20 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${completed 
                  ? 'bg-indigo-500 border-transparent text-white shadow-lg' 
                  : current
                  ? 'bg-white border-indigo-500 text-indigo-600 shadow-md ring-2 ring-indigo-100'
                  : 'bg-white border-gray-300 text-gray-400'
                }
              `}>
                {completed && !current ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className={`w-5 h-5 ${current ? 'animate-pulse' : ''}`} />
                )}
              </div>
              
              <div className="mt-3 text-center">
                <p className={`text-xs font-medium ${
                  completed ? 'text-indigo-600' : 
                  current ? 'text-indigo-600' : 
                  'text-gray-500'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


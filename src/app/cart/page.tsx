'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/ui/cart-provider';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<{
    id: string;
    title: string;
    name: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    full_address: string;
    is_default: boolean;
  } | null>(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<{
    id: string;
    card_holder: string;
    card_number: string;
    is_default: boolean;
  } | null>(null);

  const fetchDefaults = useCallback(async () => {
    if (!user) return;

    try {
      const { data: allAddresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);

      console.log('All addresses:', allAddresses);

      const defaultAddr = allAddresses?.find(addr => 
        addr.is_default === true || addr.is_default === 'true' || addr.is_default === 1
      );

      console.log('Found default address:', defaultAddr);
      setDefaultAddress(defaultAddr || null);

      const { data: allPayments } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id);

      console.log('All payments:', allPayments);

      const defaultPayment = allPayments?.find(payment => 
        payment.is_default === true || payment.is_default === 'true' || payment.is_default === 1
      );

      console.log('Found default payment:', defaultPayment);
      setDefaultPaymentMethod(defaultPayment || null);

    } catch (error) {
      console.log('Default bilgiler yüklenirken hata:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDefaults();
    }
  }, [user, fetchDefaults]);

  const handleCreateOrder = async () => {
    if (!user) {
      toast({
        title: 'Giriş Yapın',
        description: 'Sipariş vermek için giriş yapmanız gerekiyor.',
        variant: 'destructive'
      });
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Sepet Boş',
        description: 'Sepetinizde ürün bulunmuyor.',
        variant: 'destructive'
      });
      return;
    }

    if (!defaultAddress) {
      toast({
        title: 'Adres Bulunamadı',
        description: 'Sipariş vermek için önce bir varsayılan adres eklemelisiniz.',
        variant: 'destructive'
      });
      router.push('/profile/addresses');
      return;
    }

    if (!defaultPaymentMethod) {
      toast({
        title: 'Ödeme Yöntemi Bulunamadı',
        description: 'Sipariş vermek için önce bir varsayılan ödeme yöntemi eklemelisiniz.',
        variant: 'destructive'
      });
      router.push('/profile/payment-methods');
      return;
    }

    setIsCreatingOrder(true);

    try {
      const orderData = {
        user_id: user.id,
        address_id: defaultAddress.id,
        payment_method_id: defaultPaymentMethod.id,
        items: items.map(item => {
          const variants = typeof item.variants === 'string' 
            ? JSON.parse(item.variants || '{}') 
            : item.variants || {};
          
          return {
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image_url: item.image_url,
            variants: variants
          };
        }),
        total_amount: total
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sipariş oluşturulamadı');
      }

      clearCart();

      toast({
        title: 'Sipariş Oluşturuldu!',
        description: 'Siparişiniz başarıyla alındı. Siparişlerim sayfasından takip edebilirsiniz.',
      });

              router.push('/profile/orders');

    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Sipariş oluşturulurken bir hata oluştu',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
          <p className="text-gray-600 mb-8">Sepetinizde ürün bulunmamaktadır.</p>
          <Link href="/products">
            <Button>
              Alışverişe Devam Et
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-2xl font-bold mb-8">Alışveriş Sepeti</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {items.map((item) => {
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
              <div key={item.id} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <div className="relative w-24 h-24">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Görsel yok</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                    {(colorVariant || sizeVariant) && (
                  <div className="text-sm text-gray-600 mt-1">
                      <p className="flex items-center gap-2">
                          {colorVariant && (
                            <>
                              <span className="font-medium">{colorVariant.name}</span>
                              {colorVariant.code && (
                          <span 
                            className="inline-block w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: colorVariant.code }}
                          />
                              )}
                            </>
                          )}
                          {colorVariant && sizeVariant && <span> - </span>}
                          {sizeVariant && (
                            <span className="font-medium">{sizeVariant.name}</span>
                        )}
                      </p>
                      </div>
                    )}
                  <p className="text-lg font-semibold mt-2">
                    {formatPrice(item.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={isCreatingOrder}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={isCreatingOrder}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(item.id)}
                  disabled={isCreatingOrder}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow h-fit">
          <h2 className="text-lg font-semibold mb-4">Sipariş Özeti</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Ara Toplam</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kargo</span>
              <span>Ücretsiz</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Ürün Sayısı</span>
              <span>{items.length} çeşit</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Toplam Adet</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)} adet</span>
            </div>
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between font-semibold">
              <span>Toplam</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <Button 
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={handleCreateOrder}
            disabled={isCreatingOrder}
          >
            {isCreatingOrder ? 'Sipariş Oluşturuluyor...' : 'Sipariş Ver'}
          </Button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            Demo amaçlı - Gerçek ödeme yapılmayacaktır
          </p>
        </div>
      </div>
    </div>
  );
} 
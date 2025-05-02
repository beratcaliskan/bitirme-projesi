'use client';

import { useCart } from '@/components/ui/cart-provider';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Alışveriş Sepeti</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <div className="relative w-24 h-24">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.variants?.color && (
                      <p className="flex items-center gap-2">
                        Renk: {item.variants.color.name}
                        {item.variants.color.code && (
                          <span 
                            className="inline-block w-4 h-4 rounded-full border"
                            style={{ backgroundColor: item.variants.color.code }}
                          />
                        )}
                      </p>
                    )}
                    {item.variants?.size && (
                      <p>Beden: {item.variants.size.name}</p>
                    )}
                  </div>
                  <p className="text-lg font-semibold mt-2">
                    {formatPrice(item.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
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
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between font-semibold">
              <span>Toplam</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <Button className="w-full mt-6">
            Ödemeye Geç
          </Button>
        </div>
      </div>
    </div>
  );
} 
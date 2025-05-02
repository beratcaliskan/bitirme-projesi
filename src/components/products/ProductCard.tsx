'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/ui/cart-provider';
import { useToast } from '@/components/ui/toast-provider';

interface ProductVariant {
  price: number;
  stock: number;
  size_id?: string;
  color_id?: string;
}

interface ProductColor {
  id: string;
  name: string;
  code: string;
}

interface ProductSize {
  id: string;
  name: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    image_url: string;
    type: 'simple' | 'color' | 'size' | 'size+color';
    stock: ProductVariant[];
    colors?: ProductColor[];
    sizes?: ProductSize[];
  };
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  
  // Stok durumunu hesapla
  const calculateStockStatus = () => {
    switch (product.type) {
      case 'simple':
        return (product.stock[0]?.stock || 0) > 0;
      case 'color':
      case 'size':
      case 'size+color':
        return product.stock.some(v => v.stock > 0);
      default:
        return false;
    }
  };

  const getTotalStock = () => {
    return product.stock.reduce((total, variant) => total + variant.stock, 0);
  };

  const hasStock = calculateStockStatus();
  const totalStock = getTotalStock();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasStock) return;

    // Eğer ürün varyantlı ise, ürün detay sayfasına yönlendir
    if (product.type !== 'simple') {
      window.location.href = `/products/${product.id}`;
      return;
    }

    try {
      await addItem({
        product_id: product.id,
        name: product.name,
        price: product.stock[0]?.price || product.price,
        quantity: 1,
        image_url: product.image_url || ''
      });

      toast({
        title: 'Başarılı',
        description: 'Ürün sepete eklendi'
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Ürün sepete eklenirken bir hata oluştu',
        variant: 'destructive'
      });
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="flex gap-6 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="relative w-48 h-48 flex-shrink-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
              <span className="text-gray-400">Görsel yok</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              hasStock ? "hidden" : "bg-red-100 text-red-800"
            )}>
              {hasStock ? "" : "Tükendi"}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex-1">
            {product.category && (
              <p className="text-sm text-gray-500 mb-1">{product.category}</p>
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              <Link href={`/products/${product.id}`} className="hover:text-indigo-600">
                {product.name}
              </Link>
            </h3>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium text-gray-900">
                {formatPrice(product.stock[0]?.price || product.price)}
              </span>
            </div>
            <button 
              onClick={handleAddToCart}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors",
                hasStock 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
              disabled={!hasStock}
            >
              {hasStock ? (product.type === 'simple' ? "Sepete Ekle" : "Seçenekleri Gör") : "Tükendi"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Link href={`/products/${product.id}`}>
        <div className="absolute inset-0 z-10" />
      </Link>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 transition-all duration-300 group-hover:shadow-lg">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">Görsel yok</span>
          </div>
        )}
        <div className="absolute top-2 right-2 z-20">
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            hasStock ? "hidden" : "bg-red-100 text-red-800"
          )}>
            {hasStock ? "" : "Tükendi"}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        {product.category && (
          <p className="mt-1 text-sm text-gray-500">{product.category}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            {formatPrice(product.stock[0]?.price || product.price)}
          </p>
          <button 
            onClick={handleAddToCart}
            className={cn(
              "text-sm px-3 py-1 rounded transition-colors z-20 relative",
              hasStock 
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
            disabled={!hasStock}
          >
            {hasStock ? (product.type === 'simple' ? "Sepete Ekle" : "Seçenekleri Gör") : "Tükendi"}
          </button>
        </div>
      </div>
    </div>
  );
} 
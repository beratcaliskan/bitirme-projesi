'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format';
import { Product } from '@/types/product';

interface StockVariant {
  price: number;
  stock: number;
  size_id?: string;
  color_id?: string;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const getTotalStock = (product: Product): number => {
    if (Array.isArray(product.stock)) {
      return product.stock.reduce((total, variant) => total + (variant.stock || 0), 0);
    }
    
    if (typeof product.stock === 'string') {
      try {
        const stockVariants: StockVariant[] = JSON.parse(product.stock);
        if (Array.isArray(stockVariants) && stockVariants.length > 0) {
          return stockVariants.reduce((total, variant) => total + (variant.stock || 0), 0);
        }
      } catch (error) {
        console.error('Error parsing stock JSON for product:', product.id, error);
        return 0;
      }
    }
    
    if (typeof product.stock === 'number') {
      return product.stock;
    }
    
    return 0;
  };

  const totalStock = getTotalStock(product);
  const hasStock = totalStock > 0;

  if (viewMode === 'list') {
    return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="flex gap-4 sm:gap-6 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
                <span className="text-gray-400 text-xs sm:text-sm">Görsel yok</span>
              </div>
            )}
            {!hasStock && (
            <div className="absolute top-2 right-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  Tükendi
              </span>
            </div>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3">
                {product.description}
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-medium text-gray-900">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`} className="block group">
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
            <span className="text-gray-400 text-sm">Görsel yok</span>
          </div>
        )}
        {!hasStock && (
        <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              Tükendi
          </span>
        </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
          {product.description}
        </p>
        <p className="mt-2 text-sm font-medium text-gray-900">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
} 
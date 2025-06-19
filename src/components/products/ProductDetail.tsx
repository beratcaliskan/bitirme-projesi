'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/ui/cart-provider';
import { useToast } from '@/components/ui/toast-provider';

interface ProductSize {
  id: string;
  name: string;
}

interface ProductColor {
  id: string;
  name: string;
  code: string;
}

interface ProductVariant {
  size_id?: string;
  color_id?: string;
  stock: number;
  price: number;
}

type ProductType = 'simple' | 'color' | 'size' | 'size+color';

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  brand: string;
  image_url: string;
  type: ProductType;
  sizes: ProductSize[];
  colors: ProductColor[];
  stock: ProductVariant[];
  rating?: number;
  review_count?: number;
}

interface Props {
  productId: string;
}

export default function ProductDetail({ productId }: Props) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState<string>('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{
    colors?: Array<{ id: string; name: string; code: string }>;
    sizes?: Array<{ id: string; name: string }>;
  }>({});

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      
      if (data.type === 'size' || data.type === 'size+color') {
        if (data.sizes?.[0]) {
          setSelectedSize(data.sizes[0].id);
        }
      }
      if (data.type === 'color' || data.type === 'size+color') {
        if (data.colors?.[0]) {
          setSelectedColor(data.colors[0].id);
        }
      }
      
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Hata',
        description: 'Ürün yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (!product) return;

    let variant: ProductVariant | null = null;
    const newSelectedVariants: {
      colors?: Array<{ id: string; name: string; code: string }>;
      sizes?: Array<{ id: string; name: string }>;
    } = {};

    switch (product.type) {
      case 'simple':
        variant = product.stock[0] || null;
        break;
      case 'color':
        if (selectedColor) {
          variant = product.stock.find(v => v.color_id === selectedColor) || null;
          const color = product.colors.find(c => c.id === selectedColor);
          if (color) {
            newSelectedVariants.colors = [{
              id: color.id,
              name: color.name,
              code: color.code
            }];
          }
        }
        break;
      case 'size':
        if (selectedSize) {
          variant = product.stock.find(v => v.size_id === selectedSize) || null;
          const size = product.sizes.find(s => s.id === selectedSize);
          if (size) {
            newSelectedVariants.sizes = [{
              id: size.id,
              name: size.name
            }];
          }
        }
        break;
      case 'size+color':
        if (selectedSize && selectedColor) {
          variant = product.stock.find(
            v => v.size_id === selectedSize && v.color_id === selectedColor
          ) || null;
          const size = product.sizes.find(s => s.id === selectedSize);
          const color = product.colors.find(c => c.id === selectedColor);
          
          if (size) {
            newSelectedVariants.sizes = [{
              id: size.id,
              name: size.name
            }];
          }
          if (color) {
            newSelectedVariants.colors = [{
              id: color.id,
              name: color.name,
              code: color.code
            }];
          }
        }
        break;
    }

    setCurrentVariant(variant);
    setSelectedVariants(newSelectedVariants);
    setError(variant ? '' : 'Lütfen tüm seçenekleri belirleyin');

    if (variant) {
      setQuantity(prev => Math.min(prev, variant.stock));
    }
  }, [selectedSize, selectedColor, product]);



  const getAvailableStock = () => {
    if (!currentVariant) return 0;
    return currentVariant.stock;
  };

  const getCurrentPrice = () => {
    if (currentVariant) return currentVariant.price;
    return product?.price || 0;
  };



  const handleAddToCart = async () => {
    if (!product || !currentVariant || isAddingToCart) return;

    try {
      setIsAddingToCart(true);

      const variantsArray = [];
      if (selectedVariants.sizes) {
        variantsArray.push(...selectedVariants.sizes);
      }
      if (selectedVariants.colors) {
        variantsArray.push(...selectedVariants.colors);
      }

      await addItem({
        product_id: product.id,
        name: product.name,
        price: currentVariant.price,
        quantity: quantity,
        image_url: product.image_url,
        variants: JSON.stringify(variantsArray)
      });

      toast({
        title: 'Başarılı',
        description: 'Ürün sepete eklendi.',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Hata',
        description: 'Ürün sepete eklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-gray-600 mb-4">Ürün bulunamadı</div>
        <Link href="/products" className="text-indigo-600 hover:underline">
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex mb-8 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">Ana Sayfa</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/products" className="text-gray-500 hover:text-gray-700">Ürünler</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/2">
              <div className="aspect-square relative">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#fafafa] flex items-center justify-center">
                    <div className="text-center">
                      <svg 
                        className="w-12 h-12 mx-auto mb-2 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="1.5" 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-gray-500 text-sm">Ürün fotoğrafı yok</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-1/2 p-6 lg:p-8">
              <div className="flex flex-col h-full">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>

                  {product.rating && (
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= product.rating! 
                                ? 'text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        ({product.review_count || 0} değerlendirme)
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(getCurrentPrice())}
                      </span>
                      {product.original_price && getCurrentPrice() < product.original_price && (
                        <span className="ml-3 text-lg text-gray-500 line-through">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    {error ? (
                      <span className="text-red-600 text-sm mt-1 block">
                        {error}
                      </span>
                    ) : getAvailableStock() > 0 ? (
                      <span className="text-green-600 text-sm mt-1 block">
                        Stokta ({getAvailableStock()} adet)
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm mt-1 block">
                        Tükendi
                      </span>
                    )}
                  </div>

                  {(product.type === 'size' || product.type === 'size+color') && product.sizes.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">Beden</h3>
                        {selectedSize && (
                          <span className="text-sm text-gray-500">
                            Seçilen: {product.sizes.find(s => s.id === selectedSize)?.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => {
                          const isAvailable = product.type === 'size'
                            ? product.stock.some(v => v.size_id === size.id && v.stock > 0)
                            : selectedColor
                              ? product.stock.some(v => v.size_id === size.id && v.color_id === selectedColor && v.stock > 0)
                              : true;
                          
                          return (
                            <button
                              key={size.id}
                              onClick={() => setSelectedSize(size.id)}
                              className={cn(
                                'relative flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1',
                                selectedSize === size.id
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                  : 'border-gray-200 text-gray-900',
                                !isAvailable && 'cursor-not-allowed bg-gray-50 text-gray-200'
                              )}
                              disabled={!isAvailable}
                            >
                              {size.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(product.type === 'color' || product.type === 'size+color') && product.colors.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">Renk</h3>
                        {selectedColor && (
                          <span className="text-sm text-gray-500">
                            Seçilen: {product.colors.find(c => c.id === selectedColor)?.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => {
                          const isAvailable = product.type === 'color'
                            ? product.stock.some(v => v.color_id === color.id && v.stock > 0)
                            : selectedSize
                              ? product.stock.some(v => v.color_id === color.id && v.size_id === selectedSize && v.stock > 0)
                              : true;

                          return (
                            <button
                              key={color.id}
                              onClick={() => setSelectedColor(color.id)}
                              className={cn(
                                'relative h-10 w-10 rounded-full border-2 hover:scale-110 transition-transform',
                                selectedColor === color.id && 'ring-2 ring-indigo-600 ring-offset-2'
                              )}
                              style={{ backgroundColor: color.code }}
                            >
                              {!isAvailable && (
                                <div className="absolute inset-0 rounded-full bg-gray-200/50 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Adet</h3>
                    <div className="flex items-center">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || !currentVariant}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        max={getAvailableStock()}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0 && val <= getAvailableStock()) {
                            setQuantity(val);
                          }
                        }}
                        className="w-20 h-10 mx-2 rounded-lg border text-gray-600 border-gray-300 text-center disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={!currentVariant}
                      />
                      <button
                        onClick={() => setQuantity(Math.min(getAvailableStock(), quantity + 1))}
                        disabled={quantity >= getAvailableStock() || !currentVariant}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleAddToCart}
                      className={cn(
                        "flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-all",
                        isAddingToCart 
                          ? "opacity-50 cursor-not-allowed bg-indigo-400" 
                          : "hover:bg-indigo-700",
                        (!currentVariant || currentVariant.stock === 0 || !!error) && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!currentVariant || currentVariant.stock === 0 || !!error || isAddingToCart}
                    >
                      {isAddingToCart 
                        ? 'Ekleniyor...' 
                        : error 
                          ? 'Seçenekleri Kontrol Edin' 
                          : 'Sepete Ekle'}
                    </button>
                    <button className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <div className="flex space-x-4 mb-6">
                    {(['description', 'specifications', 'reviews'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                          activeTab === tab
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab === 'description' && 'Açıklama'}
                        {tab === 'specifications' && 'Özellikler'}
                        {/* {tab === 'reviews' && 'Değerlendirmeler'} */}
                      </button>
                    ))}
                  </div>

                  <div className="text-gray-600">
                    {activeTab === 'description' && (
                      <div>{product.description}</div>
                    )}
                    {activeTab === 'specifications' && (
                      <div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Marka:</span> {product.brand}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Kategori:</span> {product.category}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'reviews' && (
                      <div>Henüz değerlendirme yapılmamış.</div>
                    )}
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
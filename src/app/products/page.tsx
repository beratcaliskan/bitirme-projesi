'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils/format';
import { ProductCard } from '@/components/products/ProductCard';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  brand: string;
  image_url: string;
  stock: number;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  // Örnek kategoriler ve markalar (gerçek verilerle değiştirilecek)
  const categories = [
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'home-kitchen', name: 'Home & Kitchen' },
    { id: 'beauty', name: 'Beauty' }
  ];

  const brands = [
    { id: 'brand1', name: 'Brand 1' },
    { id: 'brand2', name: 'Brand 2' },
    { id: 'brand3', name: 'Brand 3' }
  ];

  // Ürünleri çek
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme fonksiyonu
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesPrice = (priceRange.min === '' || product.price >= Number(priceRange.min)) &&
                        (priceRange.max === '' || product.price <= Number(priceRange.max));
    
    return matchesCategory && matchesBrand && matchesPrice;
  });

  // Sıralama fonksiyonu
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedBrands, priceRange, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange({ min: '', max: '' });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Üst Kontroller */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Ürünler</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {sortedProducts.length} ürün listeleniyor
                </p>
              </div>
              
              {/* Mobile View Controls */}
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border ${viewMode === 'grid' ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border ${viewMode === 'grid' ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-44 rounded-lg border-gray-200 bg-white py-2 pl-3 pr-10 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="featured">Öne Çıkanlar</option>
                <option value="newest">En Yeniler</option>
                <option value="price-low">Fiyat: Düşükten Yükseğe</option>
                <option value="price-high">Fiyat: Yüksekten Düşüğe</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm sticky top-24 z-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Filtreler</h2>
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Temizle
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Kategoriler</h3>
                <div className="space-y-2.5">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Fiyat Aralığı</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder="Min"
                    className="w-full rounded-md border-gray-300 bg-white py-1.5 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder="Max"
                    className="w-full rounded-md border-gray-300 bg-white py-1.5 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Brands */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Markalar</h3>
                <div className="space-y-2.5">
                  {brands.map((brand) => (
                    <label key={brand.id} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={() => toggleBrand(brand.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Ürünler yükleniyor...</div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="text-gray-600 mb-2">Ürün bulunamadı</div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
                {paginatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer z-10 hover:z-30"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#fafafa] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      
                      {/* Stok durumu */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full
                          ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {product.stock > 0 ? `${product.stock} adet` : 'Tükendi'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.name}
                        </h3>
                      </div>
                      <div className="mt-1 text-lg font-bold">
                        {formatPrice(product.price)}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-between backdrop-blur-sm rounded-lg overflow-hidden">
                      <div className="text-white">
                        <h3 className="text-lg font-semibold mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-200 line-clamp-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                          {product.description}
                        </p>
                        
                        <div className="mt-4 space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                          <div className="flex items-center text-sm">
                            <span className="text-gray-300">Kategori:</span>
                            <span className="ml-2 text-white">{product.category}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-300">Marka:</span>
                            <span className="ml-2 text-white">{product.brand}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-150">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-300 mb-1">Fiyat</div>
                            <span className="text-xl font-bold text-white">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <span className={`px-3 py-1.5 text-xs font-medium rounded-full
                            ${product.stock > 0 ? 'bg-white/90 text-gray-900' : 'bg-red-100 text-red-800'}`}
                          >
                            {product.stock > 0 ? `${product.stock} adet` : 'Tükendi'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination - only show if there are products */}
        {!loading && sortedProducts.length > 0 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(page - 1)}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setPage(pageNumber)}
                        isActive={page === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setPage(totalPages)}
                        isActive={page === totalPages}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(page + 1)}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
} 
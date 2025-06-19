'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils/format';

import Link from 'next/link';
import Image from 'next/image';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  brand: string;
  image_url: string;
  stock: StockVariant[];
  created_at: string;
}

interface StockVariant {
  price: number;
  stock: number;
  size_id?: string;
  color_id?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;
  const [showFilters, setShowFilters] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceSliderRange, setPriceSliderRange] = useState([0, 1000]);
  

  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>([]);
  const [tempPriceSliderRange, setTempPriceSliderRange] = useState([0, 1000]);


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
      
      const products = data || [];
      setProducts(products);
      

      const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }));
      const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }));
      
      setAvailableCategories(categories);
      setAvailableBrands(brands);
      

      const prices = products.map(p => p.price).filter(Boolean);
      if (prices.length > 0) {
        const minPriceValue = Math.floor(Math.min(...prices));
        const maxPriceValue = Math.ceil(Math.max(...prices));
        setMinPrice(minPriceValue);
        setMaxPrice(maxPriceValue);
        setPriceSliderRange([minPriceValue, maxPriceValue]);
        setTempPriceSliderRange([minPriceValue, maxPriceValue]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesPrice = product.price >= priceSliderRange[0] && product.price <= priceSliderRange[1];
    
    return matchesCategory && matchesBrand && matchesPrice;
  });

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

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedBrands, priceSliderRange, sortBy]);


  useEffect(() => {
    setTempSelectedCategories(selectedCategories);
    setTempSelectedBrands(selectedBrands);
    setTempPriceSliderRange(priceSliderRange);
  }, [selectedCategories, selectedBrands, priceSliderRange]);

  const applyFilters = () => {
    setSelectedCategories(tempSelectedCategories);
    setSelectedBrands(tempSelectedBrands);
    setPriceSliderRange(tempPriceSliderRange);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceSliderRange([minPrice, maxPrice]);
    setTempSelectedCategories([]);
    setTempSelectedBrands([]);
    setTempPriceSliderRange([minPrice, maxPrice]);
  };



  const toggleTempCategory = (categoryId: string) => {
    setTempSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTempBrand = (brandId: string) => {
    setTempSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Ürünler</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {sortedProducts.length} ürün listeleniyor
                </p>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Filtreler
                {(selectedCategories.length > 0 || selectedBrands.length > 0 || priceSliderRange[0] !== minPrice || priceSliderRange[1] !== maxPrice) && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedCategories.length + selectedBrands.length + (priceSliderRange[0] !== minPrice || priceSliderRange[1] !== maxPrice ? 1 : 0)}
                  </span>
                )}
              </button>
              
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

        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity" 
                aria-hidden="true"
                onClick={() => setShowFilters(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
                <div className="bg-white p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Filtreler</h2>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Kategoriler</h3>
                    <div className="filter-list-mobile modern-scroll space-y-2.5">
                      {availableCategories.map((category) => (
                        <label key={category} className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={tempSelectedCategories.includes(category)}
                            onChange={() => toggleTempCategory(category)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Fiyat Aralığı</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{formatPrice(tempPriceSliderRange[0])}</span>
                        <span>{formatPrice(tempPriceSliderRange[1])}</span>
                      </div>
                      <div className="range-slider">

                        <div className="absolute w-full h-2 bg-gray-200 rounded-lg top-1/2 transform -translate-y-1/2"></div>
                        

                        <div 
                          className="absolute h-2 bg-indigo-600 rounded-lg top-1/2 transform -translate-y-1/2"
                          style={{
                            left: `${((tempPriceSliderRange[0] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                            width: `${((tempPriceSliderRange[1] - tempPriceSliderRange[0]) / (maxPrice - minPrice)) * 100}%`
                          }}
                        ></div>
                        

                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={tempPriceSliderRange[0]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value <= tempPriceSliderRange[1]) {
                              setTempPriceSliderRange([value, tempPriceSliderRange[1]]);
                            }
                          }}
                        />
                        

                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={tempPriceSliderRange[1]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= tempPriceSliderRange[0]) {
                              setTempPriceSliderRange([tempPriceSliderRange[0], value]);
                            }
                          }}
                        />
                      </div>
                      

                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={tempPriceSliderRange[0]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= minPrice && value <= tempPriceSliderRange[1]) {
                              setTempPriceSliderRange([value, tempPriceSliderRange[1]]);
                            }
                          }}
                          className="w-full rounded-md border-gray-300 bg-white py-1.5 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="Min"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          value={tempPriceSliderRange[1]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value <= maxPrice && value >= tempPriceSliderRange[0]) {
                              setTempPriceSliderRange([tempPriceSliderRange[0], value]);
                            }
                          }}
                          className="w-full rounded-md border-gray-300 bg-white py-1.5 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="Max"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-500">Min: {formatPrice(minPrice)}</span>
                        <span className="text-gray-500">Max: {formatPrice(maxPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Markalar</h3>
                    <div className="filter-list-mobile modern-scroll space-y-2.5">
                      {availableBrands.map((brand) => (
                        <label key={brand} className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={tempSelectedBrands.includes(brand)}
                            onChange={() => toggleTempBrand(brand)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>


                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={applyFilters}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Uygula
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm sticky top-20 z-20">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">Filtreler</h2>
              </div>

                                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Kategoriler</h3>
                    <div className="filter-list modern-scroll space-y-2.5">
                      {availableCategories.map((category) => (
                        <label key={category} className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={tempSelectedCategories.includes(category)}
                            onChange={() => toggleTempCategory(category)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Fiyat Aralığı</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{formatPrice(tempPriceSliderRange[0])}</span>
                    <span>{formatPrice(tempPriceSliderRange[1])}</span>
                  </div>
                  <div className="range-slider">

                    <div className="absolute w-full h-2 bg-gray-200 rounded-lg top-1/2 transform -translate-y-1/2"></div>
                    

                    <div 
                      className="absolute h-2 bg-indigo-600 rounded-lg top-1/2 transform -translate-y-1/2"
                      style={{
                        left: `${((tempPriceSliderRange[0] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                        width: `${((tempPriceSliderRange[1] - tempPriceSliderRange[0]) / (maxPrice - minPrice)) * 100}%`
                      }}
                    ></div>
                    

                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={tempPriceSliderRange[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value <= tempPriceSliderRange[1]) {
                          setTempPriceSliderRange([value, tempPriceSliderRange[1]]);
                        }
                      }}
                    />
                    

                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={tempPriceSliderRange[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= tempPriceSliderRange[0]) {
                          setTempPriceSliderRange([tempPriceSliderRange[0], value]);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempPriceSliderRange[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= minPrice && value <= tempPriceSliderRange[1]) {
                          setTempPriceSliderRange([value, tempPriceSliderRange[1]]);
                        }
                      }}
                      className="w-full rounded-md border-gray-300 bg-white py-1.5 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Min"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      value={tempPriceSliderRange[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value <= maxPrice && value >= tempPriceSliderRange[0]) {
                          setTempPriceSliderRange([tempPriceSliderRange[0], value]);
                        }
                      }}
                      className="w-full rounded-md border-gray-300 bg-white py-1.5 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Max"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Min: {formatPrice(minPrice)}</span>
                    <span className="text-gray-500">Max: {formatPrice(maxPrice)}</span>
                  </div>
                </div>
              </div>

                                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Markalar</h3>
                    <div className="filter-list modern-scroll space-y-2.5">
                      {availableBrands.map((brand) => (
                        <label key={brand} className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={tempSelectedBrands.includes(brand)}
                            onChange={() => toggleTempBrand(brand)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>


                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={applyFilters}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Uygula
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Temizle
                    </button>
                  </div>
            </div>
          </div>

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
              <div className={`grid gap-4 sm:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {paginatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer z-10 hover:z-30"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={400}
                          height={400}
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
                      
                      {getTotalStock(product) === 0 && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Tükendi
                          </span>
                        </div>
                      )}
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
                          {getTotalStock(product) === 0 && (
                            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Tükendi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

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
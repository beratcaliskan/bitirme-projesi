'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import ImageUpload from '@/components/ui/image-upload';
import Image from 'next/image';

interface ProductSize {
  id: string;
  name: string;
}

interface ProductColor {
  id: string;
  name: string;
  code: string;
}

interface ProductStock {
  size_id?: string;
  color_id?: string;
  stock: number;
  price: number;
}

type ProductType = 'simple' | 'color' | 'size' | 'size+color';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  image_url: string;
  type: ProductType;
  sizes: ProductSize[];
  colors: ProductColor[];
  stock: ProductStock[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    image_url: '',
    type: 'simple' as ProductType,
    sizes: [] as ProductSize[],
    colors: [] as ProductColor[],
    stock: [] as ProductStock[]
  });

  const [tempSize, setTempSize] = useState({ id: '', name: '' });
  const [tempColor, setTempColor] = useState({ id: '', name: '', code: '' });
  const [tempStock, setTempStock] = useState({
    size_id: '',
    color_id: '',
    stock: '',
    price: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      

      const safeProducts = Array.isArray(data) ? data.map((product) => {

        let validImageUrl = '';
        if (product.image_url && typeof product.image_url === 'string') {
          const trimmedUrl = product.image_url.trim();

          if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
            try {

              const url = new URL(trimmedUrl);

              if (url.hostname && url.hostname.includes('.')) {
                validImageUrl = trimmedUrl;
              } else {
                validImageUrl = '';
              }
            } catch {
              validImageUrl = '';
            }
          } else {
            validImageUrl = '';
          }
        }
        
        return {
          ...product,
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          colors: Array.isArray(product.colors) ? product.colors : [],
          stock: Array.isArray(product.stock) ? product.stock : [],
          image_url: validImageUrl,
          name: product.name || 'İsimsiz Ürün',
          brand: product.brand || '',
          price: product.price || 0
        };
      }) : [];
      
      setProducts(safeProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleAddSize = () => {
    if (tempSize.id && tempSize.name) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, tempSize]
      }));
      setTempSize({ id: '', name: '' });
    }
  };

  const handleAddColor = () => {
    if (tempColor.id && tempColor.name && tempColor.code) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, tempColor]
      }));
      setTempColor({ id: '', name: '', code: '' });
    }
  };

  const handleAddStock = () => {
    const stock = Number(tempStock.stock);
    const price = formData.type === 'simple' ? Number(formData.price) : Number(tempStock.price);

    console.log('Adding stock with:', {
      type: formData.type,
      tempStock,
      formData
    });


    if (stock <= 0) {
      alert('Lütfen geçerli stok miktarı girin');
      return;
    }

    if (formData.type !== 'simple' && (!price || price <= 0)) {
      alert('Lütfen geçerli fiyat girin');
      return;
    }

    const newStock: ProductStock = {
      stock,
      price
    };
    if (formData.type === 'size' || formData.type === 'size+color') {
      if (!tempStock.size_id || tempStock.size_id === '') {
        console.log('Size validation failed:', tempStock.size_id);
        alert('Lütfen beden seçin');
        return;
      }
      newStock.size_id = tempStock.size_id;
    }

    if (formData.type === 'color' || formData.type === 'size+color') {
      if (!tempStock.color_id || tempStock.color_id === '') {
        console.log('Color validation failed:', tempStock.color_id);
        alert('Lütfen renk seçin');
        return;
      }
      newStock.color_id = tempStock.color_id;
    }

    const isDuplicate = formData.stock.some(item => {
      if (formData.type === 'simple') return formData.stock.length > 0;
      if (formData.type === 'size') return item.size_id === tempStock.size_id;
      if (formData.type === 'color') return item.color_id === tempStock.color_id;
      return item.size_id === tempStock.size_id && item.color_id === tempStock.color_id;
    });

    if (isDuplicate) {
      alert('Bu varyasyon için zaten stok girişi yapılmış');
      return;
    }

    console.log('Adding new stock:', newStock);

    setFormData(prev => ({
      ...prev,
      stock: [...prev.stock, newStock]
    }));

    setTempStock({
      size_id: '',
      color_id: '',
      stock: '',
      price: formData.type === 'simple' ? formData.price : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let data, error;

      if (selectedProduct) {
        const { data: updateData, error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            category: formData.category,
            brand: formData.brand,
            image_url: formData.image_url,
            type: formData.type,
            sizes: formData.sizes,
            colors: formData.colors,
            stock: formData.stock
          })
          .eq('id', selectedProduct.id)
          .select()
          .single();

        data = updateData;
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            category: formData.category,
            brand: formData.brand,
            image_url: formData.image_url,
            type: formData.type,
            sizes: formData.sizes,
            colors: formData.colors,
            stock: formData.stock
          }])
          .select()
          .single();

        data = insertData;
        error = insertError;
      }

      if (error) throw error;

      if (selectedProduct) {
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? data : p));
      } else {
        setProducts(prev => [data, ...prev]);
      }

      setIsModalOpen(false);
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        brand: '',
        image_url: '',
        type: 'simple',
        sizes: [],
        colors: [],
        stock: []
      });
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      brand: product.brand,
      image_url: product.image_url,
      type: product.type,
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock || []
    });
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ürünler</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white hover:bg-indigo-500"
        >
          Yeni Ürün Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(products) && products.map((product) => (
          <div
            key={product?.id || Math.random()}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="aspect-square relative">
              {product.image_url && product.image_url.trim() !== '' ? (
                <div className="w-full h-full relative">
                  <Image
                    src={product.image_url}
                    alt={product.name || 'Ürün'}
                    fill
                    className="object-cover"
                    onError={() => {

                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Görsel yok</span>
                </div>
              )}
              <div className="absolute top-2 right-2 z-10">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {Array.isArray(product.stock) 
                    ? product.stock.reduce((total, item) => total + (item?.stock || 0), 0) 
                    : 0
                  } adet
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-1">{product?.name || 'İsimsiz Ürün'}</h3>
              <p className="text-sm text-gray-500 mb-2">{product?.brand || 'Marka belirtilmemiş'}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product?.price || 0)}
                </span>
                <button
                  onClick={() => handleEdit(product)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        size="3xl"
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
          setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            brand: '',
            image_url: '',
            type: 'simple',
            sizes: [],
            colors: [],
            stock: []
          });
        }}
        title={selectedProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
      >
        <div className="relative">
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-4 -mr-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  label="Ürün Adı"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Açıklama"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
                <Input
                  label="Fiyat"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
                <Input
                  label="Kategori"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                />
                <Input
                  label="Marka"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                />
                <ImageUpload
                  label="Ürün Görseli"
                  value={formData.image_url}
                  onChange={(value) => setFormData(prev => ({ ...prev, image_url: value }))}
                  bucket="product-images"
                  folder="products"
                />
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ProductType }))}
                  options={[
                    { value: 'simple', label: 'Basit' },
                    { value: 'color', label: 'Renk Seçenekli' },
                    { value: 'size', label: 'Beden Seçenekli' },
                    { value: 'size+color', label: 'Beden ve Renk Seçenekli' }
                  ]}
                  className="w-full"
                />
              </div>

              {(formData.type === 'size' || formData.type === 'size+color') && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900">Beden Seçenekleri</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Beden ID (örn: s, m, l)"
                      value={tempSize.id}
                      onChange={(e) => setTempSize(prev => ({ ...prev, id: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Beden Adı (örn: Small, Medium)"
                      value={tempSize.name}
                      onChange={(e) => setTempSize(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSize}
                      className="bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      Ekle
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.sizes.map((size) => (
                      <div key={size.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {size.name}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            sizes: prev.sizes.filter(s => s.id !== size.id)
                          }))}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(formData.type === 'color' || formData.type === 'size+color') && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900">Renk Seçenekleri</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Renk ID (örn: black, white)"
                      value={tempColor.id}
                      onChange={(e) => setTempColor(prev => ({ ...prev, id: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Renk Adı (örn: Siyah, Beyaz)"
                      value={tempColor.name}
                      onChange={(e) => setTempColor(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1"
                    />
                    <div className="flex-1 flex gap-2">
                      <Input
                        type="color"
                        value={tempColor.code}
                        onChange={(e) => setTempColor(prev => ({ ...prev, code: e.target.value }))}
                        className="w-14 p-1 h-10"
                      />
                      <Input
                        placeholder="Renk Kodu"
                        value={tempColor.code}
                        onChange={(e) => setTempColor(prev => ({ ...prev, code: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddColor}
                      className="bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      Ekle
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color) => (
                      <div key={color.id} className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                        <div
                          className="w-5 h-5 rounded-full mr-2 border border-gray-200"
                          style={{ backgroundColor: color.code }}
                        />
                        <span className="mr-2">{color.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            colors: prev.colors.filter(c => c.id !== color.id)
                          }))}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-900">Stok Bilgileri</h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {(formData.type === 'size' || formData.type === 'size+color') && (
                    <Select
                      label="Beden"
                      value={tempStock.size_id}
                      onChange={(e) => setTempStock(prev => ({ ...prev, size_id: e.target.value }))}
                      options={Array.isArray(formData.sizes) ? formData.sizes.map(size => ({
                        value: size?.id || '',
                        label: size?.name || 'Bilinmeyen Beden'
                      })) : []}
                    />
                  )}
                  {(formData.type === 'color' || formData.type === 'size+color') && (
                    <Select
                      label="Renk"
                      value={tempStock.color_id}
                      onChange={(e) => setTempStock(prev => ({ ...prev, color_id: e.target.value }))}
                      options={Array.isArray(formData.colors) ? formData.colors.map(color => ({
                        value: color?.id || '',
                        label: color?.name || 'Bilinmeyen Renk'
                      })) : []}
                    />
                  )}
                  <Input
                    type="number"
                    label="Stok Miktarı"
                    value={tempStock.stock}
                    onChange={(e) => setTempStock(prev => ({ ...prev, stock: e.target.value }))}
                  />
                  {formData.type !== 'simple' && (
                    <Input
                      type="number"
                      label="Fiyat"
                      value={tempStock.price}
                      onChange={(e) => setTempStock(prev => ({ ...prev, price: e.target.value }))}
                    />
                  )}
                  <div className="lg:col-span-4 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddStock}
                      className="bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      Ekle
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(formData.stock) && formData.stock.map((item, index) => (
                    <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {item?.size_id && `${formData.sizes.find(s => s?.id === item.size_id)?.name || 'Bilinmeyen Beden'} - `}
                      {item?.color_id && `${formData.colors.find(c => c?.id === item.color_id)?.name || 'Bilinmeyen Renk'} - `}
                      {item?.stock || 0} adet - {formatPrice(item?.price || 0)}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          stock: prev.stock.filter((_, i) => i !== index)
                        }))}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
} 
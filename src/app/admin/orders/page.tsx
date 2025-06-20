'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminOrderDetailModal } from '@/components/admin/AdminOrderDetailModal';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, Eye, Package, Truck, CheckCircle, XCircle, Clock, Printer, Trash2, MessageCircle } from 'lucide-react';
import Image from 'next/image';



interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  name: string;
  image_url: string;
  variants: Record<string, string>;
  created_at: string;
  updated_at: string;
  product: {
    name: string;
    image_url: string;
  };
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', order.user_id)
            .single();

          const { data: addressData } = await supabase
            .from('addresses')
            .select('name, phone, city, district, neighborhood, full_address')
            .eq('id', order.address_id)
            .single();

          const { data: itemsData } = await supabase
            .from('order_items')
            .select('id, order_id, product_id, quantity, price, name, image_url, variants, created_at, updated_at')
            .eq('order_id', order.id);

          return {
            ...order,
            user: userData || { name: 'Bilinmeyen', email: 'Bilinmeyen' },
            address: addressData || { name: 'Bilinmeyen', phone: '', city: '', district: '', neighborhood: '', full_address: '' },
            items: (itemsData || []).map(item => ({
              ...item,
              variants: typeof item.variants === 'string' 
                ? JSON.parse(item.variants || '{}')
                : item.variants || {},
              product: {
                name: item.name || 'Bilinmeyen Ürün',
                image_url: item.image_url || '/placeholder.png'
              }
            }))
          };
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, newStatus: Order['status']) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusClasses = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-indigo-100 text-indigo-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  const getStatusStyle = (status: Order['status']) => {
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: Order['status']) => {
    const statusTexts = {
      PENDING: 'Beklemede',
      PROCESSING: 'İşleniyor',
      SHIPPED: 'Kargoda',
      DELIVERED: 'Teslim Edildi',
      CANCELLED: 'İptal Edildi'
    };
    return statusTexts[status];
  };

  const getStatusIcon = (status: Order['status']) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      PROCESSING: <Package className="w-4 h-4" />,
      SHIPPED: <Truck className="w-4 h-4" />,
      DELIVERED: <CheckCircle className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />
    };
    return icons[status];
  };

  const statusOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'PENDING', label: 'Beklemede' },
    { value: 'PROCESSING', label: 'İşleniyor' },
    { value: 'SHIPPED', label: 'Kargoda' },
    { value: 'DELIVERED', label: 'Teslim Edildi' },
    { value: 'CANCELLED', label: 'İptal Edildi' }
  ];

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const openOrderChat = (orderId: string) => {
    window.open(`/admin/support/order/${orderId}`, '_blank');
  };

  async function handleDeleteOrder(orderId: string) {
    if (!window.confirm('Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      setOrders(orders.filter(order => order.id !== orderId));
      setIsDetailModalOpen(false);
      
      alert('Sipariş başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Sipariş silinirken bir hata oluştu.');
    }
  }

  async function handlePrintOrder(order: Order) {
    const printContent = `
      <html>
        <head>
          <title>Sipariş #${order.id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-weight: bold; font-size: 18px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sipariş Detayı</h1>
            <h2>#${order.id.slice(-6)}</h2>
            <p>${new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
          </div>
          
          <div class="section">
            <h3>Müşteri Bilgileri</h3>
                          <p><strong>Ad Soyad:</strong> ${order.user.name}</p>
              <p><strong>E-posta:</strong> ${order.user.email}</p>
              <p><strong>Telefon:</strong> ${order.address.phone}</p>
              <p><strong>Teslimat Adresi:</strong> ${order.address.neighborhood} Mah. ${order.address.district}/${order.address.city} - ${order.address.full_address}</p>
          </div>
          
          <div class="section">
            <h3>Sipariş Ürünleri</h3>
            ${order.items.map(item => `
              <div class="item">
                <p><strong>${item.name}</strong></p>
                <p>Adet: ${item.quantity} - Birim Fiyat: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.price)}</p>
                <p>Toplam: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.price * item.quantity)}</p>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            <p>Genel Toplam: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Siparişler</h1>
        <p className="mt-1 text-sm text-gray-600">Tüm siparişleri görüntüleyin ve yönetin</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-lg">
          <Input
            type="text"
            placeholder="Sipariş no, müşteri adı veya e-posta ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full placeholder:text-gray-400 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Button
            onClick={fetchOrders}
            variant="outline"
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Yenile</span>
            <span className="sm:hidden">Yenile</span>
          </Button>
          
          <div className="w-full sm:w-48">
            <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger className="inline-flex items-center justify-between w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <Select.Value>
                  {statusOptions.find(option => option.value === statusFilter)?.label}
                </Select.Value>
                <Select.Icon>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {statusOptions.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-gray-50 focus:outline-none"
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                          <Check className="h-4 w-4" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz sipariş bulunmuyor'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Farklı bir arama terimi deneyin.' : 'Siparişler burada görüntülenecektir.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sipariş No
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Müşteri
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Ürünler
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Tarih
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                      #{order.id.slice(-6)}
                      </div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {order.user?.name || 'Bilinmeyen'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {order.user?.name || 'Bilinmeyen'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email || 'Bilinmeyen'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <div className="flex flex-col space-y-1">
                        {order.items.slice(0, 2).map((item) => {
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
                          <div key={item.id} className="flex items-center space-x-2">
                            <Image
                                src={item.image_url || '/placeholder.png'}
                                alt={item.name}
                                width={32}
                                height={32}
                              className="h-6 w-6 sm:h-8 sm:w-8 rounded object-cover"
                            />
                              <div className="flex flex-col">
                            <span className="text-xs sm:text-sm text-gray-900">
                                  {item.name} ({item.quantity} adet)
                                </span>
                                {(colorVariant || sizeVariant) && (
                                  <span className="text-xs text-gray-500">
                                    {colorVariant && (
                                      <>
                                        <span className="font-medium">{colorVariant.name}</span>
                                        {colorVariant.code && (
                                          <span 
                                            className="inline-block w-2 h-2 rounded-full border ml-1"
                                            style={{ backgroundColor: colorVariant.code }}
                                          />
                                        )}
                                      </>
                                    )}
                                    {colorVariant && sizeVariant && <span> - </span>}
                                    {sizeVariant && (
                                      <span className="font-medium">{sizeVariant.name}</span>
                                    )}
                            </span>
                                )}
                              </div>
                          </div>
                          );
                        })}
                        {order.items.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{order.items.length - 2} ürün daha
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-indigo-600">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">
                        {order.items.length} ürün
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <Select.Root
                        value={order.status}
                        onValueChange={(value) => handleStatusUpdate(order.id, value as Order['status'])}
                      >
                        <Select.Trigger
                          className={`inline-flex items-center justify-between rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${getStatusStyle(order.status)}`}
                        >
                          <div className="flex items-center gap-1 sm:gap-2">
                            {getStatusIcon(order.status)}
                            <Select.Value className="hidden sm:inline">{getStatusText(order.status)}</Select.Value>
                          </div>
                          <Select.Icon>
                            <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </Select.Icon>
                        </Select.Trigger>

                        <Select.Portal>
                          <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <Select.ScrollUpButton />
                            <Select.Viewport>
                              <Select.Item
                                value="PENDING"
                                className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-yellow-50 focus:outline-none"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <Select.ItemText>Beklemede</Select.ItemText>
                                </div>
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                  <Check className="h-4 w-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item
                                value="PROCESSING"
                                className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-blue-50 focus:outline-none"
                              >
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  <Select.ItemText>İşleniyor</Select.ItemText>
                                </div>
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                  <Check className="h-4 w-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item
                                value="SHIPPED"
                                className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-green-50 focus:outline-none"
                              >
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  <Select.ItemText>Kargoda</Select.ItemText>
                                </div>
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                  <Check className="h-4 w-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item
                                value="DELIVERED"
                                className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-indigo-50 focus:outline-none"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  <Select.ItemText>Teslim Edildi</Select.ItemText>
                                </div>
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                  <Check className="h-4 w-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item
                                value="CANCELLED"
                                className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-red-50 focus:outline-none"
                              >
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-4 h-4" />
                                  <Select.ItemText>İptal Edildi</Select.ItemText>
                                </div>
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                  <Check className="h-4 w-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            </Select.Viewport>
                            <Select.ScrollDownButton />
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                      <div className="text-xs text-gray-500 mt-1 lg:hidden">
                        {new Date(order.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                      {new Date(order.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-2">
                            <Button
                          onClick={() => openOrderDetail(order)}
                          variant="outline"
                              size="sm"
                          className="flex items-center gap-1 text-xs sm:text-sm"
                            >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Detay</span>
                            </Button>
                            <Button
                          onClick={() => openOrderChat(order.id)}
                          variant="outline"
                              size="sm"
                          className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:border-blue-300"
                            >
                          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Chat</span>
                            </Button>
                            <Button
                          onClick={() => handlePrintOrder(order)}
                          variant="outline"
                              size="sm"
                          className="flex items-center gap-1 text-xs sm:text-sm"
                            >
                          <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Yazdır</span>
                            </Button>
                            <Button
                          onClick={() => handleDeleteOrder(order.id)}
                          variant="outline"
                              size="sm"
                          className="flex items-center gap-1 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Sil</span>
                          </Button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminOrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        order={selectedOrder}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
} 
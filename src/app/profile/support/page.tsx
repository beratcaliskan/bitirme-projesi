'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-provider';
import * as Select from '@radix-ui/react-select';
import { 
  MessageCircle, 
  Package, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Check,
  ChevronDown
} from 'lucide-react';

interface SupportChat {
  id: string;
  order_id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
  last_message_at: string | null;
  unread_count: number;
  order?: {
    id: string;
    total_amount: number;
    status: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [creating, setCreating] = useState(false);

  const fetchUserChats = async () => {
    if (!user?.id) {
      console.log('No user ID found');
      return;
    }

    try {
      console.log('Fetching chats for user:', user.id);
      
      // Debug: Check if user exists in users table
      const { data: userCheck, error: userCheckError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', user.id)
        .single();
      
      console.log('User exists check:', { userCheck, userCheckError });
      
      // First fetch chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('support_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Chats query result:', { chatsData, error: chatsError });

      if (chatsError) {
        console.error('Chats fetch error details:', chatsError);
        throw chatsError;
      }

      if (!chatsData || chatsData.length === 0) {
        console.log('No chats found for user');
        setChats([]);
        return;
      }

      console.log('Found chats:', chatsData.length);

      // Then fetch order details for each chat
      const chatsWithDetails = await Promise.all(
        chatsData.map(async (chat) => {
          console.log('Processing chat:', chat.id, 'order_id:', chat.order_id);
          
          // Fetch order details
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('id, total_amount, status')
            .eq('id', chat.order_id)
            .single();
          
          if (orderError) {
            console.error('Order fetch error for order_id:', chat.order_id, orderError);
          }

          // Fetch unread message count
          const { count, error: messagesError } = await supabase
            .from('support_messages')
            .select('id', { count: 'exact' })
            .eq('chat_id', chat.id)
            .eq('sender_type', 'ADMIN')
            .eq('is_read', false);
          
          if (messagesError) {
            console.error('Messages count error for chat_id:', chat.id, messagesError);
          }

          return {
            ...chat,
            order: orderData || { id: '', total_amount: 0, status: 'UNKNOWN' },
            unread_count: count || 0
          };
        })
      );

      console.log('Final chats data with details:', chatsWithDetails);
      setChats(chatsWithDetails);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: 'Hata',
        description: 'Destek talepleri yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const fetchUserOrders = async () => {
    if (!user?.id) return;

    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Orders data:', ordersData);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const createSupportChat = async () => {
    if (!selectedOrderId || !subject.trim() || !user?.id) return;

    setCreating(true);
    try {
      const { data: newChat, error } = await supabase
        .from('support_chats')
        .insert({
          order_id: selectedOrderId,
          user_id: user.id,
          status: 'OPEN',
          priority: priority,
          subject: subject.trim()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Destek talebi oluşturuldu.'
      });

      // Reset form
      setSelectedOrderId('');
      setSubject('');
      setPriority('MEDIUM');
      setShowCreateForm(false);

      // Refresh chats
      await fetchUserChats();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Hata',
        description: 'Destek talebi oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const loginAsTestUser = async () => {
    try {
      // Test user credentials - gerçek projede bu olmamalı!
      console.log('Attempting to login as test user...');
      
      // Supabase'den test user'ı doğrudan al
      const { data: testUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', '4ab3163f-5509-42c2-9aeb-dce5cdb5f0b6')
        .single();
      
      if (error) {
        console.error('Test user not found:', error);
        toast({
          title: 'Hata',
          description: 'Test kullanıcısı bulunamadı. Önce test verilerini ekleyin.',
          variant: 'destructive'
        });
        return;
      }
      
      console.log('Test user found:', testUser);
      
      toast({
        title: 'Başarılı',
        description: 'Test kullanıcısı olarak giriş yapıldı (dev mode)'
      });
      
      // Refresh page to reload auth
      window.location.reload();
      
    } catch (error) {
      console.error('Login as test user error:', error);
      toast({
        title: 'Hata',
        description: 'Test kullanıcısı girişi başarısız.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUserChats(), fetchUserOrders()]);
      setLoading(false);
    };

    loadData();
  }, [user?.id]);

  const getStatusStyle = (status: string) => {
    const styles = {
      OPEN: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-green-100 text-green-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertTriangle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPriorityStyle = (priority: string) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-600',
      MEDIUM: 'bg-blue-100 text-blue-600',
      HIGH: 'bg-orange-100 text-orange-600',
      URGENT: 'bg-red-100 text-red-600'
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-600';
  };

  const getStatusText = (status: string) => {
    const texts = {
      OPEN: 'Açık',
      IN_PROGRESS: 'Devam Ediyor',
      CLOSED: 'Kapalı'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getPriorityText = (priority: string) => {
    const texts = {
      LOW: 'Düşük',
      MEDIUM: 'Orta',
      HIGH: 'Yüksek',
      URGENT: 'Acil'
    };
    return texts[priority as keyof typeof texts] || priority;
  };

  const openChatWindow = (chatId: string) => {
    console.log('Opening chat window for chatId:', chatId);
    
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      `/profile/support/${chatId}`,
      'support-chat',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const priorityOptions = [
    { value: 'LOW', label: 'Düşük' },
    { value: 'MEDIUM', label: 'Orta' },
    { value: 'HIGH', label: 'Yüksek' },
    { value: 'URGENT', label: 'Acil' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Destek talepleri yükleniyor...</div>
      </div>
    );
  }

  // Eğer chat yoksa ve form gösterilmiyorsa, oluşturma ekranını göster
  if (chats.length === 0 && !showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Destek Taleplerim</h1>
            <p className="mt-1 text-sm text-gray-600">
              Siparişleriniz hakkında destek taleplerinizi görüntüleyin ve yönetin
            </p>
          </div>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz destek talebiniz yok</h3>
          <p className="mt-1 text-sm text-gray-500 mb-4">
            Siparişlerinizle ilgili sorunlarınız için destek talebi oluşturabilirsiniz.
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Destek Talebi Oluştur
          </Button>
        </div>
      </div>
    );
  }

  // Oluşturma formu
  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Destek Talebi</h1>
            <p className="mt-1 text-sm text-gray-600">
              Siparişinizle ilgili bir sorun için destek talebi oluşturun
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(false)}
            variant="outline"
          >
            Geri Dön
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sipariş Seçin
              </label>
              <Select.Root value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <Select.Trigger className="inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
                  <Select.Value placeholder="Bir sipariş seçin..." />
                  <Select.Icon>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <Select.Viewport>
                      {orders.map((order) => (
                        <Select.Item
                          key={order.id}
                          value={order.id}
                          className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-gray-100"
                        >
                          <Select.ItemText>
                            Sipariş #{order.id.slice(-8)} - {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}
                          </Select.ItemText>
                          <Select.ItemIndicator className="absolute left-2">
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konu
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Destek talebinizin konusunu girin..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Öncelik
              </label>
              <Select.Root value={priority} onValueChange={(value) => setPriority(value as any)}>
                <Select.Trigger className="inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <Select.Viewport>
                      {priorityOptions.map((option) => (
                        <Select.Item
                          key={option.value}
                          value={option.value}
                          className="relative flex items-center px-8 py-2 text-sm cursor-default select-none hover:bg-gray-100"
                        >
                          <Select.ItemText>{option.label}</Select.ItemText>
                          <Select.ItemIndicator className="absolute left-2">
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={createSupportChat}
                disabled={!selectedOrderId || !subject.trim() || creating}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {creating ? 'Oluşturuluyor...' : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mevcut chat'ler listesi
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destek Taleplerim</h1>
          <p className="mt-1 text-sm text-gray-600">
            Siparişleriniz hakkında destek taleplerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={loginAsTestUser}
            variant="outline"
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            🧪 Test User Girişi
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Talep
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openChatWindow(chat.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(chat.status)}
                    <h3 className="text-lg font-medium text-gray-900">{chat.subject}</h3>
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {chat.unread_count} yeni mesaj
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>Sipariş #{chat.order?.id?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(chat.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {chat.last_message_at && (
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>Son mesaj: {new Date(chat.last_message_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(chat.status)}`}>
                    {getStatusText(chat.status)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(chat.priority)}`}>
                    {getPriorityText(chat.priority)} öncelik
                  </span>
                </div>
              </div>

              <div className="ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openChatWindow(chat.id);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Aç
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
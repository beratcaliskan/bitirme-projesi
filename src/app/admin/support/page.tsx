'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatWithDetails } from '@/types/support';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, MessageCircle, Clock, AlertTriangle, CheckCircle, User, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const router = useRouter();

  const fetchChats = useCallback(async () => {
    try {
      const { data: chatsData, error: chatsError } = await supabase
        .from('support_chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;

      const chatsWithDetails = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', chat.user_id)
            .single();

          const { data: adminData } = chat.admin_id ? await supabase
            .from('admins')
            .select('name, email')
            .eq('id', chat.admin_id)
            .single() : { data: null };

          const { data: orderData } = await supabase
            .from('orders')
            .select('id, total_amount, status')
            .eq('id', chat.order_id)
            .single();

          const { data: messagesData } = await supabase
            .from('support_messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

          const unreadCount = messagesData?.filter(msg => 
            msg.sender_type === 'USER' && !msg.is_read
          ).length || 0;

          return {
            ...chat,
            user: userData || { name: 'Bilinmeyen', email: 'Bilinmeyen' },
            admin: adminData || undefined,
            order: orderData || { id: '', total_amount: 0, status: 'UNKNOWN' },
            messages: messagesData || [],
            unread_count: unreadCount
          };
        })
      );

      setChats(chatsWithDetails);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Real-time subscription for chat list updates
  useEffect(() => {
    const channel = supabase
      .channel('support_chats_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chats'
        },
        (payload) => {
          console.log('Real-time chat list update:', payload);
          // Refresh chat list when any chat is updated
          fetchChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        (payload) => {
          console.log('Real-time message list update:', payload);
          // Refresh chat list when any message is added (for unread counts)
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChats]);

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || chat.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusStyle = (status: string) => {
    const styles = {
      OPEN: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-green-100 text-green-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityStyle = (priority: string) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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

  const getPriorityIcon = (priority: string) => {
    const icons = {
      LOW: <Clock className="w-4 h-4" />,
      MEDIUM: <MessageCircle className="w-4 h-4" />,
      HIGH: <AlertTriangle className="w-4 h-4" />,
      URGENT: <AlertTriangle className="w-4 h-4 text-red-600" />
    };
    return icons[priority as keyof typeof icons];
  };

  const statusOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'OPEN', label: 'Açık' },
    { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
    { value: 'CLOSED', label: 'Kapalı' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'Tüm Öncelikler' },
    { value: 'LOW', label: 'Düşük' },
    { value: 'MEDIUM', label: 'Orta' },
    { value: 'HIGH', label: 'Yüksek' },
    { value: 'URGENT', label: 'Acil' }
  ];

  const openChatDetail = (chatId: string) => {
    router.push(`/admin/support/${chatId}`);
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Müşteri Destek</h1>
        <p className="mt-1 text-sm text-gray-600">Müşteri destek talepleri ve mesajları</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Müşteri adı, e-posta, konu veya sipariş ID ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
            <Select.Trigger className="inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <Select.Viewport>
                  {statusOptions.map((option) => (
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

          <Select.Root value={priorityFilter} onValueChange={setPriorityFilter}>
            <Select.Trigger className="inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]">
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
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri & Konu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sipariş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öncelik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Mesaj
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChats.map((chat) => (
                <tr key={chat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {chat.user.name}
                          {chat.unread_count > 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{chat.user.email}</div>
                        <div className="text-sm text-gray-900 mt-1 font-medium">{chat.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">#{chat.order.id.slice(-8)}</div>
                    <div className="text-sm text-gray-500">₺{chat.order.total_amount.toLocaleString('tr-TR')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(chat.status)}`}>
                      {getStatusText(chat.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(chat.priority)}`}>
                      {getPriorityIcon(chat.priority)}
                      <span className="ml-1">{getPriorityText(chat.priority)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(chat.last_message_at || chat.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      onClick={() => openChatDetail(chat.id)}
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Görüntüle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredChats.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Destek talebi bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'Arama kriterlerinizi değiştirmeyi deneyin.'
              : 'Henüz hiç destek talebi bulunmuyor.'
            }
          </p>
        </div>
      )}
    </div>
  );
} 
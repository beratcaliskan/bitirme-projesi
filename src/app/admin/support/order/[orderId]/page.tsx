'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatWithDetails, SupportMessage, SupportChat } from '@/types/support';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast-provider';
import * as Select from '@radix-ui/react-select';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Package, 
  Calendar, 
  Check, 
  ChevronDown,
  AlertTriangle,
  Clock,
  MessageCircle,
  CheckCircle,
  Plus
} from 'lucide-react';

export default function OrderChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<any>(null);
  const [chat, setChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [chatSubject, setChatSubject] = useState('');
  const [chatPriority, setChatPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Disable body scroll on mount, enable on unmount
  useEffect(() => {
    // Disable only body scroll, allow scroll in specific containers
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    
    // Prevent scroll events more comprehensively
    const preventBodyScroll = (e: Event) => {
      const target = e.target as Element;
      // Allow scroll in message containers
      if (target.closest('.overflow-y-auto')) {
        return;
      }
      // Prevent all other scroll
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    // Add event listeners for all scroll types
    document.addEventListener('wheel', preventBodyScroll, { passive: false });
    document.addEventListener('touchmove', preventBodyScroll, { passive: false });
    document.addEventListener('scroll', preventBodyScroll, { passive: false });
    window.addEventListener('scroll', preventBodyScroll, { passive: false });
    document.addEventListener('keydown', (e) => {
      // Prevent arrow keys, page up/down, home/end scrolling
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'].includes(e.key)) {
        const target = e.target as Element;
        if (!target.closest('.overflow-y-auto') && !target.closest('input') && !target.closest('textarea')) {
          e.preventDefault();
        }
      }
    });
    
    return () => {
      // Restore original styles
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      
      // Remove event listeners
      document.removeEventListener('wheel', preventBodyScroll);
      document.removeEventListener('touchmove', preventBodyScroll);
      document.removeEventListener('scroll', preventBodyScroll);
      window.removeEventListener('scroll', preventBodyScroll);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOrderAndChat = useCallback(async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          user:users!orders_user_id_fkey(name, email),
          address:addresses!orders_address_id_fkey(name, phone, city, district, neighborhood, full_address)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: existingChat, error: chatError } = await supabase
        .from('support_chats')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (chatError && chatError.code !== 'PGRST116') {
        throw chatError;
      }

      if (existingChat) {
        const { data: adminData } = existingChat.admin_id ? await supabase
          .from('admins')
          .select('name, email')
          .eq('id', existingChat.admin_id)
          .single() : { data: null };

        const { data: messagesData } = await supabase
          .from('support_messages')
          .select('*')
          .eq('chat_id', existingChat.id)
          .order('created_at', { ascending: true });

        const chatWithDetails: ChatWithDetails = {
          ...existingChat,
          user: orderData.user || { name: 'Bilinmeyen', email: 'Bilinmeyen' },
          admin: adminData || undefined,
          order: {
            id: orderData.id,
            total_amount: orderData.total_amount,
            status: orderData.status
          },
          messages: messagesData || [],
          unread_count: 0
        };

        setChat(chatWithDetails);
        setMessages(messagesData || []);
        await markMessagesAsRead(existingChat.id);
      } else {
        setShowCreateChat(true);
      }
    } catch (error) {
      console.error('Error fetching order and chat:', error);
      toast({
        title: 'Hata',
        description: 'Sipariş ve chat bilgileri yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  const markMessagesAsRead = async (chatId: string) => {
    try {
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .eq('sender_type', 'USER')
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const createNewChat = async () => {
    if (!chatSubject.trim() || !user || !order) return;

    try {
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!adminData) {
        throw new Error('Admin not found');
      }

      const { data: newChat, error: chatError } = await supabase
        .from('support_chats')
        .insert({
          order_id: orderId,
          user_id: order.user_id,
          admin_id: adminData.id,
          status: 'OPEN',
          priority: chatPriority,
          subject: chatSubject.trim()
        })
        .select()
        .single();

      if (chatError) throw chatError;

      const chatWithDetails: ChatWithDetails = {
        ...newChat,
        user: order.user || { name: 'Bilinmeyen', email: 'Bilinmeyen' },
        admin: undefined,
        order: {
          id: order.id,
          total_amount: order.total_amount,
          status: order.status
        },
        messages: [],
        unread_count: 0
      };

      setChat(chatWithDetails);
      setMessages([]);
      setShowCreateChat(false);
      setChatSubject('');

      toast({
        title: 'Başarılı',
        description: 'Yeni chat oluşturuldu.'
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Hata',
        description: 'Chat oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !chat) return;

    setSending(true);
    try {
      // Müşteri olarak mesaj gönder
      const { error } = await supabase
        .from('support_messages')
        .insert({
          chat_id: chat.id,
          sender_id: chat.user_id,
          sender_type: 'USER',
          message: newMessage.trim(),
          message_type: 'TEXT',
          is_read: false
        });

      if (error) throw error;

      await supabase
        .from('support_chats')
        .update({ 
          last_message_at: new Date().toISOString(),
          status: 'OPEN'
        })
        .eq('id', chat.id);

      setNewMessage('');
      // Real-time subscription will handle the update
      
      toast({
        title: 'Başarılı',
        description: 'Müşteri mesajı gönderildi.'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Hata',
        description: 'Mesaj gönderilirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const updateChatStatus = async (newStatus: string) => {
    if (!chat) return;

    try {
      const { error } = await supabase
        .from('support_chats')
        .update({ status: newStatus })
        .eq('id', chat.id);

      if (error) throw error;

      setChat({ ...chat, status: newStatus as any });

      toast({
        title: 'Başarılı',
        description: 'Chat durumu güncellendi.'
      });
    } catch (error) {
      console.error('Error updating chat status:', error);
      toast({
        title: 'Hata',
        description: 'Chat durumu güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchOrderAndChat();
  }, [fetchOrderAndChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!chat?.id) return;

    const channel = supabase
      .channel(`support_messages_${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as SupportMessage;
            setMessages(prev => [...prev, newMessage]);
            
            // Update chat last_message_at
            if (chat) {
              setChat(prev => prev ? {
                ...prev,
                last_message_at: newMessage.created_at
              } : null);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as SupportMessage;
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat?.id]);

  // Real-time subscription for chat status changes
  useEffect(() => {
    if (!chat?.id) return;

    const channel = supabase
      .channel(`support_chat_${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_chats',
          filter: `id=eq.${chat.id}`
        },
        (payload) => {
          console.log('Real-time chat update:', payload);
          const updatedChat = payload.new;
          
          if (chat) {
            setChat(prev => prev ? {
              ...prev,
              status: updatedChat.status,
              priority: updatedChat.priority,
              last_message_at: updatedChat.last_message_at,
              updated_at: updatedChat.updated_at
            } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat?.id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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

  const statusOptions = [
    { value: 'OPEN', label: 'Açık' },
    { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
    { value: 'CLOSED', label: 'Kapalı' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Düşük' },
    { value: 'MEDIUM', label: 'Orta' },
    { value: 'HIGH', label: 'Yüksek' },
    { value: 'URGENT', label: 'Acil' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Sipariş bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500">Bu sipariş mevcut değil veya silinmiş olabilir.</p>
        <Button onClick={() => window.close()} className="mt-4">
          Kapat
        </Button>
      </div>
    );
  }

  if (showCreateChat) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Yeni Chat Oluştur</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sipariş #{order.id.slice(-8)} için müşteri ile iletişim kurun
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konu
              </label>
              <Input
                value={chatSubject}
                onChange={(e) => setChatSubject(e.target.value)}
                placeholder="Chat konusunu girin..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Öncelik
              </label>
              <Select.Root value={chatPriority} onValueChange={(value) => setChatPriority(value as any)}>
                <Select.Trigger className="inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full">
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
                onClick={() => window.close()}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={createNewChat}
                disabled={!chatSubject.trim()}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                Oluştur
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Chat bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500">Bu chat mevcut değil veya silinmiş olabilir.</p>
        <Button onClick={() => window.close()} className="mt-4">
          Kapat
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" data-support-page>
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => window.close()}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kapat
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-600">Müşteri Chat</h2>
                <p className="text-sm text-gray-500">Müşteri: {chat.user.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Select.Root value={chat.status} onValueChange={updateChatStatus}>
              <Select.Trigger className={`inline-flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getStatusStyle(chat.status)}`}>
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

            <span className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${getPriorityStyle(chat.priority)}`}>
              {priorityOptions.find(p => p.value === chat.priority)?.label}
            </span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-900">Sipariş</p>
                <p className="text-xs text-gray-500">#{order.id.slice(-8)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-900">Konu</p>
                <p className="text-xs text-gray-500">{chat.subject}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-900">Oluşturulma</p>
                <p className="text-xs text-gray-500">
                  {new Date(chat.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: 'calc(100vh - 340px)', height: 'calc(100vh - 340px)' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_type === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_type === 'USER'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-center mb-1">
                <span className="text-xs font-medium">
                  {message.sender_type === 'USER' ? 'Müşteri' : 'Destek Ekibi'}
                </span>
              </div>
              <p className="text-sm">{message.message}</p>
              <p className={`text-xs mt-1 ${
                message.sender_type === 'USER' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Müşteri olarak mesaj yazın..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Bu sayfada müşteri perspektifinden mesaj gönderiyorsunuz
        </p>
      </div>
    </div>
  );
} 
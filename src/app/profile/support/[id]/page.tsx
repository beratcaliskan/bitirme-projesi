'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatWithDetails, SupportMessage } from '@/types/support';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast-provider';
import { 
  ArrowLeft, 
  Send, 
  Package, 
  Calendar, 
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function ProfileChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const chatId = params.id as string;
  
  const [chat, setChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current!.scrollTop = messagesContainerRef.current!.scrollHeight;
      }, 100);
    }
  };

  const fetchChatDetails = useCallback(async () => {
    try {
      const { data: chatData, error: chatError } = await supabase
        .from('support_chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;

      // Kullanıcının kendi chat'i mi kontrol et
      if (chatData.user_id !== user?.id) {
        throw new Error('Bu chate erişim yetkiniz yok');
      }

      const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', chatData.user_id)
        .single();

      const { data: adminData } = chatData.admin_id ? await supabase
        .from('admins')
        .select('name, email')
        .eq('id', chatData.admin_id)
        .single() : { data: null };

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .eq('id', chatData.order_id)
        .single();

      const { data: messagesData } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      const chatWithDetails: ChatWithDetails = {
        ...chatData,
        user: userData || { name: 'Bilinmeyen', email: 'Bilinmeyen' },
        admin: adminData || undefined,
        order: orderData || { id: '', total_amount: 0, status: 'UNKNOWN' },
        messages: messagesData || [],
        unread_count: 0
      };

      setChat(chatWithDetails);
      setMessages(messagesData || []);

      await markMessagesAsRead();
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching chat details:', error);
      toast({
        title: 'Hata',
        description: 'Chat detayları yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [chatId, toast, user?.id]);

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .eq('sender_type', 'ADMIN')
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !user || !chat) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
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
        .eq('id', chatId);

      setNewMessage('');
      
      toast({
        title: 'Başarılı',
        description: 'Mesaj gönderildi.'
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

  useEffect(() => {
    fetchChatDetails();
  }, [fetchChatDetails]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial scroll to bottom when component mounts
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

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

            // Auto-mark admin messages as read when user is viewing
            if (newMessage.sender_type === 'ADMIN' && !newMessage.is_read) {
              markMessagesAsRead();
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

  const getStatusText = (status: string) => {
    const texts = {
      OPEN: 'Açık',
      IN_PROGRESS: 'Devam Ediyor',
      CLOSED: 'Kapalı'
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Chat bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500">Bu chat mevcut değil veya erişim yetkiniz yok.</p>
        <Button onClick={() => window.close()} className="mt-4">
          Kapat
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
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
                <h2 className="text-lg font-semibold text-blue-600">Destek Talebi</h2>
                <p className="text-sm text-gray-500">{chat.subject}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${getStatusStyle(chat.status)}`}>
              {getStatusIcon(chat.status)}
              <span>{getStatusText(chat.status)}</span>
            </div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-900">Sipariş</p>
                <p className="text-xs text-gray-500">#{chat.order.id.slice(-8)}</p>
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

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" 
        style={{ maxHeight: 'calc(100vh - 340px)', height: 'calc(100vh - 340px)' }}
      >
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
                  {message.sender_type === 'USER' ? 'Ben' : 'Destek Ekibi'}
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
            placeholder="Mesajınızı yazın..."
            disabled={sending || chat.status === 'CLOSED'}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || chat.status === 'CLOSED'}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {chat.status === 'CLOSED' ? (
          <p className="text-xs text-gray-500 mt-1">
            Bu destek talebi kapatılmıştır. Yeni mesaj gönderemezsiniz.
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            Destek ekibimiz size en kısa sürede yanıt verecek.
          </p>
        )}
      </div>
    </div>
  );
} 
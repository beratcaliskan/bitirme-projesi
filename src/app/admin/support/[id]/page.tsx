'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatWithDetails, SupportMessage } from '@/types/support';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast-provider';
import * as Select from '@radix-ui/react-select';
import { 
  ArrowLeft, 
  MessageCircle, 
  Send, 
  Calendar, 
  Package, 
  ChevronDown, 
  Check,
  User
} from 'lucide-react';

export default function ChatDetailPage() {
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
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendTypingEvent = (typing: boolean) => {
    if (!chat?.id) return;
    
    supabase.channel(`chat_${chat.id}_typing`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          chat_id: chat.id,
          user_type: 'ADMIN',
          typing: typing,
          timestamp: new Date().toISOString()
        }
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      sendTypingEvent(true);
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
      sendTypingEvent(false);
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingEvent(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
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
      
      // Scroll to bottom after loading messages
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
  }, [chatId, toast]);

  const markMessagesAsRead = async () => {
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return;

    setSending(true);
    stopTyping(); // Typing durumunu temizle
    
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          chat_id: chat.id,
          sender_id: null, // Admin messages don't have a specific sender_id
          sender_type: 'ADMIN',
          message: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const updateChatStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_chats')
        .update({ status: newStatus })
        .eq('id', chatId);

      if (error) throw error;

      if (chat) {
        setChat({ ...chat, status: newStatus as any });
      }

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

  const updateChatPriority = async (newPriority: string) => {
    try {
      const { error } = await supabase
        .from('support_chats')
        .update({ priority: newPriority })
        .eq('id', chatId);

      if (error) throw error;

      if (chat) {
        setChat({ ...chat, priority: newPriority as any });
      }

      toast({
        title: 'Başarılı',
        description: 'Chat önceliği güncellendi.'
      });
    } catch (error) {
      console.error('Error updating chat priority:', error);
      toast({
        title: 'Hata',
        description: 'Chat önceliği güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
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

  // Real-time subscription for messages and typing
  useEffect(() => {
    if (!chat?.id) return;

    const messageChannel = supabase
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
            
            if (chat) {
              setChat(prev => prev ? {
                ...prev,
                last_message_at: newMessage.created_at
              } : null);
            }

            if (newMessage.sender_type === 'USER' && !newMessage.is_read) {
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

    const typingChannel = supabase
      .channel(`chat_${chat.id}_typing`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing event received:', payload);
        if (payload.payload.user_type === 'USER') {
          setUserTyping(payload.payload.typing);
          
          if (payload.payload.typing) {
            setTimeout(() => {
              setUserTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
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

  if (!chat) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Chat bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500">Bu chat mevcut değil veya silinmiş olabilir.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Geri Dön
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
              onClick={() => router.back()}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Geri
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-indigo-600">Admin Chat</h2>
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

            <Select.Root value={chat.priority} onValueChange={updateChatPriority}>
              <Select.Trigger className={`inline-flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getPriorityStyle(chat.priority)}`}>
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

        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 flex-shrink-0">
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
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-indigo-50 to-gray-100 messages-container"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9'
        }}
      >
        <style jsx global>{`
          .messages-container::-webkit-scrollbar {
            width: 6px;
          }
          .messages-container::-webkit-scrollbar-track {
            background: #F1F5F9;
            border-radius: 3px;
          }
          .messages-container::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 3px;
          }
          .messages-container::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }
          .admin-message-bubble {
            animation: slideInRight 0.3s ease-out;
          }
          .user-message-bubble {
            animation: slideInLeft 0.3s ease-out;
          }
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="bg-white rounded-full p-4 shadow-lg mb-4">
              <MessageCircle className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz mesaj yok</h3>
            <p className="text-gray-500 text-sm">Müşteriyle konuşmaya başlamak için aşağıdan mesaj yazın.</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'ADMIN' ? 'justify-end admin-message-bubble' : 'justify-start user-message-bubble'}`}
              >
                <div className={`max-w-[70%] ${message.sender_type === 'USER' ? '' : 'flex items-start space-x-3 flex-row-reverse'}`}>
                  {message.sender_type === 'USER' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {message.sender_type === 'ADMIN' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <MessageCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${message.sender_type === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.sender_type === 'ADMIN'
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-md'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <span className={`text-xs font-medium ${
                          message.sender_type === 'ADMIN' ? 'text-indigo-100' : 'text-gray-600'
                        }`}>
                          {message.sender_type === 'ADMIN' ? 'Destek Ekibi' : 'Müşteri'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed break-words">{message.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-xs ${
                          message.sender_type === 'ADMIN' ? 'text-indigo-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {message.sender_type === 'ADMIN' && (
                          <div className="ml-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-200 flex items-center justify-center">
                              <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Read status for user messages */}
                    {message.sender_type === 'USER' && index === messages.length - 1 && (
                      <div className="flex items-center mt-2 space-x-1">
                        <span className="text-xs text-gray-500">Müşteri mesajı gönderdi</span>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
        
        {/* User typing indicator */}
        {userTyping && (
          <div className="flex justify-start user-message-bubble">
            <div className="max-w-[70%] flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="px-4 py-3 bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-md shadow-md">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium text-gray-600">Müşteri yazıyor</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Admin olarak mesaj yazın..."
                disabled={sending}
                className="flex-1 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 pr-12 py-3 text-sm resize-none transition-all duration-200"
              />
              {newMessage.trim() && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gönder
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-gray-500">
                Bu sayfada admin perspektifinden mesaj gönderiyorsunuz
              </p>
            </div>
            
            <div className="flex items-center space-x-3 text-xs text-gray-400">
              <span>Enter ile gönderin</span>
              <div className="flex space-x-1">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⏎</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
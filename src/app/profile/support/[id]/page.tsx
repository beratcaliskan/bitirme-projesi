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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const chatId = params.id as string;
  
  const [chat, setChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug auth state
  useEffect(() => {
    console.log('Auth state changed:', { 
      user, 
      authLoading, 
      chatId,
      userId: user?.id,
      userEmail: user?.email 
    });
  }, [user, authLoading, chatId]);

  // Wait for auth to complete before fetching
  useEffect(() => {
    if (authLoading) {
      console.log('Still loading auth...');
      return;
    }
    
    if (!user) {
      console.log('No user found after auth loading completed');
      router.push('/login');
      return;
    }
    
    console.log('Auth completed, user found:', user);
    fetchChatDetails();
  }, [authLoading, user, chatId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
    
    // Alternatif method
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Forced scroll to bottom without animation
  const forceScrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'auto',
        block: 'end'
      });
    }
    
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const fetchChatDetails = useCallback(async () => {
    if (!chatId) {
      console.error('No chat ID provided');
      toast({
        title: 'Hata',
        description: 'Chat ID bulunamadı.',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    if (!user?.id) {
      console.error('No user ID found');
      toast({
        title: 'Hata',
        description: 'Kullanıcı girişi gerekli.',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching chat details for chatId:', chatId);
      console.log('Current user:', user);
      
      const { data: chatData, error: chatError } = await supabase
        .from('support_chats')
        .select('*')
        .eq('id', chatId)
        .single();

      console.log('Chat query result:', { chatData, chatError });

      if (chatError) {
        console.error('Chat fetch error:', chatError);
        throw chatError;
      }

      // Kullanıcının kendi chat'i mi kontrol et
      if (chatData.user_id !== user?.id) {
        console.error('Access denied - user_id mismatch:', {
          chatUserId: chatData.user_id,
          currentUserId: user?.id
        });
        throw new Error('Bu chate erişim yetkiniz yok');
      }

      console.log('Fetching user data for user_id:', chatData.user_id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', chatData.user_id)
        .single();
      
      console.log('User data result:', { userData, userError });

      console.log('Fetching admin data for admin_id:', chatData.admin_id);
      const { data: adminData, error: adminError } = chatData.admin_id ? await supabase
        .from('admins')
        .select('name, email')
        .eq('id', chatData.admin_id)
        .single() : { data: null, error: null };
      
      console.log('Admin data result:', { adminData, adminError });

      console.log('Fetching order data for order_id:', chatData.order_id);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .eq('id', chatData.order_id)
        .single();
      
      console.log('Order data result:', { orderData, orderError });

      console.log('Fetching messages for chat_id:', chatId);
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      console.log('Messages data result:', { messagesData, messagesError });

      const chatWithDetails: ChatWithDetails = {
        ...chatData,
        user: userData || { name: 'Bilinmeyen', email: 'Bilinmeyen' },
        admin: adminData || undefined,
        order: orderData || { id: '', total_amount: 0, status: 'UNKNOWN' },
        messages: messagesData || [],
        unread_count: 0
      };

      console.log('Final chat with details:', chatWithDetails);
      setChat(chatWithDetails);
      setMessages(messagesData || []);

      await markMessagesAsRead();
      
      // Force scroll to bottom after loading
      setTimeout(() => {
        forceScrollToBottom();
      }, 100);
      
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
    if (!newMessage.trim() || !user || !chat) return;

    setSending(true);
    stopTyping(); // Typing durumunu temizle
    
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          chat_id: chat.id,
          sender_id: user.id,
          sender_type: 'USER',
          message: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      setNewMessage('');
      
      // Focus input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        forceScrollToBottom();
      }, 50);
    }
  }, [messages]);

  // Force scroll to bottom on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      forceScrollToBottom();
      // Also focus input when chat loads
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Real-time subscription for messages
  useEffect(() => {
    if (!chat?.id) return;

    const channel = supabase
      .channel(`support_chat_${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as SupportMessage];
          });
          setTimeout(scrollToBottom, 100);
          setTimeout(scrollToBottom, 200);
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`chat_${chat.id}_typing`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing event received:', payload);
        if (payload.payload.user_type === 'ADMIN') {
          setAdminTyping(payload.payload.typing);
          
          if (payload.payload.typing) {
            setTimeout(() => {
              setAdminTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  const sendTypingEvent = (typing: boolean) => {
    if (!chat?.id) return;
    
    supabase.channel(`chat_${chat.id}_typing`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          chat_id: chat.id,
          user_type: 'USER',
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Chat yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chat bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">Bu chat mevcut değil veya erişim yetkiniz yok.</p>
          <Button onClick={() => window.close()} className="mt-4">
            Kapat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="h-full flex flex-col overflow-hidden">
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
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 messages-container"
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
            .message-bubble {
              animation: slideIn 0.3s ease-out;
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="bg-white rounded-full p-4 shadow-lg mb-4">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz mesaj yok</h3>
              <p className="text-gray-500 text-sm">Destek ekibiyle konuşmaya başlamak için aşağıdan mesaj yazın.</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex message-bubble ${message.sender_type === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.sender_type === 'USER' ? '' : 'flex items-start space-x-3'}`}>
                    {message.sender_type === 'ADMIN' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${message.sender_type === 'USER' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm ${
                          message.sender_type === 'USER'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-md'
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          <span className={`text-xs font-medium ${
                            message.sender_type === 'USER' ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {message.sender_type === 'USER' ? 'Ben' : 'Destek Ekibi'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed break-words">{message.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-xs ${
                            message.sender_type === 'USER' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {message.sender_type === 'USER' && (
                            <div className="ml-2">
                              <div className="w-3 h-3 rounded-full bg-blue-200 flex items-center justify-center">
                                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Typing indicator - would be shown when admin is typing */}
                      {message.sender_type === 'ADMIN' && index === messages.length - 1 && (
                        <div className="flex items-center mt-2 space-x-1">
                          <span className="text-xs text-gray-500">Destek ekibi mesajınızı gördü</span>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse delay-150"></div>
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
          
          {/* Admin typing indicator */}
          {adminTyping && (
            <div className="flex justify-start">
              <div className="max-w-[70%] flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="flex flex-col items-start">
                  <div className="px-4 py-3 bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-md shadow-md">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-gray-600">Destek Ekibi yazıyor</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
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
                  placeholder="Mesajınızı yazın..."
                  disabled={sending || chat.status === 'CLOSED'}
                  className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12 py-3 text-sm resize-none transition-all duration-200"
                  ref={inputRef}
                />
                {newMessage.trim() && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || chat.status === 'CLOSED'}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
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
                {chat.status === 'CLOSED' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <p className="text-xs text-red-600 font-medium">
                      Bu destek talebi kapatılmıştır. Yeni mesaj gönderemezsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-500">
                      Destek ekibimiz size en kısa sürede yanıt verecek.
                    </p>
                  </div>
                )}
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
    </div>
  );
} 
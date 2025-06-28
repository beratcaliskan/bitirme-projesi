import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// Realtime channel management
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()

  // Subscribe to support chat messages
  subscribeToChat(chatId: string, onMessage: (message: any) => void, onError?: (error: any) => void) {
    const channelName = `chat_${chatId}`
    
    // Remove existing channel if exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('New message received:', payload.new)
          onMessage(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('Message updated:', payload.new)
          onMessage(payload.new)
        }
      )
      .subscribe((status) => {
        console.log(`Chat ${chatId} subscription status:`, status)
        if (status !== 'SUBSCRIBED' && onError) {
          onError(new Error(`Failed to subscribe to chat ${chatId}: ${status}`))
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to chat status changes
  subscribeToChatStatus(chatId: string, onStatusChange: (chat: any) => void, onError?: (error: any) => void) {
    const channelName = `chat_status_${chatId}`
    
    // Remove existing channel if exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_chats',
          filter: `id=eq.${chatId}`
        },
        (payload) => {
          console.log('Chat status changed:', payload.new)
          onStatusChange(payload.new)
        }
      )
      .subscribe((status) => {
        console.log(`Chat status ${chatId} subscription status:`, status)
        if (status !== 'SUBSCRIBED' && onError) {
          onError(new Error(`Failed to subscribe to chat status ${chatId}: ${status}`))
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to order updates
  subscribeToOrderUpdates(userId: string, onOrderUpdate: (order: any) => void, onError?: (error: any) => void) {
    const channelName = `orders_${userId}`
    
    // Remove existing channel if exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Order updated:', payload)
          onOrderUpdate(payload.new || payload.old)
        }
      )
      .subscribe((status) => {
        console.log(`Orders ${userId} subscription status:`, status)
        if (status !== 'SUBSCRIBED' && onError) {
          onError(new Error(`Failed to subscribe to orders for user ${userId}: ${status}`))
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to admin presence (for online/offline status)
  subscribeToAdminPresence(onPresenceChange: (presences: any) => void) {
    const channelName = 'admin_presence'
    
    // Remove existing channel if exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const presences = channel.presenceState()
        console.log('Admin presence sync:', presences)
        onPresenceChange(presences)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Admin joined:', key, newPresences)
        onPresenceChange(channel.presenceState())
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Admin left:', key, leftPresences)
        onPresenceChange(channel.presenceState())
      })
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Track admin presence
  trackAdminPresence(adminId: string, adminData: { name: string; email: string }) {
    const channel = this.channels.get('admin_presence')
    if (channel) {
      channel.track({
        admin_id: adminId,
        online_at: new Date().toISOString(),
        ...adminData
      })
    }
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`Unsubscribed from ${channelName}`)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel)
      console.log(`Unsubscribed from ${name}`)
    })
    this.channels.clear()
  }

  // Get active channels
  getActiveChannels() {
    return Array.from(this.channels.keys())
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager()

// Utility functions for common realtime operations
export const realtimeUtils = {
  // Start listening to a chat
  startChatListener: (chatId: string, onMessage: (message: any) => void) => {
    return realtimeManager.subscribeToChat(chatId, onMessage)
  },

  // Stop listening to a chat
  stopChatListener: (chatId: string) => {
    realtimeManager.unsubscribe(`chat_${chatId}`)
  },

  // Start listening to chat status
  startChatStatusListener: (chatId: string, onStatusChange: (chat: any) => void) => {
    return realtimeManager.subscribeToChatStatus(chatId, onStatusChange)
  },

  // Stop listening to chat status
  stopChatStatusListener: (chatId: string) => {
    realtimeManager.unsubscribe(`chat_status_${chatId}`)
  },

  // Start listening to order updates
  startOrderListener: (userId: string, onOrderUpdate: (order: any) => void) => {
    return realtimeManager.subscribeToOrderUpdates(userId, onOrderUpdate)
  },

  // Stop listening to order updates
  stopOrderListener: (userId: string) => {
    realtimeManager.unsubscribe(`orders_${userId}`)
  },

  // Clean up all listeners (call this on component unmount)
  cleanup: () => {
    realtimeManager.unsubscribeAll()
  }
}

// Example usage in React components:
/*
import { realtimeUtils } from '@/lib/realtime-setup'

// In your chat component:
useEffect(() => {
  const handleNewMessage = (message: any) => {
    setMessages(prev => [...prev, message])
  }

  realtimeUtils.startChatListener(chatId, handleNewMessage)

  return () => {
    realtimeUtils.stopChatListener(chatId)
  }
}, [chatId])

// In your admin dashboard:
useEffect(() => {
  const handleOrderUpdate = (order: any) => {
    // Update order in your state
    setOrders(prev => prev.map(o => o.id === order.id ? order : o))
  }

  realtimeUtils.startOrderListener(userId, handleOrderUpdate)

  return () => {
    realtimeUtils.stopOrderListener(userId)
  }
}, [userId])
*/ 
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Store active admin sessions
const activeAdminSessions = new Map<string, { lastSeen: number, adminId: string }>();

// Clean up old sessions every 30 seconds
setInterval(() => {
  const now = Date.now();
  const chatIdsToDelete: string[] = [];
  
  activeAdminSessions.forEach((session, chatId) => {
    // Remove sessions older than 10 seconds
    if (now - session.lastSeen > 10000) {
      chatIdsToDelete.push(chatId);
    }
  });

  // Delete inactive sessions and restore status
  chatIdsToDelete.forEach(chatId => {
    activeAdminSessions.delete(chatId);
    console.log(`Removed inactive admin session for chat ${chatId}`);
    
    // Restore chat status to OPEN if it was IN_PROGRESS
    supabase
      .from('support_chats')
      .select('status')
      .eq('id', chatId)
      .single()
      .then(({ data, error }) => {
        if (!error && data?.status === 'IN_PROGRESS') {
          supabase
            .from('support_chats')
            .update({ status: 'OPEN' })
            .eq('id', chatId)
            .then(() => {
              console.log(`Chat ${chatId} status restored to OPEN due to admin inactivity`);
            });
        }
      });
  });
}, 30000);

export async function POST(request: NextRequest) {
  try {
    const { chat_id, action, admin_id } = await request.json();

    if (!chat_id || !action) {
      return NextResponse.json(
        { error: 'Missing chat_id or action' },
        { status: 400 }
      );
    }

    if (action === 'ping') {
      // Update last seen time for admin
      activeAdminSessions.set(chat_id, {
        lastSeen: Date.now(),
        adminId: admin_id || 'unknown'
      });

      // Check if chat should be IN_PROGRESS
      const { data: chat, error } = await supabase
        .from('support_chats')
        .select('status')
        .eq('id', chat_id)
        .single();

      if (!error && chat?.status === 'OPEN') {
        // Set to IN_PROGRESS
        await supabase
          .from('support_chats')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', chat_id);

        console.log(`Chat ${chat_id} set to IN_PROGRESS by admin presence`);
      }

      return NextResponse.json({ 
        success: true, 
        activeAdmins: activeAdminSessions.get(chat_id) ? 1 : 0 
      });
    }

    if (action === 'leave') {
      // Remove admin session
      activeAdminSessions.delete(chat_id);

      // Restore status to OPEN if no other admins
      const { data: chat, error } = await supabase
        .from('support_chats')
        .select('status')
        .eq('id', chat_id)
        .single();

      if (!error && chat?.status === 'IN_PROGRESS') {
        await supabase
          .from('support_chats')
          .update({ status: 'OPEN' })
          .eq('id', chat_id);

        console.log(`Chat ${chat_id} restored to OPEN - admin left`);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'check') {
      // Check if any admin is active
      const isActive = activeAdminSessions.has(chat_id);
      return NextResponse.json({ 
        hasActiveAdmin: isActive,
        lastSeen: activeAdminSessions.get(chat_id)?.lastSeen || null
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in chat-presence API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
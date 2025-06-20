import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { chat_id, status } = await request.json();

    console.log('Restore chat status request:', { chat_id, status });

    if (!chat_id || !status) {
      return NextResponse.json(
        { error: 'Missing chat_id or status' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('support_chats')
      .update({ status })
      .eq('id', chat_id);

    if (error) {
      console.error('Error restoring chat status:', error);
      return NextResponse.json(
        { error: 'Failed to restore status', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Chat ${chat_id} status restored to ${status}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in restore-chat-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
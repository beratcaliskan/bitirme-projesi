import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { adminId } = await request.json();

    const { data, error } = await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminId)
      .select();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Admin last_login updated successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Terminal'e log at
    console.log('\x1b[36m%s\x1b[0m', '[SIDEBAR LOG]:', message);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in log route:', error);
    return NextResponse.json({ success: false, error: 'Logging failed' }, { status: 500 });
  }
} 
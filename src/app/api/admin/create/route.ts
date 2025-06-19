import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { email, password, name, role } = requestData;

    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanımda' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newAdmin, error: adminError } = await supabase
      .from('admins')
      .insert([
        {
          email,
          password: hashedPassword,
          name,
          role,
          is_super_admin: role === 'super_admin'
        }
      ])
      .select()
      .single();

    if (adminError) throw adminError;

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Yönetici oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
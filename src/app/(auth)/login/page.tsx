'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginUser } from '@/lib/utils/auth';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/';
  const errorMessage = searchParams.get('error');

  useEffect(() => {
    if (errorMessage === 'session_expired') {
      setError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
    }
  }, [errorMessage]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { user } = await loginUser({ email, password });
      console.log('Login successful:', user);
      
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      console.log('Admin check result:', {
        email: user.email,
        hasAdmin: !!admin,
        adminError,
        admin,
        redirectTo
      });

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError);
        setError('Yetki kontrolü yapılırken bir hata oluştu');
        return;
      }

      if (!admin && redirectTo.startsWith('/admin')) {
        console.log('Access denied: User is not admin');
        setError('Bu sayfaya erişim yetkiniz yok.');
        return;
      }
      if(admin) {
        await supabase
        .from('admins')
        .update({ 
          last_login: new Date().toLocaleDateString('tr-TR'),
        })
        .eq('id', admin.id);
      }
      console.log('Access granted, redirecting to:', redirectTo);
      
      window.location.href = redirectTo;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesabınıza giriş yapın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Veya{' '}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Hesap oluştur
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email adresi"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />

            <Input
              label="Parola"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div>Yükleniyor...</div></div>}>
      <LoginForm />
    </Suspense>
  );
} 
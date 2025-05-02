'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { registerUser } from '@/lib/utils/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      await registerUser({ email, password, name });
      router.push('/'); // Başarılı kayıttan sonra ana sayfaya yönlendir
      router.refresh(); // Sayfayı yenile (header'daki auth durumunu güncellemek için)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt olurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Yeni hesap oluşturun
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Veya{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              mevcut hesabınıza giriş yapın
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Ad Soyad"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
            />

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
              autoComplete="new-password"
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
            fullWidth
            disabled={loading}
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Hesap oluştur'}
          </Button>
        </form>
      </div>
    </div>
  );
} 
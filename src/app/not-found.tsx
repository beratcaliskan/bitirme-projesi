'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-indigo-600" />
          </div>
          
          {/* 404 Text */}
          <div className="space-y-2">
            <h1 className="text-8xl font-bold text-gray-900">404</h1>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-gray-700">
                Sayfa Bulunamadı
              </h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Aradığınız sayfa mevcut değil veya başka bir adrese taşınmış olabilir.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            
            <Link href="/">
              <Button className="w-full sm:w-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Home className="w-4 h-4" />
                Ana Sayfa
              </Button>
            </Link>
          </div>

          {/* Quick Navigation */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              Hızlı erişim:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
              >
                Ürünler
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
              >
                Sepetim
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
              >
                Profil
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8">
        </div>
      </div>
    </div>
  );
} 
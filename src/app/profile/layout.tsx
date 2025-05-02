'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import clsx from 'clsx';
import { cn } from '@/lib/utils';

const profileSections = [
  { name: 'Bilgilerim', href: '/profile' },
  { name: 'Güvenlik', href: '/profile/security' },
  { name: 'Adreslerim', href: '/profile/addresses' },
  { name: 'Ödeme Yöntemlerim', href: '/profile/payment-methods' },
  { name: 'Siparişlerim', href: '/profile/orders' },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Yükleniyor...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <Link 
            href="/login" 
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <nav className="space-y-1">
              {profileSections.map((section) => {
                const isActive = pathname === section.href;
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                      isActive
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-900 hover:bg-white hover:text-indigo-600'
                    )}
                  >
                    {section.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="mt-8 lg:mt-0 lg:col-span-9">
            <div className="bg-white shadow-sm rounded-lg p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 
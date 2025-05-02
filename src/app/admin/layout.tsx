'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Sidebar from './components/Sidebar';

// Terminal loglama fonksiyonu
const logToTerminal = async (message: string) => {
  try {
    console.log('\x1b[36m%s\x1b[0m', '[ADMIN LAYOUT]:', message);
  } catch (error) {
    console.error('Logging error:', error);
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('Checking admin status for user:', user);

      if (!user?.email) {
        console.log('No user email found');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', user.email)
          .single();

        console.log('Admin check result:', { data, error });

        if (error) {
          console.error('Admin check error:', error);
          setIsLoading(false);
          return;
        }

        // Admin rollerini kontrol et
        const isAdminRole = data && ['super_admin', 'admin'].includes(data.role);
        const isSuperAdminRole = data?.role === 'super_admin';

        console.log('Role check:', { isAdminRole, isSuperAdminRole });

        setIsAdmin(isAdminRole);
        setIsSuperAdmin(isSuperAdminRole);

        // Eğer admin değilse ve /admin altındaysa ana sayfaya yönlendir
        if (!isAdminRole && window.location.pathname.startsWith('/admin')) {
          console.log('Not an admin, redirecting to home');
          router.push('/');
        }
      } catch (error) {
        console.error('Error in admin check:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  // Yükleme durumunda loading göster
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  // Admin değilse hiçbir şey gösterme
  if (!isAdmin) {
    return null;
  }

  // Admin ise layout'u göster
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 fixed top-0 right-0 left-0 h-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Siteye Dön
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-screen pt-16"> {/* pt-16 header'ın yüksekliği kadar padding */}
        <Sidebar isSuperAdmin={isSuperAdmin} />
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 
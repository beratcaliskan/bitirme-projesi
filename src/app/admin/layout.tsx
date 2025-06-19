'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/admin/Sidebar';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

        const isAdminRole = data && ['super_admin', 'admin'].includes(data.role);
        const isSuperAdminRole = data?.role === 'super_admin';

        console.log('Role check:', { isAdminRole, isSuperAdminRole });

        setIsAdmin(isAdminRole);
        setIsSuperAdmin(isSuperAdminRole);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm z-30 fixed top-0 right-0 left-0 h-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Menüyü aç</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">{user?.email}</span>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="hidden sm:inline">Siteye Dön</span>
                <span className="sm:hidden">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
            <section className="absolute inset-y-0 left-0 pr-10 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  <div className="px-4 py-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Menü</h2>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <span className="sr-only">Paneli kapat</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Sidebar isSuperAdmin={isSuperAdmin} onItemClick={() => setIsSidebarOpen(false)} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      <div className="flex h-screen ">
        <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:top-16 lg:left-0 lg:z-20">
          <Sidebar isSuperAdmin={isSuperAdmin} />
        </div>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
} 
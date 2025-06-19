'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast-provider';
import { AddAdminModal } from '@/components/admin/add-admin-modal';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

type AdminRole = 'super_admin' | 'admin' | 'support_admin' | 'support';

interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
  role: AdminRole;
  is_super_admin: boolean;
  last_login?: string;
  permissions?: string[];
}

const roleStyles = {
  super_admin: { bg: 'bg-purple-100', text: 'text-purple-800', hover: 'hover:bg-purple-200' },
  admin: { bg: 'bg-indigo-100', text: 'text-indigo-800', hover: 'hover:bg-indigo-200' },
  support_admin: { bg: 'bg-green-100', text: 'text-green-800', hover: 'hover:bg-green-200' },
  support: { bg: 'bg-gray-100', text: 'text-gray-800', hover: 'hover:bg-gray-200' }
};

const roleLabels: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support_admin: 'Destek Yöneticisi',
  support: 'Destek Ekibi'
};



export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const fetchAdmins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: 'Hata',
        description: 'Yönetici listesi yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authLoading) {
          return;
        }

        if (!user) {
          router.push('/login');
          return;
        }

        console.log('Checking admin access for user:', user);

        const { data: adminData, error } = await supabase
          .from('admins')
          .select('email, role')
          .eq('email', user.email)
          .single();

        console.log('Admin data:', adminData);

        if (error || !adminData) {
          console.error('Admin check error:', error);
          toast({
            title: 'Yetkisiz Erişim',
            description: 'Admin yetkiniz bulunmuyor.',
            variant: 'destructive'
          });
          router.push('/admin');
          return;
        }

        if (adminData.role !== 'super_admin') {
          toast({
            title: 'Yetkisiz Erişim',
            description: 'Bu sayfaya erişim için super admin yetkisi gerekiyor.',
            variant: 'destructive'
          });
          router.push('/admin');
          return;
        }

        await fetchAdmins();
      } catch (error) {
        console.error('Auth check error:', error);
        toast({
          title: 'Hata',
          description: 'Yetki kontrolü sırasında bir hata oluştu.',
          variant: 'destructive'
        });
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, authLoading, fetchAdmins, router, toast]);



  async function handleRoleUpdate(adminId: string, newRole: AdminRole) {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ 
          role: newRole,
        })
        .eq('id', adminId);

      if (error) throw error;

      await fetchAdmins();

      toast({
        title: 'Başarılı',
        description: 'Yönetici rolü güncellendi.'
      });
    } catch (error) {
      console.error('Error updating admin role:', error);
      toast({
        title: 'Hata',
        description: 'Rol güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  }

  async function handleRemoveAdmin(adminId: string) {
    if (!window.confirm('Bu yöneticiyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      setAdmins(admins.filter(admin => admin.id !== adminId));
    } catch (error) {
      console.error('Error removing admin:', error);
    }
  }



  const filteredAdmins = admins.filter(admin =>
    (admin.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (admin.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Yöneticiler</h1>
        <p className="mt-1 text-sm text-gray-600">Sistem yöneticilerini görüntüleyin ve yönetin</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-lg">
          <Input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full placeholder:text-gray-400 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          <span className="hidden sm:inline">Yeni Yönetici Ekle</span>
          <span className="sm:hidden">Yönetici Ekle</span>
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yönetici
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Son Giriş
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Kayıt Tarihi
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {admin.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {admin.email}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden mt-1">
                        {admin.last_login 
                          ? new Date(admin.last_login).toLocaleDateString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Henüz giriş yapmadı'
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                    {admin.last_login 
                      ? new Date(admin.last_login).toLocaleDateString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Henüz giriş yapmadı'
                    }
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {user?.id !== admin.id ? (
                      <Select.Root
                        value={admin.role}
                        onValueChange={(value) => handleRoleUpdate(admin.id, value as AdminRole)}
                      >
                        <Select.Trigger
                          className={`inline-flex items-center justify-between rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            roleStyles[admin.role].bg
                          } ${roleStyles[admin.role].text}`}
                        >
                          <span className="hidden sm:inline">{roleLabels[admin.role]}</span>
                          <span className="sm:hidden">{roleLabels[admin.role].split(' ')[0]}</span>
                          <Select.Icon>
                            <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </Select.Icon>
                        </Select.Trigger>

                        <Select.Portal>
                          <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <Select.ScrollUpButton />
                            <Select.Viewport>
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <Select.Item
                                  key={value}
                                  value={value}
                                  className={`relative flex items-center px-8 py-2 text-sm cursor-default select-none focus:outline-none ${
                                    roleStyles[value as AdminRole].hover
                                  }`}
                                >
                                  <Select.ItemText>{label}</Select.ItemText>
                                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                    <Check className="h-4 w-4" />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                            <Select.ScrollDownButton />
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    ) : (
                      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        roleStyles[admin.role].bg
                      } ${roleStyles[admin.role].text}`}>
                        <span className="hidden sm:inline">{roleLabels[admin.role]}</span>
                        <span className="sm:hidden">{roleLabels[admin.role].split(' ')[0]}</span>
                      </span>
                    )}
                    <div className="text-xs text-gray-500 lg:hidden mt-1">
                      {new Date(admin.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(admin.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                                          {user?.id !== admin.id && (
                        <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                          <Button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                          >
                            <span className="hidden sm:inline">Kaldır</span>
                            <span className="sm:hidden">🗑️</span>
                          </Button>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAdmins}
      />
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

type AdminRole = 'super_admin' | 'admin' | 'support_admin' | 'support';

interface Admin {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: AdminRole;
  is_super_admin: boolean;
  last_login?: string;
  permissions?: string[];
}

const roleStyles = {
  super_admin: { bg: 'bg-purple-100', text: 'text-purple-800' },
  admin: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  support_admin: { bg: 'bg-green-100', text: 'text-green-800' },
  support: { bg: 'bg-gray-100', text: 'text-gray-800' }
};

const roleLabels: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support_admin: 'Destek Yöneticisi',
  support: 'Destek Ekibi'
};

const roleClasses = {
  admin: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  editor: { bg: 'bg-green-100', text: 'text-green-800' },
  viewer: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    checkSuperAdmin();
    fetchAdmins();
  }, []);

  async function checkSuperAdmin() {
    if (!user) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || data?.role !== 'super_admin') {
      router.push('/admin');
    }
  }

  async function fetchAdmins() {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleUpdate(adminId: string, newRole: AdminRole) {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ 
          role: newRole,
          is_super_admin: newRole === 'super_admin'
        })
        .eq('id', adminId);

      if (error) throw error;

      setAdmins(admins.map(admin =>
        admin.id === adminId
          ? { ...admin, role: newRole, is_super_admin: newRole === 'super_admin' }
          : admin
      ));
    } catch (error) {
      console.error('Error updating admin role:', error);
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
    (admin.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (admin.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <Input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full placeholder:text-gray-400 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button
          onClick={() => router.push('/admin/admins/new')}
          className="ml-4"
        >
          Yeni Yönetici Ekle
        </Button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yönetici
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Giriş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {admin.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.last_login 
                      ? new Date(admin.last_login).toLocaleDateString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Henüz giriş yapmadı'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      roleStyles[admin.role].bg} ${roleStyles[admin.role].text}`}>
                      {roleLabels[admin.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user?.id !== admin.id && (
                      <div className="flex justify-end space-x-2">
                        <select
                          value={admin.role}
                          onChange={(e) => handleRoleUpdate(admin.id, e.target.value as AdminRole)}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <Button
                          onClick={() => handleRemoveAdmin(admin.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Kaldır
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
    </div>
  );
} 
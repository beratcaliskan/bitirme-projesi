'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminRole = 'super_admin' | 'admin' | 'support_admin' | 'support';

export default function NewAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin' as AdminRole
  });

  const roles: { value: AdminRole; label: string; description: string }[] = [
    {
      value: 'super_admin',
      label: 'Super Admin',
      description: 'Tüm yetkilere sahip, diğer yöneticileri yönetebilir'
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Ürün ve sipariş yönetimi yapabilir'
    },
    {
      value: 'support_admin',
      label: 'Destek Yöneticisi',
      description: 'Müşteri hizmetleri ve destek taleplerini yönetir'
    },
    {
      value: 'support',
      label: 'Destek Ekibi',
      description: 'Sadece destek taleplerini görüntüler ve yanıtlar'
    }
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: adminError } = await supabase
          .from('admins')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            is_super_admin: formData.role === 'super_admin'
          }]);

        if (adminError) throw adminError;

        router.push('/admin/admins');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Yönetici oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Yeni Yönetici Ekle
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="Ad Soyad"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Yöneticinin adı ve soyadı"
              className="w-full"
            />
          </div>

          <div>
            <Input
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="ornek@sirket.com"
              className="w-full"
            />
          </div>

          <div>
            <Input
              label="Şifre"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Güçlü bir şifre girin"
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Yönetici Rolü
            </label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {roles.map((role) => (
                <div key={role.value} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={role.value}
                      name="admin_role"
                      type="radio"
                      checked={formData.role === role.value}
                      onChange={() => setFormData({ ...formData, role: role.value })}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor={role.value} className="font-medium text-gray-900">
                      {role.label}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Ekleniyor...' : 'Yönetici Ekle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
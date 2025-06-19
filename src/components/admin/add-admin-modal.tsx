'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-provider';

type AdminRole = 'super_admin' | 'admin' | 'support_admin' | 'support';

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

export function AddAdminModal({ isOpen, onClose, onSuccess }: AddAdminModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    last_login: '',
    role: 'admin' as AdminRole
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {


        const { error: adminError } = await supabase
          .from('admins')
          .insert([{
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }]);

        if (adminError) throw adminError;

        toast({
          title: 'Başarılı',
          description: 'Yeni yönetici başarıyla eklendi.'
        });

        onSuccess();
        handleClose();
      
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: 'Hata',
        description: 'Yönetici oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'admin',
      last_login: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Yeni Yönetici Ekle
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Kapat</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              onClick={handleClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Ekleniyor...' : 'Yönetici Ekle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
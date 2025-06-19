'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast-provider';

interface Address {
  id: string;
  title: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  full_address: string;
  is_default: boolean;
}

interface PaymentMethod {
  id: string;
  card_holder: string;
  card_number: string;
  expire_month: string;
  expire_year: string;
  is_default: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  addresses: Address[];
  payment_methods: PaymentMethod[];
}

interface AdminUserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate: () => void;
}

export function AdminUserDetailModal({ isOpen, onClose, user, onUserUpdate }: AdminUserDetailModalProps) {
  const [modalTab, setModalTab] = useState('profile');
  const [newPassword, setNewPassword] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(user);
  const { toast } = useToast();

  if (!isOpen || !user) return null;

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      if (editingUser.phone) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone', editingUser.phone)
          .neq('id', editingUser.id)
          .single();

        if (existingUser) {
          throw new Error('Bu telefon numarası başka bir kullanıcı tarafından kullanılıyor');
        }
      }

      if (editingUser.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', editingUser.email)
          .neq('id', editingUser.id)
          .single();

        if (existingUser) {
          throw new Error('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor');
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone
        })
        .eq('id', editingUser.id);

      if (error) {
        throw new Error('Kullanıcı güncellenirken bir hata oluştu');
      }

      toast({
        title: 'Başarılı',
        description: 'Kullanıcı bilgileri güncellendi',
        variant: 'success'
      });

      onUserUpdate();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kullanıcı güncellenirken bir hata oluştu';
      toast({
        title: 'Hata',
        description: errorMessage,
        variant: 'error'
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !editingUser) return;

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        editingUser.id,
        { password: newPassword }
      );

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Şifre güncellendi',
        variant: 'success'
      });

      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Hata',
        description: 'Şifre güncellenirken bir hata oluştu',
        variant: 'error'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
        </div>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900">
                  {editingUser?.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editingUser?.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setModalTab('profile')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    modalTab === 'profile'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profil Bilgileri
                </button>
                <button
                  onClick={() => setModalTab('addresses')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    modalTab === 'addresses'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Adresler ({editingUser?.addresses.length || 0})
                </button>
                <button
                  onClick={() => setModalTab('payments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    modalTab === 'payments'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Ödeme Yöntemleri ({editingUser?.payment_methods.length || 0})
                </button>
                <button
                  onClick={() => setModalTab('security')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    modalTab === 'security'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Güvenlik
                </button>
              </nav>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {modalTab === 'profile' && (
                <form onSubmit={handleUpdateUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Ad Soyad"
                        value={editingUser?.name || ''}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Input
                        label="E-posta"
                        type="email"
                        value={editingUser?.email || ''}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Telefon"
                        value={editingUser?.phone || ''}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        placeholder="05XX XXX XX XX"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kayıt Tarihi
                      </label>
                      <p className="text-sm text-gray-900 py-2">
                        {editingUser ? new Date(editingUser.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      Bilgileri Güncelle
                    </Button>
                  </div>
                </form>
              )}

              {modalTab === 'addresses' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900">Kullanıcı Adresleri</h4>
                  </div>

                  {editingUser && editingUser.addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Henüz kayıtlı adres bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editingUser?.addresses.map((address) => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium text-gray-900">{address.title}</h5>
                                {address.is_default && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Varsayılan
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">{address.name}</span> - {address.phone}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.neighborhood} Mah., {address.district}/{address.city}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {address.full_address}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'payments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900">Ödeme Yöntemleri</h4>
                  </div>

                  {editingUser && editingUser.payment_methods.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Henüz kayıtlı ödeme yöntemi bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editingUser?.payment_methods.map((payment) => (
                        <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium text-gray-900">
                                  **** **** **** {payment.card_number.slice(-4)}
                                </h5>
                                {payment.is_default && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Varsayılan
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{payment.card_holder}</span>
                              </p>
                              <p className="text-sm text-gray-500">
                                Son Kullanma: {payment.expire_month}/{payment.expire_year}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Şifre Değiştir</h4>
                    <div className="max-w-md">
                      <Input
                        label="Yeni Şifre"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Yeni şifre girin"
                      />
                      <div className="mt-4">
                        <Button
                          onClick={handleUpdatePassword}
                          disabled={!newPassword}
                        >
                          Şifreyi Güncelle
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Hesap Bilgileri</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kullanıcı ID</label>
                        <p className="text-sm text-gray-900 font-mono">{editingUser?.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                        <p className="text-sm text-gray-900">
                          {editingUser ? new Date(editingUser.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
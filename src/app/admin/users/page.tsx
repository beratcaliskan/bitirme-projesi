'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  email_verified: boolean;
  phone_verified: boolean;
  total_orders: number;
  total_spent: number;
  addresses: Address[];
  default_address?: Address;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'addresses' | 'security'>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, created_at, email_verified, phone_verified');

      if (usersError) throw usersError;

      const usersWithStats = await Promise.all((usersData || []).map(async (user) => {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', user.id);

        if (ordersError) throw ordersError;

        const { data: addresses } = await supabase
          .from('addresses')
          .select('id, title, name, phone, city, district, neighborhood, full_address, is_default')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        const totalOrders = orders?.length || 0;
        const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        const userAddresses = addresses || [];
        const defaultAddress = userAddresses.find(addr => addr.is_default);

        return {
          ...user,
          total_orders: totalOrders,
          total_spent: totalSpent,
          addresses: userAddresses,
          default_address: defaultAddress
        };
      }));

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editingUser.name,
          email: editingUser.email,
          email_verified: editingUser.email_verified,
          phone_verified: editingUser.phone_verified
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(users.map(user =>
        user.id === editingUser.id ? editingUser : user
      ));
      alert('Kullanıcı başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Kullanıcı güncellenirken bir hata oluştu.');
    }
  }

  async function handleUpdatePassword() {
    if (!editingUser || !newPassword) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', editingUser.id);

      if (error) throw error;

      setNewPassword('');
      alert('Şifre başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Şifre güncellenirken bir hata oluştu.');
    }
  }

  async function handleAddressUpdate(address: Address) {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .update({
          title: address.title,
          name: address.name,
          phone: address.phone,
          city: address.city,
          district: address.district,
          neighborhood: address.neighborhood,
          full_address: address.full_address
        })
        .eq('id', address.id);

      if (error) throw error;

      await fetchUsers();
      setEditingAddress(null);
      setShowAddressForm(false);
      alert('Adres başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Adres güncellenirken bir hata oluştu.');
    }
  }

  async function handleSetDefaultAddress(addressId: string) {
    if (!editingUser) return;

    try {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', editingUser.id);

      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      await fetchUsers();
      alert('Varsayılan adres güncellendi.');
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Varsayılan adres güncellenirken bir hata oluştu.');
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!editingUser || !confirm('Bu adresi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      await fetchUsers();
      alert('Adres başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Adres silinirken bir hata oluştu.');
    }
  }

  function openUserModal(user: User) {
    setEditingUser(user);
    setModalTab('profile');
    setShowModal(true);
    setNewPassword('');
    setEditingAddress(null);
    setShowAddressForm(false);
  }

  function closeModal() {
    setShowModal(false);
    setEditingUser(null);
    setModalTab('profile');
    setNewPassword('');
    setEditingAddress(null);
    setShowAddressForm(false);
  }

  const filteredUsers = users.filter(user =>
    (user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-gray-600">Tüm kullanıcıları görüntüleyin ve yönetin</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1 w-full sm:max-w-lg">
          <Input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full placeholder:text-gray-400 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  İletişim
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Sipariş
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harcama
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {user.name || 'İsimsiz Kullanıcı'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {user.email || 'E-posta yok'}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden mt-1">
                        {user.default_address?.phone || 'Telefon yok'}
                      </div>
                      <div className="text-xs text-gray-500 sm:hidden mt-1">
                        {user.total_orders} sipariş
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-xs sm:text-sm text-gray-900">
                      {user.default_address?.phone || '-'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate max-w-xs">
                      {user.default_address ? 
                        `${user.default_address.neighborhood} Mah. ${user.default_address.district}/${user.default_address.city}` 
                        : '-'
                      }
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                    {user.total_orders} sipariş
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-indigo-600">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(user.total_spent)}
                    </div>
                    <div className="text-xs text-gray-500 lg:hidden mt-1">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                    <Button
                      onClick={() => openUserModal(user)}
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Detay</span>
                      <span className="sm:hidden">👤</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={closeModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
            </div>

            <div className="inline-block w-full max-w-4xl p-4 sm:p-6 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl sm:rounded-2xl">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900">
                    {editingUser.name}
                </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingUser.email}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border-b border-gray-200 mb-4 sm:mb-6">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                  <button
                    onClick={() => setModalTab('profile')}
                    className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                      modalTab === 'profile'
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📋 Profil
                  </button>
                  <button
                    onClick={() => setModalTab('addresses')}
                    className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                      modalTab === 'addresses'
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📍 <span className="hidden sm:inline">Adresler ({editingUser.addresses.length})</span><span className="sm:hidden">Adres</span>
                  </button>
                  <button
                    onClick={() => setModalTab('security')}
                    className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                      modalTab === 'security'
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    🔒 Güvenlik
                  </button>
                </nav>
              </div>

              {modalTab === 'profile' && (
                <form onSubmit={handleUpdateUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Ad Soyad"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                        label="E-posta"
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        required
                    className="w-full"
                  />
                </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="email_verified"
                        checked={editingUser.email_verified}
                        onChange={(e) => setEditingUser({ ...editingUser, email_verified: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="email_verified" className="ml-2 block text-sm text-gray-900">
                        E-posta doğrulanmış
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="phone_verified"
                        checked={editingUser.phone_verified}
                        onChange={(e) => setEditingUser({ ...editingUser, phone_verified: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="phone_verified" className="ml-2 block text-sm text-gray-900">
                        Telefon doğrulanmış
                      </label>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      📊 Kullanıcı İstatistikleri
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-indigo-600">{editingUser.total_orders}</div>
                        <div className="text-sm text-gray-500">Toplam Sipariş</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-green-600">
                          ₺{editingUser.total_spent.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-sm text-gray-500">Toplam Harcama</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-purple-600">{editingUser.addresses.length}</div>
                        <div className="text-sm text-gray-500">Kayıtlı Adres</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-lg font-bold text-gray-600">
                          {new Date(editingUser.created_at).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="text-sm text-gray-500">Kayıt Tarihi</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="submit">
                      Profil Bilgilerini Güncelle
                    </Button>
                  </div>
                </form>
              )}

              {modalTab === 'addresses' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900">Kullanıcı Adresleri</h4>
                  </div>

                  {editingUser.addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Henüz kayıtlı adres bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editingUser.addresses.map((address) => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-900">{address.title}</h5>
                              {address.is_default && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium text-indigo-800 bg-indigo-100 rounded-full">
                                  Varsayılan
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setEditingAddress(address);
                                  setShowAddressForm(true);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Düzenle
                              </Button>
                              {!address.is_default && (
                                <Button
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Varsayılan Yap
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDeleteAddress(address.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-900"
                              >
                                Sil
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Ad Soyad:</strong> {address.name}</p>
                            <p><strong>Telefon:</strong> {address.phone}</p>
                            <p><strong>Adres:</strong> {address.neighborhood} Mah. {address.district}/{address.city}</p>
                            <p>{address.full_address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddressForm && editingAddress && (
                    <div className="border-t pt-6">
                      <h5 className="text-lg font-medium text-gray-900 mb-4">Adres Düzenle</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Adres Başlığı"
                          value={editingAddress.title}
                          onChange={(e) => setEditingAddress({ ...editingAddress, title: e.target.value })}
                          required
                        />
                        <Input
                          label="Ad Soyad"
                          value={editingAddress.name}
                          onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                          required
                        />
                        <Input
                          label="Telefon"
                          value={editingAddress.phone}
                          onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                          required
                        />
                        <Input
                          label="İl"
                          value={editingAddress.city}
                          onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                          required
                        />
                        <Input
                          label="İlçe"
                          value={editingAddress.district}
                          onChange={(e) => setEditingAddress({ ...editingAddress, district: e.target.value })}
                          required
                        />
                        <Input
                          label="Mahalle"
                          value={editingAddress.neighborhood}
                          onChange={(e) => setEditingAddress({ ...editingAddress, neighborhood: e.target.value })}
                          required
                        />
                        <div className="md:col-span-2">
                  <Input
                            label="Açık Adres"
                            value={editingAddress.full_address}
                            onChange={(e) => setEditingAddress({ ...editingAddress, full_address: e.target.value })}
                            required
                  />
                </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                          }}
                  >
                    İptal
                  </Button>
                        <Button
                          onClick={() => handleAddressUpdate(editingAddress)}
                        >
                          Adresi Güncelle
                        </Button>
                      </div>
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

                  <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Hesap Durumu</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">E-posta Doğrulama Durumu</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          editingUser.email_verified 
                            ? 'text-green-800 bg-green-100' 
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {editingUser.email_verified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Telefon Doğrulama Durumu</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          editingUser.phone_verified 
                            ? 'text-green-800 bg-green-100' 
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {editingUser.phone_verified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
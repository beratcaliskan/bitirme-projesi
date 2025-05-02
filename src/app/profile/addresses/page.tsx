'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/lib/supabase';
import { AddressModal } from '@/components/profile/AddressModal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function AddressesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(undefined);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    full_name: '',
    phone: '',
    city: '',
    district: '',
    neighborhood: '',
    full_address: '',
    is_default: false
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      showToast('Adresler yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      // Remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      showToast('Varsayılan adres güncellendi.', 'success');
      fetchAddresses();
    } catch (error) {
      showToast('Bir hata oluştu.', 'error');
    }
  };

  const handleDelete = async (addressId: string) => {
    setAddressToDelete(addressId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!user || !addressToDelete) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressToDelete);

      if (error) throw error;

      showToast('Adres başarıyla silindi.', 'success');
      fetchAddresses();
    } catch (error) {
      showToast('Adres silinirken bir hata oluştu.', 'error');
    }
  };

  const handleEdit = async (address: Address) => {
    setFormData({
      title: address.title,
      full_name: address.full_name,
      phone: address.phone,
      city: address.city,
      district: address.district,
      neighborhood: address.neighborhood,
      full_address: address.full_address,
      is_default: address.is_default
    });
    setEditingAddressId(address.id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAddress(undefined);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Adreslerim</h1>
        <Button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Yeni Adres Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{address.title}</h3>
                {address.is_default && (
                  <span className="inline-flex px-3 py-1 text-sm font-medium text-indigo-800 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-full shadow-sm">
                    Varsayılan
                  </span>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(address)}
                >
                  Düzenle
                </Button>
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Varsayılan Yap
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                >
                  Sil
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-gray-600">
              <p>{address.full_name}</p>
              <p>{address.phone}</p>
              <p>
                {address.neighborhood} Mah. {address.district}/{address.city}
              </p>
              <p>{address.full_address}</p>
            </div>
          </div>
        ))}
      </div>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({
            title: '',
            full_name: '',
            phone: '',
            city: '',
            district: '',
            neighborhood: '',
            full_address: '',
            is_default: false
          });
          setEditingAddressId(null);
        }}
        userId={user?.id || ''}
        onSuccess={fetchAddresses}
        formData={formData}
        editingAddressId={editingAddressId}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Adresi Sil"
        message="Bu adresi silmek istediğinizden emin misiniz?"
      />
    </div>
  );
} 
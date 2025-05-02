'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/lib/supabase';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  formData?: {
    title: string;
    full_name: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    full_address: string;
    is_default: boolean;
  };
  editingAddressId?: string | null;
}

export function AddressModal({ isOpen, onClose, userId, onSuccess, formData, editingAddressId }: AddressModalProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    full_name: '',
    phone: '',
    city: '',
    district: '',
    neighborhood: '',
    full_address: '',
    is_default: false
  });

  useEffect(() => {
    if (formData) {
      setForm(formData);
    } else {
      // Formu sıfırla
      setForm({
        title: '',
        full_name: '',
        phone: '',
        city: '',
        district: '',
        neighborhood: '',
        full_address: '',
        is_default: false
      });
    }
  }, [formData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingAddressId) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(form)
          .eq('id', editingAddressId);

        if (error) throw error;
        showToast('Adres başarıyla güncellendi.', 'success');
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert([{ ...form, user_id: userId }]);

        if (error) throw error;
        showToast('Adres başarıyla eklendi.', 'success');
      }

      onSuccess();
      onClose();
    } catch (error) {
      showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg animate-slideIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingAddressId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Kapat</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Adres Başlığı"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ev, İş vb."
            className="text-gray-900"
            required
          />
          <Input
            label="Ad Soyad"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Ad Soyad"
            className="text-gray-900"
            required
          />
          <Input
            label="Telefon"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="05XX XXX XX XX"
            className="text-gray-900"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="İl"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="İl"
              className="text-gray-900"
              required
            />
            <Input
              label="İlçe"
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="İlçe"
              className="text-gray-900"
              required
            />
          </div>
          <Input
            label="Mahalle"
            name="neighborhood"
            value={form.neighborhood}
            onChange={handleChange}
            placeholder="Mahalle"
            className="text-gray-900"
            required
          />
          <Input
            label="Açık Adres"
            name="full_address"
            value={form.full_address}
            onChange={handleChange}
            placeholder="Sokak, Apartman No, Daire No"
            className="text-gray-900"
            required
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              checked={form.is_default}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
              Varsayılan adres olarak kaydet
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="ghost"
              onClick={onClose}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
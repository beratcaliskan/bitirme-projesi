'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase';


interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  formData?: {
    card_holder: string;
    card_number: string;
    expire_month: string;
    expire_year: string;
    cvv: string;
    is_default: boolean;
  };
  editingPaymentId?: string | null;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
  formData,
  editingPaymentId
}: PaymentMethodModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    card_holder: '',
    card_number: '',
    expire_month: '',
    expire_year: '',
    cvv: '',
    is_default: false
  });

  const formatCardNumber = (number: string) => {
    const digitsOnly = number.replace(/\D/g, '');
    return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  useEffect(() => {
    if (!isOpen) {
      setForm({
        card_holder: '',
        card_number: '',
        expire_month: '',
        expire_year: '',
        cvv: '',
        is_default: false
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData && editingPaymentId) {
      const formattedData = {
        ...formData,
        card_number: formatCardNumber(formData.card_number),
        expire_month: formData.expire_month ? formData.expire_month.toString().padStart(2, '0') : '',
        expire_year: formData.expire_year ? formData.expire_year.toString() : ''
      };
      setForm(formattedData);
    }
  }, [formData, editingPaymentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'card_number') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
      const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      setForm(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else if (name === 'cvv') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 3);
      setForm(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cardNumberDigits = form.card_number.replace(/\s/g, '');
      if (cardNumberDigits.length !== 16) {
        throw new Error('Kart numarası 16 haneli olmalıdır.');
      }

      if (form.cvv.length !== 3) {
        throw new Error('CVV 3 haneli olmalıdır.');
      }

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const expYear = parseInt(form.expire_year);
      const expMonth = parseInt(form.expire_month);

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        throw new Error('Geçersiz son kullanma tarihi.');
      }

      if (editingPaymentId) {
        const { error } = await supabase
          .from('payment_methods')
          .update({
            card_holder: form.card_holder,
            card_number: cardNumberDigits,
            expire_month: form.expire_month,
            expire_year: form.expire_year,
            cvv: form.cvv,
            is_default: form.is_default
          })
          .eq('id', editingPaymentId);

        if (error) throw error;
        toast({
          title: 'Başarılı',
          description: 'Kart başarıyla güncellendi.'
        });
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([{
            user_id: userId,
            card_holder: form.card_holder,
            card_number: cardNumberDigits,
            expire_month: form.expire_month,
            expire_year: form.expire_year,
            cvv: form.cvv,
            is_default: form.is_default
          }]);

        if (error) throw error;
        toast({
          title: 'Başarılı',
          description: 'Kart başarıyla eklendi.'
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Payment method error:', error);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      card_holder: '',
      card_number: '',
      expire_month: '',
      expire_year: '',
      cvv: '',
      is_default: false
    });
    onClose();
  };

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return month < 10 ? `0${month}` : `${month}`;
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg animate-slideIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingPaymentId ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}
          </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kart Üzerindeki İsim"
            name="card_holder"
            value={form.card_holder}
            onChange={handleChange}
            placeholder="Ad Soyad"
            className="text-gray-900"
            required
          />
          <Input
            label="Kart Numarası"
            name="card_number"
            value={form.card_number}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            className="text-gray-900"
            maxLength={19}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ay</label>
              <div className="relative">
                <select
                  name="expire_month"
                  value={form.expire_month || ''}
                  onChange={handleChange}
                  className="appearance-none block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white py-2 pl-3 pr-10 text-base"
                  required
                >
                  <option value="">Ay</option>
                  {months.map(month => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <svg className="h-4 w-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
              <div className="relative">
                <select
                  name="expire_year"
                  value={form.expire_year || ''}
                  onChange={handleChange}
                  className="appearance-none block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white py-2 pl-3 pr-10 text-base"
                  required
                >
                  <option value="">Yıl</option>
                  {years.map(month => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <svg className="h-4 w-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <Input
              label="CVV"
              name="cvv"
              value={form.cvv}
              onChange={handleChange}
              maxLength={3}
              placeholder="000"
              className="text-gray-900"
              required
            />
          </div>
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
              Varsayılan kart olarak kaydet
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="ghost"
              onClick={handleClose}
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
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase';
import type { Address, PaymentMethod } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateProfile } from '@/lib/utils/auth';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const router = useRouter();
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingFormData, setPendingFormData] = useState<typeof formData | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    fetchDefaultData();
  }, [user, authLoading]);

  const fetchAddresses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (!error && data) {
      setPaymentMethods(data);
    }
  };

  const fetchDefaultData = async () => {
    if (!user) return;
    
    try {
      // Fetch default address
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      setDefaultAddress(addressData);

      // Fetch default payment method
      const { data: paymentData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      setDefaultPaymentMethod(paymentData);
    } catch (error) {
      showToast('Bilgiler yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingFormData(formData);
    setIsSaveModalOpen(true);
  };

  const confirmProfileUpdate = async () => {
    if (!user || !pendingFormData) return;
    setIsLoading(true);

    try {
      await updateProfile(user.id, pendingFormData);
      showToast('Profil bilgileri başarıyla güncellendi.', 'success');
      setIsSaveModalOpen(false);
    } catch (error) {
      showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
      setIsLoading(false);
      setPendingFormData(null);
    }
  };

  const handleVerifyEmail = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', user.id);

      if (error) throw error;
      showToast('E-posta doğrulandı.', 'success');
    } catch (error) {
      showToast('Doğrulama işlemi başarısız oldu.', 'error');
    }
  };

  const handleVerifyPhone = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ phone_verified: true })
        .eq('id', user.id);

      if (error) throw error;
      showToast('Telefon numarası doğrulandı.', 'success');
    } catch (error) {
      showToast('Doğrulama işlemi başarısız oldu.', 'error');
    }
  };

  if (authLoading || loading) {
    return <div>Yükleniyor...</div>;
  }

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '';
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  return (
    <div className="space-y-8">
      {/* Kişisel Bilgiler Bölümü */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Kişisel Bilgiler</h2>
          <Button 
            variant="outline" 
            onClick={() => router.push('/profile/security')}
          >
            Güvenlik Ayarları
          </Button>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <Input
            label="Ad Soyad"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="text-gray-900"
          />
          <Input
            label="E-posta"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="text-gray-900"
          />
          <Input
            label="Telefon"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="text-gray-900"
          />
          <div className="flex justify-end items-center pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>

      {/* Adresler ve Ödeme Yöntemleri Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adresler */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Adreslerim</h2>
            <Button variant="outline" onClick={() => router.push('/profile/addresses')}>
              Tümünü Gör
            </Button>
          </div>
          {defaultAddress ? (
            <div className="space-y-4">
              <p className="inline-flex px-3 py-1 text-base font-medium text-indigo-800 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded shadow-sm">Varsayılan Adres</p>
              <div className="space-y-2 text-gray-900">
                <p className="font-medium">{defaultAddress.title}</p>
                <p>{defaultAddress.full_name}</p>
                <p>{defaultAddress.phone}</p>
                <p>
                  {defaultAddress.neighborhood} Mah. {defaultAddress.district}/{defaultAddress.city}
                </p>
                <p>{defaultAddress.full_address}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Henüz kayıtlı adresiniz bulunmuyor.</p>
              <Button variant="outline" onClick={() => router.push('/profile/addresses')}>
                Yeni Adres Ekle
              </Button>
            </div>
          )}
        </div>

        {/* Ödeme Yöntemleri */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Ödeme Yöntemlerim</h2>
            <Button variant="outline" onClick={() => router.push('/profile/payment-methods')}>
              Tümünü Gör
            </Button>
          </div>
          {defaultPaymentMethod ? (
            <div className="space-y-4">
              <p className="inline-flex px-3 py-1 text-base font-medium text-indigo-800 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded shadow-sm">Varsayılan Kart</p>
              <div className="space-y-2 text-gray-900">
                <p className="font-medium">{defaultPaymentMethod.card_holder}</p>
                <p>{maskCardNumber(defaultPaymentMethod.card_number)}</p>
                <p>Son Kullanma: {defaultPaymentMethod.expire_month}/{defaultPaymentMethod.expire_year}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Henüz kayıtlı ödeme yönteminiz bulunmuyor.</p>
              <Button variant="outline" onClick={() => router.push('/profile/payment-methods')}>
                Yeni Kart Ekle
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setPendingFormData(null);
        }}
        onConfirm={confirmProfileUpdate}
        title="Profil Bilgilerini Güncelle"
        message="Profil bilgilerinizi güncellemek istediğinizden emin misiniz?"
      />
    </div>
  );
} 
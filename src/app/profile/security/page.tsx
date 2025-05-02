'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export default function SecurityPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingPasswordData, setPendingPasswordData] = useState<typeof formData | null>(null);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('Yeni şifreler eşleşmiyor.', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      showToast('Yeni şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }

    setPendingPasswordData(formData);
    setIsPasswordModalOpen(true);
  };

  const confirmPasswordUpdate = async () => {
    if (!pendingPasswordData || !user) return;
    setIsLoading(true);

    try {
      // Önce mevcut şifreyi kontrol et
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single();

      if (fetchError || !userData) {
        throw new Error('Kullanıcı bilgileri alınamadı.');
      }

      // Mevcut şifreyi kontrol et
      if (userData.password !== pendingPasswordData.currentPassword) {
        showToast('Mevcut şifre yanlış.', 'error');
        setIsPasswordModalOpen(false);
        setPendingPasswordData(null);
        return;
      }

      // Yeni şifreyi güncelle
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: pendingPasswordData.newPassword })
        .eq('id', user.id);

      if (updateError) throw updateError;

      showToast('Şifre başarıyla güncellendi.', 'success');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error('Password update error:', error);
      showToast('Şifre güncellenirken bir hata oluştu.', 'error');
    } finally {
      setIsLoading(false);
      setPendingPasswordData(null);
    }
  };

  if (!user) {
    return <div className="text-center">Lütfen giriş yapın.</div>;
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Güvenlik Ayarları</h2>

      <div className="space-y-8">
        {/* Şifre Değiştirme */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Şifre Değiştir</h3>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Input
              label="Mevcut Şifre"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
            <Input
              label="Yeni Şifre"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
            <Input
              label="Yeni Şifre (Tekrar)"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </Button>
            </div>
          </form>
        </div>

        {/* İki Faktörlü Doğrulama */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">İki Faktörlü Doğrulama</h3>
          <p className="text-sm text-gray-600 mb-4">
            Hesabınızı daha güvenli hale getirmek için iki faktörlü doğrulamayı etkinleştirin.
          </p>
          <Button variant="outline">İki Faktörlü Doğrulamayı Etkinleştir</Button>
        </div>

        {/* Oturum Geçmişi */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Oturum Geçmişi</h3>
          <p className="text-sm text-gray-600 mb-4">
            Son oturum açma işlemlerinizi görüntüleyin ve şüpheli bir durum varsa güvenlik önlemi alın.
          </p>
          <Button variant="outline">Oturum Geçmişini Görüntüle</Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingPasswordData(null);
        }}
        onConfirm={confirmPasswordUpdate}
        title="Şifre Değiştir"
        message="Şifrenizi değiştirmek istediğinizden emin misiniz?"
      />
    </>
  );
} 
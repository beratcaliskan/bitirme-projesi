'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase';
import type { PaymentMethod } from '@/lib/supabase';
import { PaymentMethodModal } from '@/components/profile/payment-method-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    card_holder: '',
    card_number: '',
    expire_month: '',
    expire_year: '',
    cvv: '',
    is_default: false
  });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch {
      toast({
        title: 'Hata',
        description: 'Ödeme yöntemleri yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user, fetchPaymentMethods]);

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Varsayılan ödeme yöntemi güncellendi.'
      });
      fetchPaymentMethods();
    } catch {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    setPaymentMethodToDelete(paymentMethodId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!user || !paymentMethodToDelete) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodToDelete);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Ödeme yöntemi başarıyla silindi.'
      });
      fetchPaymentMethods();
    } catch {
      toast({
        title: 'Hata',
        description: 'Ödeme yöntemi silinirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = async (paymentMethod: PaymentMethod) => {
    setFormData({
      card_holder: paymentMethod.card_holder,
      card_number: paymentMethod.card_number,
      expire_month: paymentMethod.expire_month.toString(),
      expire_year: paymentMethod.expire_year.toString(),
      cvv: paymentMethod.cvv,
      is_default: paymentMethod.is_default
    });
    setEditingPaymentId(paymentMethod.id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '';
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ödeme Yöntemlerim</h1>
        <Button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Yeni Kart Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{method.card_holder}</h3>
                {method.is_default && (
                  <span className="inline-flex px-3 py-1 text-sm font-medium text-indigo-800 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-full shadow-sm">
                    Varsayılan
                  </span>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(method)}
                >
                  Düzenle
                </Button>
                {!method.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(method.id)}
                  >
                    Varsayılan Yap
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDelete(method.id)}
                >
                  Sil
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-gray-600">
              <p>{maskCardNumber(method.card_number)}</p>
              <p>Son Kullanma: {method.expire_month}/{method.expire_year}</p>
            </div>
          </div>
        ))}
      </div>

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user?.id || ''}
        onSuccess={fetchPaymentMethods}
        formData={formData}
        editingPaymentId={editingPaymentId}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Kartı Sil"
        message="Bu kartı silmek istediğinizden emin misiniz?"
      />
    </div>
  );
} 
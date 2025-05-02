'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser, logout, getCurrentUser } from '@/lib/utils/auth';
import type { AuthUser } from '@/lib/utils/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const user = await getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { user } = await loginUser({ email, password });
      setUser(user);
      await checkUser(); // Kullanıcı bilgilerini yeniden kontrol et
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Giriş yapılırken bir hata oluştu');
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const { user } = await registerUser({ email, password, name });
      setUser(user);
      await checkUser(); // Kullanıcı bilgilerini yeniden kontrol et
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Kayıt olurken bir hata oluştu');
    }
  }

  async function signOut() {
    try {
      await logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Çıkış yapılırken bir hata oluştu:', error);
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    checkUser
  };
} 
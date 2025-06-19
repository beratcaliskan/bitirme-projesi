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
    let mounted = true;

    const checkUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      const { user } = await loginUser({ email, password });
      setUser(user);
      await checkUser();
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      setLoading(true);
      const { user } = await registerUser({ email, password, name });
      setUser(user);
      await checkUser();
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Kayıt olurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      await logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Çıkış yapılırken bir hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }

  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    checkUser
  };
} 
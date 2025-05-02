import { supabase } from '../supabase';
import type { User } from '../supabase';
import Cookies from 'js-cookie';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthUser extends User {
  isAdmin?: boolean;
}

export async function loginUser({ email, password }: LoginCredentials) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !user) {
    throw new Error('Geçersiz email veya şifre');
  }

  // Admin kontrolü
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', user.email)
    .single();

  const authUser: AuthUser = {
    ...user,
    isAdmin: !!admin
  };

  // Set user session with admin status
  Cookies.set('user', JSON.stringify(authUser), { expires: 7 }); // 7 günlük cookie

  return { user: authUser };
}

export async function registerUser({ email, password, name }: RegisterData) {
  try {
    // Check if email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Bu email adresi zaten kullanımda');
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password,
          email_verified: false,
          phone_verified: false,
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error('Kullanıcı oluşturulamadı');
    }

    const authUser: AuthUser = {
      ...user,
      isAdmin: false
    };

    // Set user session
    Cookies.set('user', JSON.stringify(authUser), { expires: 7 });

    return { user: authUser };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Beklenmeyen bir hata oluştu');
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const userCookie = Cookies.get('user');
  if (!userCookie) return null;

  try {
    const savedUser = JSON.parse(userCookie) as AuthUser;
    
    // Veritabanından güncel kullanıcı bilgilerini al
    const { data: currentUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', savedUser.id)
      .single();

    if (!currentUser) {
      Cookies.remove('user');
      return null;
    }

    // Admin durumunu kontrol et
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', currentUser.email)
      .single();

    const authUser: AuthUser = {
      ...currentUser,
      isAdmin: !!admin
    };

    // Cookie'yi güncelle
    Cookies.set('user', JSON.stringify(authUser), { expires: 7 });

    return authUser;
  } catch {
    Cookies.remove('user');
    return null;
  }
}

export async function logout() {
  Cookies.remove('user');
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error('Profil güncellenirken bir hata oluştu');
  }

  // Update cookie if it exists
  const user = await getCurrentUser();
  if (user) {
    const authUser: AuthUser = {
      ...user,
      ...updates
    };
    Cookies.set('user', JSON.stringify(authUser), { expires: 7 });
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin || false;
} 
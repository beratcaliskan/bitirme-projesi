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
  adminRole?: string;
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

  const { data: admin } = await supabase
    .from('admins')
    .select('id, email, role')
    .eq('email', user.email)
    .single();

  if (admin) {
    try {
      const { error: updateError } = await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

      if (updateError) {
        console.error('Last login update error:', updateError);
      } else {
        console.log('Last login updated successfully for admin:', admin.email);
      }
    } catch (err) {
      console.error('Error updating last login:', err);
    }
  }

  const authUser: AuthUser = {
    ...user,
    isAdmin: !!admin,
    adminRole: admin?.role || null
  };

  Cookies.set('user', JSON.stringify(authUser), { expires: 7 });

  return { user: authUser };
}

export async function registerUser({ email, password, name }: RegisterData) {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Bu e-posta adresi zaten kullanımda');
    }
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
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', savedUser.id)
      .single();

    if (!currentUser) {
      Cookies.remove('user');
      return null;
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id, email, role, last_login')
      .eq('email', currentUser.email)
      .single();

    if (admin) {
      const lastLogin = admin.last_login ? new Date(admin.last_login) : null;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (!lastLogin || lastLogin < oneHourAgo) {
        try {
          const { error: updateError } = await supabase
            .from('admins')
            .update({ last_login: new Date().toISOString() })
            .eq('id', admin.id);

          if (updateError) {
            console.error('Last login periodic update error:', updateError);
          }
        } catch (err) {
          console.error('Error in periodic last login update:', err);
        }
      }
    }

    const authUser: AuthUser = {
      ...currentUser,
      isAdmin: !!admin,
      adminRole: admin?.role || null
    };

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
  if (updates.phone) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', updates.phone)
      .neq('id', userId)
      .single();

    if (existingUser) {
      throw new Error('Bu telefon numarası başka bir kullanıcı tarafından kullanılıyor');
    }
  }

  if (updates.email) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', updates.email)
      .neq('id', userId)
      .single();

    if (existingUser) {
      throw new Error('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor');
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error('Profil güncellenirken bir hata oluştu');
  }

  const user = await getCurrentUser();
  if (user) {
    const authUser: AuthUser = {
      ...user,
      ...updates
    };
    Cookies.set('user', JSON.stringify(authUser), { expires: 7 });
  }
}

export async function isAdmin(requiredRole?: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return false;
  
  if (requiredRole) {
    return user.adminRole === requiredRole;
  }
  
  return true;
} 
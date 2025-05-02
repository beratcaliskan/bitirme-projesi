'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast-provider';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  variants?: {
    color?: {
      id: string;
      name: string;
      code?: string;
    };
    size?: {
      id: string;
      name: string;
    };
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  colors: Array<{ id: string; name: string; code: string; }>;
  sizes: Array<{ id: string; name: string; }>;
  stock: Array<{ price: number; stock: number; size_id?: string; color_id?: string; }>;
}

interface DBCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: number;
  variants: {
    color?: {
      id: string;
      name: string;
      code?: string;
    };
    size?: {
      id: string;
      name: string;
    };
  };
  products: Product;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate total and item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Load cart items from appropriate source
  useEffect(() => {
    const loadCartItems = async () => {
      try {
        setIsLoading(true);
        
        // Always check localStorage first
        const storedItems = localStorage.getItem('cartItems');
        let localItems = storedItems ? JSON.parse(storedItems) : [];
        
        if (user) {
          // If user is logged in and has items in localStorage, merge them
          if (localItems.length > 0) {
            await syncToDatabase(localItems);
            localStorage.removeItem('cartItems');
            localItems = []; // Clear local items after merging
          }

          // Then load from database
          const { data: cartData, error: cartError } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          if (cartError && cartError.code !== 'PGRST116') {
            throw cartError;
          }

          if (cartData) {
            const { data: cartItems, error: itemsError } = await supabase
              .from('cart_items')
              .select('*')
              .eq('cart_id', cartData.id);

            if (itemsError) throw itemsError;

            if (cartItems) {
              setItems(cartItems.map(item => ({
                id: item.id,
                product_id: item.product_id,
                name: item.name || '',
                price: item.price,
                quantity: item.quantity,
                image_url: item.image_url || '',
                variants: item.variants
              })));
            }
          }
        } else {
          // If no user, just use localStorage items
          setItems(localItems);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        toast({
          title: 'Hata',
          description: 'Sepet yüklenirken bir hata oluştu.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCartItems();
  }, [user, toast]);

  // Senkronizasyon fonksiyonu
  const syncToDatabase = async (itemsToSync: CartItem[] = items) => {
    try {
      if (!user || itemsToSync.length === 0) return;

      console.log('Starting sync with items:', itemsToSync);

      // Get or create cart
      let { data: existingCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      let cartId;

      // Cart yoksa oluştur
      if (!existingCart) {
        const { data: newCart, error: cartError } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            status: 'active',
            total_amount: itemsToSync.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (cartError) throw cartError;
        cartId = newCart.id;
      } else {
        cartId = existingCart.id;
      }

      console.log('Using cart ID:', cartId);

      // Yeni items'ları ekle
      for (const item of itemsToSync) {
        const cartItem = {
          cart_id: cartId,
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url,
          variants: item.variants || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Önce mevcut item'ı kontrol et
        const { data: existingItem } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', cartId)
          .eq('product_id', item.product_id)
          .eq('variants', item.variants || {})
          .maybeSingle();

        if (existingItem) {
          // Update existing item
          await supabase
            .from('cart_items')
            .update({
              quantity: existingItem.quantity + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id);
        } else {
          // Insert new item
          await supabase
            .from('cart_items')
            .insert(cartItem);
        }
      }

      // Cart total'ı güncelle
      await supabase
        .from('carts')
        .update({
          total_amount: itemsToSync.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);

      setLastSync(new Date());
      console.log('Cart synced successfully at:', new Date().toISOString());

      // Reload items from database
      const { data: updatedItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);

      if (updatedItems) {
        setItems(updatedItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          name: item.name || '',
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url || '',
          variants: item.variants
        })));
      }

    } catch (error) {
      console.error('Cart sync error:', error);
      toast({
        title: 'Hata',
        description: 'Sepet senkronize edilirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  // Login olduğunda otomatik senkronizasyon
  useEffect(() => {
    if (user && items.length > 0) {
      syncToDatabase();
    }
  }, [user]);

  // Otomatik senkronizasyon için interval
  useEffect(() => {
    if (!user) return;

    // Her 5 dakikada bir senkronize et
    const syncInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastSync = now.getTime() - lastSync.getTime();
      
      // Son senkronizasyondan bu yana en az 5 dakika geçtiyse
      if (timeSinceLastSync >= 5 * 60 * 1000) {
        syncToDatabase();
      }
    }, 60 * 1000); // Her dakika kontrol et

    return () => clearInterval(syncInterval);
  }, [user, lastSync]);

  const addItem = async (newItem: Omit<CartItem, 'id'>) => {
    try {
      if (user) {
        // Get or create cart
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (cartError && cartError.code !== 'PGRST116') {
          throw cartError;
        }

        let cartId;
        if (!cartData) {
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert({ 
              user_id: user.id,
              status: 'active',
              total_amount: newItem.price * newItem.quantity
            })
            .select('id')
            .single();

          if (createError) throw createError;
          cartId = newCart.id;
        } else {
          cartId = cartData.id;
        }

        // Check if item already exists with same variants
        const { data: existingItem, error: findError } = await supabase
          .from('cart_items')
          .select('id, quantity, variants')
          .eq('cart_id', cartId)
          .eq('product_id', newItem.product_id)
          .eq('variants', newItem.variants || {})
          .single();

        if (findError && findError.code !== 'PGRST116') {
          throw findError;
        }

        if (existingItem) {
          // Update existing item
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ 
              quantity: existingItem.quantity + newItem.quantity
            })
            .eq('id', existingItem.id);

          if (updateError) throw updateError;

          setItems(prev => prev.map(item => 
            item.id === existingItem.id 
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          ));
        } else {
          // Add new item
          const { data: added, error: addError } = await supabase
            .from('cart_items')
            .insert({
              cart_id: cartId,
              product_id: newItem.product_id,
              name: newItem.name,
              price: newItem.price,
              quantity: newItem.quantity,
              image_url: newItem.image_url,
              variants: newItem.variants || {}
            })
            .select()
            .single();

          if (addError) throw addError;

          if (added) {
            setItems(prev => [...prev, {
              id: added.id,
              product_id: added.product_id,
              name: added.name,
              price: added.price,
              quantity: added.quantity,
              image_url: added.image_url,
              variants: added.variants
            }]);
          }
        }
      } else {
        // Handle local storage
        const existingItemIndex = items.findIndex(item => 
          item.product_id === newItem.product_id &&
          JSON.stringify(item.variants || {}) === JSON.stringify(newItem.variants || {})
        );

        if (existingItemIndex > -1) {
          // Update existing item
          setItems(prev => prev.map((item, index) => 
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          ));
        } else {
          // Add new item
          const id = Math.random().toString(36).substr(2, 9);
          setItems(prev => [...prev, { ...newItem, id }]);
        }

        // Save to localStorage
        localStorage.setItem('cartItems', JSON.stringify(items));
      }

      toast({
        title: 'Başarılı',
        description: 'Ürün sepete eklendi.'
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast({
        title: 'Hata',
        description: 'Ürün sepete eklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      if (user) {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);

        if (deleteError) throw deleteError;
      }
      
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item from cart:', error);
      toast({
        title: 'Hata',
        description: 'Ürün sepetten silinirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity < 1) {
        await removeItem(itemId);
        return;
      }

      if (user) {
        // Get cart_id first
        const { data: cartItem, error: findError } = await supabase
          .from('cart_items')
          .select('cart_id')
          .eq('id', itemId)
          .single();

        if (findError) throw findError;

        const { data: updatedItem, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId)
          .select(`
            id,
            cart_id,
            product_id,
            quantity,
            price,
            variants,
            products (
              id,
              name,
              image_url,
              colors,
              sizes,
              stock
            )
          `)
          .single();

        if (updateError) throw updateError;

        if (updatedItem) {
          await syncToDatabase([updatedItem as unknown as CartItem]);
          const item = updatedItem as unknown as DBCartItem;
          setItems(prev => prev.map(i => 
            i.id === itemId ? {
              id: item.id,
              product_id: item.product_id,
              name: item.products.name,
              price: item.price,
              quantity: item.quantity,
              image_url: item.products.image_url || '',
              variants: item.variants
            } : i
          ));
        }
      } else {
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        ));
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast({
        title: 'Hata',
        description: 'Ürün miktarı güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        const { data: cartData } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (cartData) {
          const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartData.id);

          if (deleteError) throw deleteError;
        }
      }
      
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Hata',
        description: 'Sepet temizlenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isLoading,
        itemCount,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 
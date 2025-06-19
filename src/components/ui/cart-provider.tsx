'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast-provider';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  variants: string;
  created_at?: string;
  updated_at?: string;
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
  syncWithSupabase: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);





export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const retryCountRef = useRef(0);
  const isUpdatingRef = useRef(false);
  const MAX_RETRY_COUNT = 3;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const saveToLocalStorage = useCallback((cartItems: CartItem[]) => {
    try {
      const formattedItems = cartItems.map(item => {
        let variantsObj;
        try {
          variantsObj = typeof item.variants === 'string' 
            ? JSON.parse(item.variants) 
            : item.variants || {};
        } catch (e) {
          console.error('Variants parsing error in saveToLocalStorage:', e);
          variantsObj = {};
        }
        
        return {
          ...item,
          variants: variantsObj
        };
      });
      
      localStorage.setItem('cartItems', JSON.stringify(formattedItems));
      localStorage.setItem('lastCartUpdate', new Date().toISOString());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  const syncWithSupabase = useCallback(async (force: boolean = false) => {
    if (!user || (isSyncing && !force) || isUpdatingRef.current) return;

    try {
      setIsSyncing(true);
      isUpdatingRef.current = true;
      console.log('1. Senkronizasyon başladı');

      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            status: 'active',
            total_amount: total,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (!newCart) {
          throw new Error('Cart oluşturulamadı');
        }
        cart = newCart;
      }

      const cartId = cart.id;
      console.log('2. Cart işlemleri tamamlandı');

      if (items.length > 0) {
        console.log('3. Cart items güncelleniyor');
        const now = new Date().toISOString();
        
        const { data: existingItems } = await supabase
          .from('cart_items')
          .select('id, product_id, variants')
          .eq('cart_id', cartId);
        
        const existingItemsMap = new Map();
        
        if (existingItems && existingItems.length > 0) {
          existingItems.forEach(item => {
            let variantsObj;
            try {
              variantsObj = typeof item.variants === 'string' 
                ? JSON.parse(item.variants) 
                : item.variants || {};
            } catch (e) {
              console.error('Error parsing variants:', e);
              variantsObj = {};
            }
              
            existingItemsMap.set(`${item.product_id}-${JSON.stringify(variantsObj)}`, item.id);
          });
        }
        
        console.log('4. Mevcut ürünler alındı, toplam:', existingItemsMap.size);
        
        const updatedIds = new Set();
        
        for (const item of items) {
          let variantsObj;
          try {
            variantsObj = typeof item.variants === 'string'
              ? JSON.parse(item.variants)
              : item.variants || {};
          } catch (e) {
            console.error('Error parsing item variants:', e);
            variantsObj = {};
          }
          
          const itemKey = `${item.product_id}-${JSON.stringify(variantsObj)}`;
          const existingItemId = existingItemsMap.get(itemKey);
          
          if (existingItemId) {
            console.log('5. Mevcut ürün güncelleniyor:', existingItemId);
            await supabase
              .from('cart_items')
              .update({
                quantity: item.quantity,
                price: item.price,
                updated_at: now
              })
              .eq('id', existingItemId);
            
            updatedIds.add(existingItemId);
          } else {
            console.log('5. Yeni ürün ekleniyor:', item.product_id);
            const cartItem = {
              cart_id: cartId,
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image_url: item.image_url || null,
              variants: variantsObj,
              created_at: now,
              updated_at: now
            };
            
            const { data: newItem } = await supabase
              .from('cart_items')
              .insert(cartItem)
              .select('id')
              .single();
              
            if (newItem) {
              updatedIds.add(newItem.id);
            }
          }
        }
        
        if (force && existingItems && existingItems.length > 0) {
          const itemsToDelete = existingItems.filter(item => !updatedIds.has(item.id));
          
          if (itemsToDelete.length > 0) {
            console.log('6. Artık sepette olmayan ürünler siliniyor:', itemsToDelete.length);
            const itemIdsToDelete = itemsToDelete.map(item => item.id);
            
            await supabase
              .from('cart_items')
              .delete()
              .in('id', itemIdsToDelete);
          }
        }

        await supabase
          .from('carts')
          .update({
            total_amount: total,
            updated_at: now
          })
          .eq('id', cartId);

        console.log('7. Cart items güncelleme tamamlandı');
      } else if (items.length === 0 && force) {
        console.log('3. Sepet boş ve force=true, items siliniyor');
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId);
      }


      localStorage.setItem('lastCartUpdate', new Date().toISOString());
      console.log('8. Senkronizasyon tamamlandı');

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 2000);

    } catch (error) {
      console.error('Hata:', error);
      retryCountRef.current += 1;

      if (retryCountRef.current < MAX_RETRY_COUNT) {
        setTimeout(() => syncWithSupabase(force), 2000); 
      } else {
        toast({
          title: 'Hata',
          description: 'Sepet senkronizasyonu başarısız oldu.',
          variant: 'destructive'
        });
      }
      isUpdatingRef.current = false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, items, total, isSyncing, toast]);

  useEffect(() => {
    const loadCartItems = async () => {
      try {
        setIsLoading(true);
        
        console.log('1. Lokal depodan sepet öğeleri yükleniyor');
        const storedItems = localStorage.getItem('cartItems');
        let localItems = [];
        
        if (storedItems) {
          localItems = JSON.parse(storedItems);
          setItems(localItems);
          console.log('2. Lokal sepet öğeleri yüklendi:', localItems.length);
        }
        
        if (user && (!localItems || localItems.length === 0)) {
          console.log('3. Kullanıcı giriş yapmış ve lokal sepet boş, veritabanı kontrolü yapılıyor');
          
          const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          if (cart) {
            const { data: cartItems } = await supabase
              .from('cart_items')
              .select('id, product_id, name, price, quantity, image_url, variants')
              .eq('cart_id', cart.id);

            if (cartItems && cartItems.length > 0) {
              console.log('4. Veritabanından sepet öğeleri alındı:', cartItems.length);
              
              const formattedItems = cartItems.map(item => {
                let variantsObj;
                try {
                  variantsObj = typeof item.variants === 'string'
                    ? JSON.parse(item.variants)
                    : item.variants || {};
                } catch (e) {
                  console.error('Error parsing variants in loadCartItems:', e);
                  variantsObj = {};
                }
                
                return {
                id: item.id,
                product_id: item.product_id,
                  name: item.name,
                price: item.price,
                quantity: item.quantity,
                  image_url: item.image_url,
                  variants: variantsObj
                };
              });
              
              setItems(formattedItems);
              
              saveToLocalStorage(formattedItems);
              console.log('5. Veritabanından alınan sepet öğeleri yüklendi ve localStorage güncellendi');
        }
          }
        } 
      } catch (error) {
        console.error('Error loading cart:', error);
        toast({
          title: 'Hata',
          description: 'Sepet yüklenirken bir hata oluştu.',
          variant: 'destructive'
        });
        
        const storedItems = localStorage.getItem('cartItems');
        if (storedItems) {
          setItems(JSON.parse(storedItems));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCartItems();
  }, [user, saveToLocalStorage, toast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, syncWithSupabase]);

  const addItem = async (newItem: Omit<CartItem, 'id'>) => {
    try {
      if (isUpdatingRef.current) {
        console.log('Bir ekleme işlemi zaten devam ediyor, lütfen bekleyin.');
        toast({
          title: 'Bilgi',
          description: 'Bir ekleme işlemi zaten devam ediyor, lütfen bekleyin.'
        });
        return;
      }
      
      isUpdatingRef.current = true;
      console.log('1. Ürün ekleme başladı:', newItem);
      
      let variantsObj;
      try {
        variantsObj = typeof newItem.variants === 'string' 
          ? JSON.parse(newItem.variants)
          : newItem.variants || {};
      } catch (e) {
        console.error('Variants parsing error:', e);
        variantsObj = {};
      }

      console.log('2. Mevcut ürün kontrolü yapılıyor');
      const existingItemIndex = items.findIndex(item => {
        let itemVariantsObj;
        try {
          itemVariantsObj = typeof item.variants === 'string'
            ? JSON.parse(item.variants)
            : item.variants || {};
        } catch (e) {
          console.error('Item variants parsing error:', e);
          itemVariantsObj = {};
        }

        return item.product_id === newItem.product_id &&
          JSON.stringify(itemVariantsObj) === JSON.stringify(variantsObj);
      });

      let updatedItems: CartItem[];
      let addedOrUpdatedItem: CartItem | null = null;
      
      if (existingItemIndex > -1) {
        console.log('3. Mevcut ürün güncelleniyor:', existingItemIndex);
        updatedItems = items.map((item, index) => {
          if (index === existingItemIndex) {
            const updatedItem = { 
              ...item, 
              quantity: item.quantity + newItem.quantity,
              variants: variantsObj 
            };
            addedOrUpdatedItem = updatedItem;
            return updatedItem;
          }
          return item;
        });
      } else {
        console.log('3. Yeni ürün ekleniyor');
        const tempId = Math.random().toString(36).substr(2, 9);
        const newCartItem = { 
          ...newItem, 
          id: tempId,
          variants: variantsObj
        };
        addedOrUpdatedItem = newCartItem;
        updatedItems = [...items, newCartItem];
      }

      console.log('4. State ve localStorage güncelleniyor');
      setItems(updatedItems);
      saveToLocalStorage(updatedItems);

      if (user && addedOrUpdatedItem) {
        await updateSingleItem(addedOrUpdatedItem);
      }

      console.log('5. Ürün ekleme tamamlandı');
      toast({
        title: 'Başarılı',
        description: existingItemIndex > -1 ? 'Ürün miktarı güncellendi.' : 'Ürün sepete eklendi.'
      });
    } catch (error) {
      console.error('6. Ürün ekleme hatası:', error);
      toast({
        title: 'Hata',
        description: 'Ürün sepete eklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 500);
    }
  };

  const updateSingleItem = async (item: CartItem) => {
    if (!user || isSyncing) return;
    
    try {
      console.log('Tek ürün güncelleniyor:', item.product_id);

      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            status: 'active',
            total_amount: total,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (!newCart) {
          throw new Error('Cart oluşturulamadı');
        }
        cart = newCart;
      }

      const cartId = cart.id;
      const now = new Date().toISOString();

      let variantsObj;
      try {
        variantsObj = typeof item.variants === 'string' 
          ? JSON.parse(item.variants) 
          : item.variants || {};
      } catch (e) {
        console.error('Variants parsing error in updateSingleItem:', e);
        variantsObj = {};
      }
      
      const { data: existingItems } = await supabase
          .from('cart_items')
        .select('id, product_id, variants')
          .eq('cart_id', cartId)
        .eq('product_id', item.product_id);
        
      let foundItem = null;
      
      if (existingItems && existingItems.length > 0) {
        foundItem = existingItems.find(existing => {
          let existingVariantsObj;
          try {
            existingVariantsObj = typeof existing.variants === 'string'
              ? JSON.parse(existing.variants)
              : existing.variants || {};
          } catch (e) {
            console.error('Existing variants parsing error:', e);
            existingVariantsObj = {};
          }
            
          return compareVariants(existingVariantsObj, variantsObj);
        });
      }
      
      if (foundItem) {
        console.log('Mevcut cart_item güncelleniyor:', foundItem.id);
          await supabase
            .from('cart_items')
            .update({
            quantity: item.quantity,
            price: item.price,
            variants: variantsObj,
            updated_at: now
            })
          .eq('id', foundItem.id);
        } else {
        console.log('Yeni cart_item ekleniyor');
          await supabase
            .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.image_url || null,
            variants: variantsObj,
            created_at: now,
            updated_at: now
          });
      }

      await supabase
        .from('carts')
        .update({
          total_amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          updated_at: now
        })
        .eq('id', cartId);

      console.log('Tek ürün güncelleme tamamlandı');
    } catch (error) {
      console.error('Tek ürün güncelleme hatası:', error);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1000);
    }
  };

  const compareVariants = (obj1: unknown, obj2: unknown): boolean => {
    if (!obj1 && !obj2) return true;
    if (!obj1 || !obj2) return false;

    const obj1Record = obj1 as Record<string, unknown>;
    const obj2Record = obj2 as Record<string, unknown>;

    const keys1 = Object.keys(obj1Record);
    const keys2 = Object.keys(obj2Record);

    if (keys1.length !== keys2.length) return false;
      
    for (const key of keys1) {
      if (typeof obj1Record[key] === 'object' && typeof obj2Record[key] === 'object') {
        if (!compareVariants(obj1Record[key], obj2Record[key])) return false;
      } 
      else if (obj1Record[key] !== obj2Record[key]) {
        return false;
      }
    }
    
    return true;
  };

  const removeItem = async (itemId: string) => {
    try {
      console.log('1. Ürün silme başladı:', itemId);
      
      const itemToRemove = items.find(item => item.id === itemId);
      if (!itemToRemove) {
        console.error('Silinecek ürün bulunamadı:', itemId);
        return;
      }
      
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      saveToLocalStorage(updatedItems);

      if (user) {
        const { data: cart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (cart) {
          let variantsObj;
          try {
            variantsObj = typeof itemToRemove.variants === 'string' 
              ? JSON.parse(itemToRemove.variants) 
              : itemToRemove.variants || {};
          } catch (e) {
            console.error('Variants parsing error in removeItem:', e);
            variantsObj = {};
          }

          const { data: existingItems } = await supabase
            .from('cart_items')
            .select('id, product_id, variants')
            .eq('cart_id', cart.id)
            .eq('product_id', itemToRemove.product_id);

          if (existingItems && existingItems.length > 0) {
            const itemToDelete = existingItems.find(existing => {
              let existingVariantsObj;
              try {
                existingVariantsObj = typeof existing.variants === 'string'
                  ? JSON.parse(existing.variants)
                  : existing.variants || {};
              } catch (e) {
                console.error('Existing variants parsing error in removeItem:', e);
                existingVariantsObj = {};
              }
              
              return compareVariants(existingVariantsObj, variantsObj);
            });

            if (itemToDelete) {
              console.log('2. Supabase\'den ürün siliniyor:', itemToDelete.id);
          await supabase
            .from('cart_items')
            .delete()
                .eq('id', itemToDelete.id);
            } else {
              console.log('2. Silinecek ürün Supabase\'de bulunamadı');
            }
          }

          await supabase
            .from('carts')
            .update({ 
              total_amount: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              updated_at: new Date().toISOString()
            })
            .eq('id', cart.id);
        }
      }
      
      console.log('3. Ürün silme tamamlandı');
      toast({
        title: 'Başarılı',
        description: 'Ürün sepetten kaldırıldı.'
      });
    } catch (error) {
      console.error('Hata:', error);
      toast({
        title: 'Hata',
        description: 'Ürün sepetten kaldırılırken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );

    setItems(updatedItems);
    saveToLocalStorage(updatedItems);

      if (user) {
      await syncWithSupabase(true);
    }
  };

  const clearCart = async () => {
    setItems([]);
    saveToLocalStorage([]);
    
    if (user) {
    try {
        const { data: cart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (cart) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cart.id);

          await supabase
            .from('carts')
            .update({ 
              total_amount: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', cart.id);
        }
      } catch (error) {
        console.error('Error clearing cart in Supabase:', error);
      }
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
        total,
        syncWithSupabase: () => syncWithSupabase(true)
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
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatPrice } from '@/lib/utils/format';
import { useCart } from '@/components/ui/cart-provider';

interface CartDebugInfo {
  cart: any;
  cartItems: any[];
  localStorage: any;
}

export default function CartDebugPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [debugInfo, setDebugInfo] = useState<CartDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    console.log('Current user state:', user); // Debug log
    loadDebugInfo();
  }, [user]);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const debugData: CartDebugInfo = {
        cart: null,
        cartItems: [],
        localStorage: null
      };

      // Get localStorage data
      const localStorageCart = localStorage.getItem('cartItems');
      debugData.localStorage = localStorageCart ? JSON.parse(localStorageCart) : null;

      if (user?.id) {
        console.log('Fetching cart for user:', user.id); // Debug log

        // Get cart data with explicit columns
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('id, user_id, status, total_amount, created_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (cartError) {
          console.error('Cart fetch error:', cartError);
          throw cartError;
        }

        debugData.cart = cartData;

        if (cartData?.id) {
          console.log('Fetching items for cart:', cartData.id); // Debug log

          // Get cart items with explicit columns
          const { data: cartItems, error: itemsError } = await supabase
            .from('cart_items')
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
                image_url
              )
            `)
            .eq('cart_id', cartData.id);

          if (itemsError) {
            console.error('Cart items fetch error:', itemsError);
            throw itemsError;
          }

          debugData.cartItems = cartItems || [];
        }
      }

      setDebugInfo(debugData);
    } catch (err) {
      console.error('Debug info loading error:', err);
      setError(err instanceof Error ? err.message : 'Veri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('cartItems');
    loadDebugInfo();
  };

  const deleteCart = async () => {
    try {
      if (!debugInfo?.cart?.id) return;

      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('id', debugInfo.cart.id);

      if (error) throw error;
      
      await loadDebugInfo();
    } catch (err) {
      console.error('Delete cart error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const syncToDatabase = async () => {
    try {
      if (!user) {
        setError('Veritabanına aktarmak için giriş yapmalısınız!');
        return;
      }

      setSyncing(true);
      setError(null);

      const localStorageCart = localStorage.getItem('cartItems');
      if (!localStorageCart) {
        setError('LocalStorage\'da aktarılacak ürün yok!');
        return;
      }

      const localItems = JSON.parse(localStorageCart);
      if (!localItems.length) {
        setError('LocalStorage\'da aktarılacak ürün yok!');
        return;
      }

      console.log('Starting sync with items:', localItems);

      // Direkt yeni cart oluştur
      console.log('Creating new cart for user:', user.id);
      const { data: newCart, error: cartError } = await supabase
        .from('carts')
        .insert({
          user_id: user.id,
          status: 'active',
          total_amount: localItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (cartError) {
        console.error('Cart creation error:', cartError);
        throw cartError;
      }

      if (!newCart) {
        throw new Error('Cart oluşturulamadı');
      }

      console.log('Created cart with ID:', newCart.id);

      // Cart items'ları ekle
      for (const item of localItems) {
        console.log('Adding item to cart:', item);
        
        const cartItem = {
          cart_id: newCart.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          variants: item.variants || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: itemError } = await supabase
          .from('cart_items')
          .insert(cartItem);

        if (itemError) {
          console.error('Error adding item:', itemError);
          throw itemError;
        }
      }

      // Clear localStorage after successful sync
      localStorage.removeItem('cartItems');
      await loadDebugInfo();

      // Show success message
      setError('Ürünler başarıyla veritabanına aktarıldı!');
    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : 'Aktarım sırasında bir hata oluştu');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Cart Debug</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Cart Debug</h1>
          <div className="space-x-4">
            <button
              onClick={loadDebugInfo}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={syncToDatabase}
              disabled={syncing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? 'Syncing...' : 'Sync to Database'}
            </button>
            <button
              onClick={clearLocalStorage}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Clear LocalStorage
            </button>
            <button
              onClick={deleteCart}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Cart
            </button>
          </div>
        </div>

        {error && (
          <div className={`mb-8 p-4 border rounded ${
            error.includes('başarıyla') 
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Info</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify({ 
                id: user?.id, 
                email: user?.email,
                session: user ? 'Active' : 'Not Active' 
              }, null, 2)}
            </pre>
          </div>

          {/* LocalStorage */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LocalStorage Cart</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo?.localStorage, null, 2)}
            </pre>
          </div>

          {/* Database Cart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Cart</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo?.cart, null, 2)}
            </pre>
          </div>

          {/* Cart Items */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
            {debugInfo?.cartItems && debugInfo.cartItems.length > 0 ? (
              <div className="space-y-4">
                {debugInfo.cartItems.map((item) => (
                  <div key={item.id} className="border-b pb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{item.products.name}</span>
                      <span>{formatPrice(item.price)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Quantity: {item.quantity}</div>
                      <div>Variants: {JSON.stringify(item.variants)}</div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 font-semibold">
                  Total: {formatPrice(debugInfo?.cart?.total_amount || 0)}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No items in cart</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
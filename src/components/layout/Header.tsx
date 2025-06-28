'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart } from '@/components/ui/cart-provider';
import { capitalizeFirstLetter } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { items, itemCount, total, removeItem } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user) {
      setUserName(user.name);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 text-xl font-bold text-gray-900">
          Alzoon
          </Link>
        </div>
        
        <div className="hidden lg:flex gap-6 items-center">
          <Link href="/products" className="text-sm font-semibold text-gray-900 hover:text-gray-700">
            Ürünler
          </Link>
          <div className="relative" ref={cartRef}>
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={`flex items-center ${isCartOpen ? 'text-indigo-600' : 'text-gray-900 hover:text-gray-700'}`}
            >
              <ShoppingCart id='cart' className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {isCartOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-lg py-4 bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Sepetim</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-gray-500">Sepetiniz boş</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {items.map((item) => {
                        let variantItems = [];
                        try {
                          const parsed = typeof item.variants === 'string' 
                            ? JSON.parse(item.variants || '[]') 
                            : item.variants || [];
                          
                          variantItems = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                          console.error('Error parsing variants:', e);
                        }

                        const colorVariant = variantItems.find(v => v.code); 
                        const sizeVariant = variantItems.find(v => !v.code && v.name);
                        
                        return (
                        <div key={item.id} className="flex items-center gap-4 p-4">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Görsel yok</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h4>
                            {(colorVariant || sizeVariant) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <p className="flex items-center gap-1">
                                    {colorVariant && (
                                      <>
                                        <span className="font-medium">{colorVariant.name}</span>
                                        {colorVariant.code && (
                                          <span 
                                            className="inline-block w-3 h-3 rounded-full border"
                                            style={{ backgroundColor: colorVariant.code }}
                                          />
                                        )}
                                      </>
                                    )}
                                    {colorVariant && sizeVariant && <span> - </span>}
                                    {sizeVariant && (
                                      <span className="font-medium">{sizeVariant.name}</span>
                                    )}
                                  </p>
                                </div>
                              )}
                            <p className="mt-1 text-sm text-gray-500">
                              {item.quantity} adet
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-900 mb-3">
                      <span>Toplam</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Desktop cart button clicked, navigating to /cart');
                        
                        setTimeout(() => {
                          setIsCartOpen(false);
                          router.push('/cart');
                        }, 100);
                      }}
                      className={cn(
                        "flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md",
                        "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      )}
                    >
                      Sepete Git
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer"
              >
                {capitalizeFirstLetter(userName)}
                <svg
                  className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-40">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profilim
                  </Link>
                  <Link
                    href="/profile/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Siparişlerim
                  </Link>
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        Admin Paneli
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      signOut();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="default" size="sm">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/register">
                <Button variant='default' size="sm">Kayıt Ol</Button>
              </Link>
            </>
          )}
        </div>

        <div className="lg:hidden flex items-center gap-3">
          <div className="relative" ref={cartRef}>
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={`flex items-center ${isCartOpen ? 'text-indigo-600' : 'text-gray-900 hover:text-gray-700'}`}
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {isCartOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg py-4 bg-white ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Sepetim</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-gray-500">Sepetiniz boş</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {items.map((item) => {
                        let variantItems = [];
                        try {
                          const parsed = typeof item.variants === 'string' 
                            ? JSON.parse(item.variants || '[]') 
                            : item.variants || [];
                          
                          variantItems = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                          console.error('Error parsing variants:', e);
                        }

                        const colorVariant = variantItems.find(v => v.code);
                        const sizeVariant = variantItems.find(v => !v.code && v.name); 
                        
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3">
                            <div className="relative w-12 h-12 flex-shrink-0">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  fill
                                  className="object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">Görsel yok</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </h4>
                              {(colorVariant || sizeVariant) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <p className="flex items-center gap-1">
                                    {colorVariant && (
                                      <>
                                        <span className="font-medium">{colorVariant.name}</span>
                                        {colorVariant.code && (
                                          <span 
                                            className="inline-block w-2 h-2 rounded-full border"
                                            style={{ backgroundColor: colorVariant.code }}
                                          />
                                        )}
                                      </>
                                    )}
                                    {colorVariant && sizeVariant && <span> - </span>}
                                    {sizeVariant && (
                                      <span className="font-medium">{sizeVariant.name}</span>
                                    )}
                                  </p>
                                </div>
                              )}
                              <p className="mt-1 text-xs text-gray-500">
                                {item.quantity} adet
                              </p>
                              <p className="mt-1 text-sm font-medium text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-900 mb-3">
                      <span>Toplam</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                                         <button
                       onMouseDown={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         console.log('Mobile cart button clicked, navigating to /cart');
                         
                         setTimeout(() => {
                           setIsCartOpen(false);
                           router.push('/cart');
                         }, 100);
                       }}
                      className={cn(
                        "flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md",
                        "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      )}
                    >
                      Sepete Git
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span className="sr-only">{isMobileMenuOpen ? 'Menüyü kapat' : 'Ana menüyü aç'}</span>
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link
              href="/products"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Ürünler
            </Link>

            {user ? (
              <>
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="flex items-center px-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-700">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{capitalizeFirstLetter(userName)}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      href="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profilim
                    </Link>
                    <Link
                      href="/profile/orders"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Siparişlerim
                    </Link>
                    {user?.isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin Paneli
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 pt-4 pb-3 space-y-2">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 
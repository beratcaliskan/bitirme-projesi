import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllProducts } from '@/lib/utils/products';
import { ProductCard } from '@/components/products/ProductCard';
import { ScrollButton } from '@/components/home/ScrollButton';
import { Product } from '@/types/product';

export default async function HomePage() {
  let products: Product[] = [];
  let hasError = false;

  try {
    products = await getAllProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    hasError = true;
  }

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen">
      <div className="scroll-smooth">
        <section className="w-full flex flex-col justify-center relative isolate" style={{ height: 'calc(100vh - 4rem)' }}>
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
                Modern E-Ticaret Deneyimi
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-6 sm:leading-8 text-gray-800 font-medium px-4 sm:px-0">
                En yeni ürünleri keşfedin ve güvenli alışveriş deneyiminin tadını çıkarın.
                Hemen alışverişe başlayın!
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
                <ScrollButton />
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Hesap Oluştur
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce bg-white/50 rounded-full p-2 backdrop-blur-sm">
            <ScrollButton variant="arrow" />
          </div>
        </section>
        <section id="featured-products" className="min-h-screen w-full bg-white/80 backdrop-blur-sm py-12 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                Öne Çıkan Ürünler
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-800 font-medium px-4 sm:px-0">
                En popüler ve en yeni ürünlerimizi keşfedin
              </p>
            </div>

            {hasError ? (
              <div className="mt-8 sm:mt-12 text-center">
                <div className="mx-auto max-w-md">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Bağlantı Sorunu
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Ürünler şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/">
                    <Button variant="outline" size="lg">
                      Sayfayı Yenile
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 lg:gap-x-8 xl:gap-x-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {featuredProducts.length > 0 && (
                  <div className="mt-8 sm:mt-12 text-center px-4 sm:px-0">
                <Link href="/products">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Tüm Ürünleri Gör
                  </Button>
                </Link>
              </div>
            )}

                {featuredProducts.length === 0 && !hasError && (
                  <p className="mt-8 sm:mt-12 text-center text-gray-500 px-4 sm:px-0">
                Henüz ürün bulunmamaktadır.
              </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

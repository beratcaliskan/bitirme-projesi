import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllProducts } from '@/lib/utils/products';
import { ProductCard } from '@/components/products/ProductCard';
import { ScrollButton } from '@/components/home/ScrollButton';

export default async function HomePage() {
  const products = await getAllProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen">
      <div className="scroll-smooth">
        {/* Hero Section - Birinci Sayfa */}
        <section className="min-h-screen w-full flex flex-col justify-center relative isolate pt-16">
          {/* Arkaplan gradient */}
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

          <div className="mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Modern E-Ticaret Deneyimi
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-800 font-medium">
                En yeni ürünleri keşfedin ve güvenli alışveriş deneyiminin tadını çıkarın.
                Hemen alışverişe başlayın!
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <ScrollButton />
                <Link href="/register">
                  <Button variant="outline" size="lg">
                    Hesap Oluştur
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Alt gradient */}
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

          {/* Aşağı ok */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce bg-white/50 rounded-full p-2 backdrop-blur-sm">
            <ScrollButton variant="arrow" />
          </div>
        </section>

        {/* Öne Çıkan Ürünler - İkinci Sayfa */}
        <section id="featured-products" className="min-h-screen w-full bg-white/80 backdrop-blur-sm py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Öne Çıkan Ürünler
              </h2>
              <p className="mt-4 text-lg text-gray-800 font-medium">
                En popüler ve en yeni ürünlerimizi keşfedin
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {featuredProducts.length > 0 && (
              <div className="mt-12 text-center">
                <Link href="/products">
                  <Button variant="outline" size="lg">
                    Tüm Ürünleri Gör
                  </Button>
                </Link>
              </div>
            )}

            {featuredProducts.length === 0 && (
              <p className="mt-12 text-center text-gray-500">
                Henüz ürün bulunmamaktadır.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

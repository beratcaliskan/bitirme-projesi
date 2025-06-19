# E-Commerce Platform

Modern ve kullanıcı dostu bir e-ticaret platformu. Next.js, TypeScript, Tailwind CSS ve Supabase teknolojileri ile geliştirilmiştir.

## 🚀 Özellikler

### 👤 Kullanıcı Özellikleri
- **Kullanıcı Kayıt/Giriş Sistemi**
- **Ürün Listeleme ve Filtreleme**
  - Kategori, marka ve fiyat aralığı filtreleri
  - Dinamik fiyat slider'ı
  - Grid/List görünüm modları
- **Sepet Yönetimi**
  - Gerçek zamanlı sepet güncellemeleri
  - Varyant (renk, beden) desteği
- **Profil Yönetimi**
  - Adres yönetimi
  - Ödeme yöntemi yönetimi
  - Sipariş geçmişi
- **Sipariş Sistemi**

### 🔧 Admin Özellikleri
- **Dashboard**
- **Ürün Yönetimi**
  - Ürün ekleme/düzenleme/silme
  - Stok yönetimi
  - Varyant (renk, beden) yönetimi
- **Sipariş Yönetimi**
- **Kullanıcı Yönetimi**
- **Admin Yönetimi** (Super Admin)
- **Debug Paneli**
  - Database şema görüntüleme
  - Tablo verilerini inceleme

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom Auth System
- **State Management**: React Context API
- **UI Components**: Custom components with Tailwind CSS
- **Icons**: Lucide React

## 📦 Kurulum

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd ecommerce-project
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment değişkenlerini ayarlayın**
`.env.local` dosyası oluşturun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database'i ayarlayın**
`database/schema.sql` dosyasını Supabase'de çalıştırın.

5. **Projeyi çalıştırın**
```bash
npm run dev
```

## 🗄️ Database Şeması

### Ana Tablolar
- **users**: Kullanıcı bilgileri
- **products**: Ürün bilgileri ve stok verileri
- **addresses**: Kullanıcı adresleri
- **payment_methods**: Ödeme yöntemleri
- **orders**: Siparişler
- **order_items**: Sipariş öğeleri

## 🎨 UI/UX Özellikleri

- **Responsive Tasarım**: Tüm cihazlarda uyumlu
- **Modern Arayüz**: Tailwind CSS ile stillendirilmiş
- **Kullanıcı Dostu**: Sezgisel navigasyon
- **Performans**: Optimize edilmiş yükleme süreleri
- **Accessibility**: Erişilebilirlik standartlarına uygun

## 📱 Responsive Özellikler

- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔐 Güvenlik

- Password hashing
- JWT token authentication
- SQL injection koruması
- XSS koruması

## 📊 Admin Paneli

Admin paneline erişim için kullanıcının `isAdmin` veya `isSuperAdmin` yetkisi olması gerekir.

### Admin Yetkileri
- Ürün yönetimi
- Sipariş yönetimi
- Kullanıcı görüntüleme

### Super Admin Yetkileri
- Tüm admin yetkileri
- Admin kullanıcı ekleme/düzenleme
- Debug paneli erişimi

## 🚀 Deployment

1. **Build alın**
```bash
npm run build
```

2. **Projeyi deploy edin**
Vercel, Netlify veya diğer Next.js destekleyen platformlarda deploy edebilirsiniz.

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📞 İletişim

Proje hakkında sorularınız için iletişime geçebilirsiniz. 
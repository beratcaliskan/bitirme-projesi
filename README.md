

















# E-Ticaret Sitesi

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

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Yönlendirme
- **Database**: Supabase
- **UI Components**: Tailwind CSS

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

## Projeyle alakalı görseller:

<img width="1917" height="909" alt="Screenshot_1" src="https://github.com/user-attachments/assets/b984ccb4-fa0e-46f7-aff1-927d217309ad" />
<img width="1917" height="909" alt="landing_page2" src="https://github.com/user-attachments/assets/960aff72-6881-46aa-8986-1966801216a3" />
<img width="1917" height="913" alt="ürünler sayfası" src="https://github.com/user-attachments/assets/53983409-8de3-483d-9b28-71f8d5f38270" />
<img width="1919" height="907" alt="ürün detay sayfası" src="https://github.com/user-attachments/assets/7c750f86-815f-4a25-955b-47ab8d8226cf" />
<img width="1917" height="909" alt="bilgilerim" src="https://github.com/user-attachments/assets/6c693bc2-523a-434b-bd64-af92a3a3379e" />
<img width="1918" height="908" alt="sepet sayfası" src="https://github.com/user-attachments/assets/716f0b23-433c-4e99-a6b4-5fa6e06c8ec8" />
<img width="1918" height="910" alt="sepet dropdown" src="https://github.com/user-attachments/assets/d0efd12d-931b-4d45-ac3c-c9438efeb510" />
<img width="1917" height="907" alt="adres ekleme" src="https://github.com/user-attachments/assets/1ac033be-b750-4245-bd95-a708829ae19d" />
<img width="1918" height="908" alt="kart ekleme" src="https://github.com/user-attachments/assets/6495eef8-659f-4ee2-a071-94444e181f68" />
<img width="1917" height="910" alt="siparişlerim sayfası" src="https://github.com/user-attachments/assets/f6c9d575-894e-4e76-a578-4a4f06d198d5" />
<img width="1918" height="907" alt="sipariş detay" src="https://github.com/user-attachments/assets/519f1435-6e7c-4b6e-b7f7-4a6325fbd549" />
<img width="1913" height="906" alt="destek talebi açma" src="https://github.com/user-attachments/assets/1ba1ccf6-2227-47e9-b75a-e6f6ec0cb07d" />
<img width="797" height="598" alt="müşteri destek talebi ekranı" src="https://github.com/user-attachments/assets/fd57150b-e2dd-41f3-8b91-43d7ee9af2c7" />
<img width="1917" height="911" alt="admin panel" src="https://github.com/user-attachments/assets/457cfb36-e275-469f-82c9-6266fd3aa4d4" />
<img width="1918" height="908" alt="siparişler sayfası" src="https://github.com/user-attachments/assets/4127872f-4c58-45ec-850f-7c1259d01993" />
<img width="1919" height="915" alt="ürünler sayfası admin" src="https://github.com/user-attachments/assets/dc94a85f-4472-4d43-bb76-900767c82fbc" />
<img width="383" height="818" alt="image1" src="https://github.com/user-attachments/assets/96c11a2e-18ef-4b93-a185-0c190690c94c" />
<img width="510" height="823" alt="basic ürün ekleme" src="https://github.com/user-attachments/assets/eee6647c-c513-4ef7-9375-913c7fdbd5c8" />
<img width="1916" height="907" alt="kullanıcılar sayfası" src="https://github.com/user-attachments/assets/61046a43-8873-471d-9251-6f0f2ae46a51" />
<img width="1918" height="911" alt="müşteri destek admin" src="https://github.com/user-attachments/assets/647be306-c2e8-4401-ab1b-0b275d967b64" />
<img width="1916" height="901" alt="admin müşteri talep ekranı" src="https://github.com/user-attachments/assets/4d217e35-1d55-423f-8adc-258367f61dd7" />
<img width="1915" height="907" alt="yöneticiler sayfası" src="https://github.com/user-attachments/assets/af55b0ed-e5c1-486d-ad06-69b9c2725b35" />



-- Test Chat Data
-- Bu dosyayı çalıştırarak test chat'leri ve mesajları oluşturabilirsiniz

-- 1. Test chat'i oluştur (sipariş ID'si ile)
INSERT INTO support_chats (
    id,
    order_id, 
    user_id, 
    admin_id,
    status, 
    priority, 
    subject,
    created_at,
    updated_at,
    last_message_at
) VALUES (
    '1bca5239-bd56-49b9-908f-7151dc028944',
    '1d5be483-678c-40e8-ae60-b3ecdcef2666', -- Sipariş ID'si
    (SELECT id FROM users LIMIT 1), -- İlk kullanıcıyı al
    (SELECT id FROM admins LIMIT 1), -- İlk admin'i al
    'IN_PROGRESS',
    'HIGH',
    'Sipariş Durumu Hakkında Soru',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '5 minutes'
) ON CONFLICT (id) DO NOTHING;

-- 2. Müşteri mesajları ekle
INSERT INTO support_messages (
    chat_id,
    sender_id,
    sender_type,
    message,
    message_type,
    is_read,
    created_at,
    updated_at
) VALUES 
-- Müşteri'den ilk mesaj
(
    '1bca5239-bd56-49b9-908f-7151dc028944',
    (SELECT user_id FROM support_chats WHERE id = '1bca5239-bd56-49b9-908f-7151dc028944'),
    'USER',
    'Merhaba, siparişimin durumu hakkında bilgi alabilir miyim?',
    'TEXT',
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
),
-- Admin'den cevap
(
    '1bca5239-bd56-49b9-908f-7151dc028944',
    (SELECT admin_id FROM support_chats WHERE id = '1bca5239-bd56-49b9-908f-7151dc028944'),
    'ADMIN',
    'Merhaba! Siparişinizi kontrol ediyorum. Biraz bekleyebilir misiniz?',
    'TEXT',
    false,
    NOW() - INTERVAL '1 hour 45 minutes',
    NOW() - INTERVAL '1 hour 45 minutes'
),
-- Müşteri'den ikinci mesaj
(
    '1bca5239-bd56-49b9-908f-7151dc028944',
    (SELECT user_id FROM support_chats WHERE id = '1bca5239-bd56-49b9-908f-7151dc028944'),
    'USER',
    'Tabii ki, teşekkür ederim. Acele etmiyorum.',
    'TEXT',
    true,
    NOW() - INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '1 hour 30 minutes'
),
-- Admin'den detaylı cevap
(
    '1bca5239-bd56-49b9-908f-7151dc028944',
    (SELECT admin_id FROM support_chats WHERE id = '1bca5239-bd56-49b9-908f-7151dc028944'),
    'ADMIN',
    'Siparişiniz kargo firmasına teslim edildi. Kargo takip numaranız: TK123456789. 2-3 iş günü içinde elinizde olacak.',
    'TEXT',
    false,
    NOW() - INTERVAL '1 hour 15 minutes',
    NOW() - INTERVAL '1 hour 15 minutes'
),
-- Müşteri'den teşekkür mesajı
(
    '1bca5239-bd56-49b9-908f-7151dc028944',
    (SELECT user_id FROM support_chats WHERE id = '1bca5239-bd56-49b9-908f-7151dc028944'),
    'USER',
    'Harika! Çok teşekkür ederim. Hızlı dönüş için teşekkürler.',
    'TEXT',
    true,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
),
-- Admin'den son mesaj
(
    '1bca5239-bd56-49b9-908f-7151dc028944',
    (SELECT admin_id FROM support_chats WHERE id = '1bca5239-bd56-49b9-908f-7151dc028944'),
    'ADMIN',
    'Rica ederim! Başka bir sorunuz olursa her zaman yazabilirsiniz. İyi günler!',
    'TEXT',
    false,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '45 minutes'
),
-- Müşteri'den yeni okunmamış mesaj
(
    '1bca5239-bd56-49b9-908f-7151dc028944',
    (SELECT user_id FROM support_chats WHERE id = '1bca5239-bd56-49b9-908f-7151dc028944'),
    'USER',
    'Bir sorum daha var. Ürün beğenmezsem iade edebilir miyim?',
    'TEXT',
    false,
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes'
);

-- 3. Başka bir test chat'i oluştur (farklı durum için)
INSERT INTO support_chats (
    order_id, 
    user_id, 
    status, 
    priority, 
    subject,
    created_at,
    updated_at,
    last_message_at
) VALUES (
    (SELECT id FROM orders LIMIT 1 OFFSET 1), -- İkinci siparişi al
    (SELECT id FROM users LIMIT 1 OFFSET 1), -- İkinci kullanıcıyı al
    'OPEN',
    'URGENT',
    'Ürün Hasarlı Geldi',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '10 minutes'
) ON CONFLICT DO NOTHING;

-- 4. Bu chat için müşteri mesajları
INSERT INTO support_messages (
    chat_id,
    sender_id,
    sender_type,
    message,
    message_type,
    is_read,
    created_at,
    updated_at
) VALUES 
(
    (SELECT id FROM support_chats WHERE subject = 'Ürün Hasarlı Geldi' ORDER BY created_at DESC LIMIT 1),
    (SELECT user_id FROM support_chats WHERE subject = 'Ürün Hasarlı Geldi' ORDER BY created_at DESC LIMIT 1),
    'USER',
    'Merhaba, siparişim bugün geldi ama ürün hasarlı. Ne yapabilirim?',
    'TEXT',
    false,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
),
(
    (SELECT id FROM support_chats WHERE subject = 'Ürün Hasarlı Geldi' ORDER BY created_at DESC LIMIT 1),
    (SELECT user_id FROM support_chats WHERE subject = 'Ürün Hasarlı Geldi' ORDER BY created_at DESC LIMIT 1),
    'USER',
    'Ürünün fotoğraflarını çekebilirim. Nasıl gönderebilirim?',
    'TEXT',
    false,
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes'
);

-- 5. Düşük öncelikli chat
INSERT INTO support_chats (
    order_id, 
    user_id, 
    status, 
    priority, 
    subject,
    created_at,
    updated_at,
    last_message_at
) VALUES (
    (SELECT id FROM orders LIMIT 1 OFFSET 2), -- Üçüncü siparişi al
    (SELECT id FROM users LIMIT 1 OFFSET 2), -- Üçüncü kullanıcıyı al
    'CLOSED',
    'LOW',
    'Genel Bilgi Talebi',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
) ON CONFLICT DO NOTHING;

-- Bu chat için mesajlar
INSERT INTO support_messages (
    chat_id,
    sender_id,
    sender_type,
    message,
    message_type,
    is_read,
    created_at,
    updated_at
) VALUES 
(
    (SELECT id FROM support_chats WHERE subject = 'Genel Bilgi Talebi' ORDER BY created_at DESC LIMIT 1),
    (SELECT user_id FROM support_chats WHERE subject = 'Genel Bilgi Talebi' ORDER BY created_at DESC LIMIT 1),
    'USER',
    'Merhaba, yeni ürünler ne zaman gelecek?',
    'TEXT',
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    (SELECT id FROM support_chats WHERE subject = 'Genel Bilgi Talebi' ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM admins LIMIT 1),
    'ADMIN',
    'Merhaba! Yeni ürünlerimiz hakkında bilgi için web sitemizi takip edebilirsiniz. Haftalık olarak yeni ürünler ekliyoruz.',
    'TEXT',
    false,
    NOW() - INTERVAL '20 hours',
    NOW() - INTERVAL '20 hours'
),
(
    (SELECT id FROM support_chats WHERE subject = 'Genel Bilgi Talebi' ORDER BY created_at DESC LIMIT 1),
    (SELECT user_id FROM support_chats WHERE subject = 'Genel Bilgi Talebi' ORDER BY created_at DESC LIMIT 1),
    'USER',
    'Anladım, teşekkür ederim!',
    'TEXT',
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
);

-- 6. Özet bilgi
SELECT 
    'Test verileri başarıyla eklendi!' as message,
    COUNT(*) as total_chats
FROM support_chats;

SELECT 
    'Toplam mesaj sayısı:' as message,
    COUNT(*) as total_messages
FROM support_messages; 
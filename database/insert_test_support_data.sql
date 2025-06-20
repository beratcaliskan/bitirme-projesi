-- Insert test support data based on the provided examples
-- Run this after running support_tables_schema.sql and schema.sql

-- First, ensure we have the required user and order data

-- Insert test user if doesn't exist
INSERT INTO "public"."users" (
    "id", 
    "name", 
    "email", 
    "created_at", 
    "updated_at"
) VALUES (
    '4ab3163f-5509-42c2-9aeb-dce5cdb5f0b6', 
    'Test User', 
    'testuser@example.com', 
    '2025-06-19 18:00:00.000000+00', 
    '2025-06-19 18:00:00.000000+00'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;

-- Insert test address for order
INSERT INTO "public"."addresses" (
    "id",
    "user_id",
    "name",
    "phone",
    "city",
    "district", 
    "neighborhood",
    "full_address",
    "created_at"
) VALUES (
    'test-address-id-123',
    '4ab3163f-5509-42c2-9aeb-dce5cdb5f0b6',
    'Test Address',
    '+90 555 123 4567',
    'Istanbul',
    'Kadikoy',
    'Moda',
    'Test Mahallesi Test Sokak No:1',
    '2025-06-19 18:00:00.000000+00'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;

-- Insert test order if doesn't exist
INSERT INTO "public"."orders" (
    "id", 
    "user_id", 
    "address_id",
    "total_amount", 
    "status", 
    "created_at", 
    "updated_at"
) VALUES (
    '1d5be483-678c-40e8-ae60-b3ecdcef2666', 
    '4ab3163f-5509-42c2-9aeb-dce5cdb5f0b6', 
    'test-address-id-123',
    999.99, 
    'DELIVERED', 
    '2025-06-19 17:00:00.000000+00', 
    '2025-06-19 17:00:00.000000+00'
)
ON CONFLICT (id) DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

-- Insert test admin if doesn't exist
INSERT INTO "public"."admins" (
    "id", 
    "email", 
    "name", 
    "role", 
    "created_at", 
    "updated_at"
) VALUES (
    '8c85be8c-8221-4478-831b-e10e9d530e02', 
    'testadmin@example.com', 
    'Test Admin', 
    'ADMIN', 
    '2025-06-19 17:00:00.000000+00', 
    '2025-06-19 17:00:00.000000+00'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = EXCLUDED.updated_at;

-- Insert support chat record
INSERT INTO "public"."support_chats" (
    "id", 
    "order_id", 
    "user_id", 
    "admin_id", 
    "status", 
    "priority", 
    "subject", 
    "created_at", 
    "updated_at", 
    "last_message_at"
) VALUES (
    '1bca5239-bd56-49b9-908f-7151dc028944', 
    '1d5be483-678c-40e8-ae60-b3ecdcef2666', 
    '4ab3163f-5509-42c2-9aeb-dce5cdb5f0b6', 
    '8c85be8c-8221-4478-831b-e10e9d530e02', 
    'IN_PROGRESS', 
    'LOW', 
    'çok önemli', 
    '2025-06-19 18:27:37.296853+00', 
    '2025-06-20 11:46:16.071944+00', 
    '2025-06-20 11:46:21.95+00'
)
ON CONFLICT (id) DO UPDATE SET
    order_id = EXCLUDED.order_id,
    user_id = EXCLUDED.user_id,
    admin_id = EXCLUDED.admin_id,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    subject = EXCLUDED.subject,
    updated_at = EXCLUDED.updated_at,
    last_message_at = EXCLUDED.last_message_at;

-- Insert support message record
INSERT INTO "public"."support_messages" (
    "id", 
    "chat_id", 
    "sender_id", 
    "sender_type", 
    "message", 
    "message_type", 
    "file_url", 
    "is_read", 
    "created_at", 
    "updated_at"
) VALUES (
    '0fabbe82-2a8e-4d01-a946-e1d42cf6dc50', 
    '1bca5239-bd56-49b9-908f-7151dc028944', 
    '8c85be8c-8221-4478-831b-e10e9d530e02', 
    'ADMIN', 
    'selam', 
    'TEXT', 
    null, 
    false, 
    '2025-06-19 18:33:19.655331+00', 
    '2025-06-19 18:33:19.655331+00'
)
ON CONFLICT (id) DO UPDATE SET
    chat_id = EXCLUDED.chat_id,
    sender_id = EXCLUDED.sender_id,
    sender_type = EXCLUDED.sender_type,
    message = EXCLUDED.message,
    message_type = EXCLUDED.message_type,
    file_url = EXCLUDED.file_url,
    is_read = EXCLUDED.is_read,
    updated_at = EXCLUDED.updated_at; 
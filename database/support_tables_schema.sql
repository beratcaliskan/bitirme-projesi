-- Support Chat System Tables
-- Run this SQL in your Supabase SQL editor or database

-- 1. Create admins table if not exists (for support system)
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin if doesn't exist
INSERT INTO admins (email, name, role) 
VALUES ('admin@admin.com', 'System Admin', 'SUPER_ADMIN')
ON CONFLICT (email) DO NOTHING;

-- 2. Create support_chats table
CREATE TABLE IF NOT EXISTS support_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    admin_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints
    CONSTRAINT fk_support_chats_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_chats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_chats_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- 3. Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('USER', 'ADMIN')),
    message TEXT NOT NULL,
    message_type VARCHAR(10) NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_support_messages_chat FOREIGN KEY (chat_id) REFERENCES support_chats(id) ON DELETE CASCADE
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_chats_order_id ON support_chats(order_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_user_id ON support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_admin_id ON support_chats(admin_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON support_chats(status);
CREATE INDEX IF NOT EXISTS idx_support_chats_priority ON support_chats(priority);
CREATE INDEX IF NOT EXISTS idx_support_chats_created_at ON support_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_chats_last_message_at ON support_chats(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_chat_id ON support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_type ON support_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_support_messages_is_read ON support_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at ASC);

-- 5. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers (drop if exists first)
DROP TRIGGER IF EXISTS update_support_chats_updated_at ON support_chats;
CREATE TRIGGER update_support_chats_updated_at
    BEFORE UPDATE ON support_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_messages_updated_at ON support_messages;
CREATE TRIGGER update_support_messages_updated_at
    BEFORE UPDATE ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Create trigger to update last_message_at
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_chats 
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_chat_last_message_trigger ON support_messages;
CREATE TRIGGER update_chat_last_message_trigger
    AFTER INSERT ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- 8. Disable Row Level Security for simplicity (can be enabled later)
ALTER TABLE support_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 9. Add helpful views for the application

-- View for chat statistics
CREATE OR REPLACE VIEW chat_statistics AS
SELECT 
    status,
    priority,
    COUNT(*) as total_chats,
    COUNT(CASE WHEN last_message_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as created_7d
FROM support_chats
GROUP BY status, priority;

-- View for unread message counts by admin
CREATE OR REPLACE VIEW admin_unread_counts AS
SELECT 
    sc.admin_id,
    sc.id as chat_id,
    COUNT(sm.id) as unread_count
FROM support_chats sc
LEFT JOIN support_messages sm ON sc.id = sm.chat_id 
WHERE sm.sender_type = 'USER' AND sm.is_read = FALSE
GROUP BY sc.admin_id, sc.id;

-- View for unread message counts by user
CREATE OR REPLACE VIEW user_unread_counts AS
SELECT 
    sc.user_id,
    sc.id as chat_id,
    COUNT(sm.id) as unread_count
FROM support_chats sc
LEFT JOIN support_messages sm ON sc.id = sm.chat_id 
WHERE sm.sender_type = 'ADMIN' AND sm.is_read = FALSE
GROUP BY sc.user_id, sc.id;

-- View for chat with latest message
CREATE OR REPLACE VIEW chats_with_latest_message AS
SELECT 
    sc.*,
    lm.message as latest_message,
    lm.sender_type as latest_sender_type,
    lm.created_at as latest_message_time,
    u.name as user_name,
    u.email as user_email,
    o.total_amount as order_total,
    COALESCE(uuc.unread_count, 0) as user_unread_count,
    COALESCE(auc.unread_count, 0) as admin_unread_count
FROM support_chats sc
LEFT JOIN users u ON sc.user_id = u.id
LEFT JOIN orders o ON sc.order_id = o.id
LEFT JOIN user_unread_counts uuc ON sc.id = uuc.chat_id
LEFT JOIN admin_unread_counts auc ON sc.id = auc.chat_id
LEFT JOIN LATERAL (
    SELECT message, sender_type, created_at
    FROM support_messages sm
    WHERE sm.chat_id = sc.id
    ORDER BY created_at DESC
    LIMIT 1
) lm ON true
ORDER BY sc.last_message_at DESC NULLS LAST, sc.created_at DESC; 
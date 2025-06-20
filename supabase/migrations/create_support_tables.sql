-- Create support_chats table
CREATE TABLE IF NOT EXISTS support_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('USER', 'ADMIN')),
    message TEXT NOT NULL,
    message_type VARCHAR(10) NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_chats_order_id ON support_chats(order_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_user_id ON support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_admin_id ON support_chats(admin_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON support_chats(status);
CREATE INDEX IF NOT EXISTS idx_support_chats_priority ON support_chats(priority);
CREATE INDEX IF NOT EXISTS idx_support_chats_created_at ON support_chats(created_at);

CREATE INDEX IF NOT EXISTS idx_support_messages_chat_id ON support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_type ON support_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_support_messages_is_read ON support_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_support_chats_updated_at
    BEFORE UPDATE ON support_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_messages_updated_at
    BEFORE UPDATE ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update last_message_at in support_chats when a new message is added
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_chats 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_last_message_trigger
    AFTER INSERT ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- Add RLS (Row Level Security) policies
ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_chats
CREATE POLICY "Users can view their own chats" ON support_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chats" ON support_chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Admins can insert chats" ON support_chats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Admins can update chats" ON support_chats
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Policies for support_messages
CREATE POLICY "Users can view messages from their chats" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_chats 
            WHERE id = chat_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all messages" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Users can insert messages to their chats" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_chats 
            WHERE id = chat_id AND user_id = auth.uid()
        ) AND sender_type = 'USER'
    );

CREATE POLICY "Admins can insert messages" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = auth.jwt() ->> 'email'
        ) AND sender_type = 'ADMIN'
    );

CREATE POLICY "Admins can update messages" ON support_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE support_chats IS 'Customer support chat conversations';
COMMENT ON TABLE support_messages IS 'Messages within support chat conversations';

COMMENT ON COLUMN support_chats.status IS 'Chat status: OPEN, IN_PROGRESS, CLOSED';
COMMENT ON COLUMN support_chats.priority IS 'Chat priority: LOW, MEDIUM, HIGH, URGENT';
COMMENT ON COLUMN support_chats.subject IS 'Chat subject/title';
COMMENT ON COLUMN support_chats.last_message_at IS 'Timestamp of the last message in this chat';

COMMENT ON COLUMN support_messages.sender_type IS 'Type of sender: USER or ADMIN';
COMMENT ON COLUMN support_messages.message_type IS 'Type of message: TEXT, IMAGE, FILE';
COMMENT ON COLUMN support_messages.file_url IS 'URL of attached file (if message_type is IMAGE or FILE)';
COMMENT ON COLUMN support_messages.is_read IS 'Whether the message has been read by the recipient'; 
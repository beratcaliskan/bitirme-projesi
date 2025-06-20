-- Enable real-time for support chat tables
-- Run this in Supabase SQL editor to enable real-time subscriptions

-- Enable real-time for support_chats table
ALTER PUBLICATION supabase_realtime ADD TABLE support_chats;

-- Enable real-time for support_messages table  
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;

-- Verify real-time is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND (tablename = 'support_chats' OR tablename = 'support_messages');

-- Optional: Enable real-time for related tables if needed
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE users; 
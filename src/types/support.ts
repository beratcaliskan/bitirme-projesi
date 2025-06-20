export interface SupportChat {
  id: string;
  order_id: string;
  user_id: string;
  admin_id?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface SupportMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'USER' | 'ADMIN';
  message: string;
  message_type: 'TEXT' | 'IMAGE' | 'FILE';
  file_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatWithDetails extends SupportChat {
  user: {
    name: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  };
  order: {
    id: string;
    total_amount: number;
    status: string;
  };
  messages: SupportMessage[];
  unread_count: number;
} 
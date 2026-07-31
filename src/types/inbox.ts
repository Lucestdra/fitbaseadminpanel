import type { MessagingChannelId } from './messaging';

export interface Conversation {
  id: string;
  contactName: string;
  avatarInitials: string;
  channel: MessagingChannelId;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  tagId?: string;
}

export type MessageSender = 'contact' | 'studio';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderName: string;
  text: string;
  time: string;
  read?: boolean;
}

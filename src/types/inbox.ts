import type { MessageStatus } from '@/api/messaging';
import type { MessagingChannelId } from './messaging';

/** One thread, as the list renders it. */
export interface Conversation {
  id: string;
  /** Who it is with. The inbox resolves the name; the messaging module stores none. */
  contactId: string;
  contactName: string;
  avatarInitials: string;
  /**
   * Where the provider serves their picture, or null.
   *
   * Signed and short-lived on Meta's channels, and refreshed by the server on every inbound
   * message — so an active thread renders and a dormant one falls back to {@link avatarInitials}.
   */
  avatarUrl: string | null;
  channel: MessagingChannelId;
  /** The newest message's text, or what it was when it carried none. */
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  tagId?: string;
}

export type MessageSender = 'contact' | 'studio';

/** One bubble. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderName: string;
  text: string;
  time: string;
  /** The contact has read it. Only ever set from a status the provider actually reported. */
  read?: boolean;
  /**
   * Where an outbound message got to, exactly as the server holds it.
   *
   * <b>Rendered rather than hidden, and that is the point of carrying it.</b> A queued message that
   * draws like a delivered one tells the studio a customer has been answered when nothing has left
   * the building — and until the outbound dispatcher lands (backend ADR-0075, M4) every message
   * sent from this panel stops at `Pending`. CLAUDE.md §16 forbids inventing a status; showing the
   * real one is the other half of that rule.
   *
   * Absent on inbound, where the only delivery fact is that it reached us.
   */
  status?: MessageStatus;
}

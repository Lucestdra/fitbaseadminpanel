import { client, withAuth } from './client';
import type { components } from './schema';

export type ConversationListItem = components['schemas']['ConversationListItem'];
export type ConversationDetail = components['schemas']['ConversationDetail'];
export type ConversationList = components['schemas']['ConversationList'];
export type ConversationCounters = components['schemas']['ConversationCounters'];
export type MessageItem = components['schemas']['MessageItem'];

export type ConversationStatus = components['schemas']['ConversationStatus'];
export type MessageDirection = components['schemas']['MessageDirection'];
export type MessageType = components['schemas']['MessageType'];
export type MessageStatus = components['schemas']['MessageStatus'];

export interface ConversationQuery {
  status?: NonNullable<ConversationStatus>[];
  channelConnectionId?: string;
  assignedTo?: string[];
  unassignedOnly?: boolean;
  unreadOnly?: boolean;
  cursor?: string;
  limit?: number;
}

/**
 * A page of the inbox, with the counters above it.
 *
 * <b>The counters are not filtered by `status`.</b> They describe the studio's inbox under the
 * channel and assignment narrowing, which is what makes them usable as tabs — a count that changed
 * when you clicked the tab it labels would be describing the selection rather than the thing being
 * selected.
 *
 * Omitting `status` excludes `Spam`; asking for it explicitly includes it.
 */
export async function listConversations(query: ConversationQuery = {}): Promise<ConversationList> {
  return withAuth(() =>
    client.GET('/api/v1/conversations', {
      params: {
        query: {
          status: query.status,
          channelConnectionId: query.channelConnectionId,
          assignedTo: query.assignedTo,
          unassignedOnly: query.unassignedOnly,
          unreadOnly: query.unreadOnly,
          cursor: query.cursor,
          limit: query.limit,
        },
      },
    }),
  );
}

/**
 * One conversation's header.
 *
 * <b>Read `canSendFreeForm` before enabling the composer.</b> Outside the provider's window an
 * ordinary reply is refused with `messaging.send.session_window_closed`, and
 * `freeFormWindowClosesAt` is what the screen counts down — "you have four hours to reply for free"
 * is the single most consequential fact about a WhatsApp thread and it is invisible unless said.
 */
export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  return withAuth(() =>
    client.GET('/api/v1/conversations/{conversationId}', {
      params: { path: { conversationId } },
    }),
  );
}

/**
 * A page of one thread's messages, newest first.
 *
 * <b>Paged on the thread's own sequence, never on a timestamp</b> (backend ADR-0050). The client
 * reverses the page for display and asks for the next one when the reader scrolls up; the cursor is
 * opaque and parsing it is how a client breaks when the sort changes.
 */
export async function listMessages(
  conversationId: string,
  cursor?: string,
  limit?: number,
): Promise<components['schemas']['PageOfMessageItem']> {
  return withAuth(() =>
    client.GET('/api/v1/conversations/{conversationId}/messages', {
      params: { path: { conversationId }, query: { cursor, limit } },
    }),
  );
}

/**
 * Queues an outbound message.
 *
 * <b>Comes back as `Pending`, not `Sent`.</b> Nothing has spoken to a provider — the message is
 * persisted and the dispatcher carries it — and a status the provider did not report is never
 * fabricated. The bubble renders as sending until a status event says otherwise, and on Instagram
 * it stops at `Sent` because Instagram reports no delivery receipt.
 */
export async function sendMessage(
  conversationId: string,
  body: { type?: NonNullable<MessageType>; body: string; replyToMessageId?: string | null },
): Promise<MessageItem> {
  return withAuth(() =>
    client.POST('/api/v1/conversations/{conversationId}/messages', {
      params: { path: { conversationId } },
      body: {
        type: body.type ?? 'Text',
        body: body.body,
        replyToMessageId: body.replyToMessageId ?? null,
      },
    }),
  );
}

/** Moves a conversation to another state. `messaging.conversations.manage`. */
export async function setConversationStatus(
  conversationId: string,
  status: NonNullable<ConversationStatus>,
): Promise<ConversationDetail> {
  return withAuth(() =>
    client.POST('/api/v1/conversations/{conversationId}/status', {
      params: { path: { conversationId } },
      body: { status },
    }),
  );
}

/** Gives a conversation an owner. `null` unassigns. `messaging.conversations.manage`. */
export async function assignConversation(
  conversationId: string,
  staffMemberId: string | null,
): Promise<ConversationDetail> {
  return withAuth(() =>
    client.POST('/api/v1/conversations/{conversationId}/assignment', {
      params: { path: { conversationId } },
      body: { staffMemberId },
    }),
  );
}

/**
 * Clears the unread badge.
 *
 * Ours, not the provider's: no read receipt goes back to the contact. Sending one is a per-channel
 * capability decision that belongs to the connector.
 */
export async function markConversationRead(conversationId: string): Promise<ConversationDetail> {
  return withAuth(() =>
    client.POST('/api/v1/conversations/{conversationId}/read', {
      params: { path: { conversationId } },
    }),
  );
}

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
 * A page of one thread's messages, in chronological order — oldest first.
 *
 * <b>Sorted by the database, not by the caller.</b> The page arrives in reading order and is
 * rendered as it arrives; a client that had to reverse it would be the one place the ordering
 * lived, and the client that forgot would show a conversation running backwards with no error
 * anywhere.
 *
 * <b>Paging still walks backwards</b>, and it is paged on the thread's own sequence rather than on
 * a timestamp (backend ADR-0050). A thread opens on its newest messages and asks for older ones as
 * the reader scrolls up, so the cursor names the oldest message on the page. It is opaque, and
 * parsing it is how a client breaks when the sort changes.
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

// ---- The studio's WhatsApp welcome message --------------------------------------------------

export type WelcomeTemplateView = components['schemas']['WelcomeTemplateView'];
export type WelcomeTemplateVariable = components['schemas']['WelcomeTemplateVariable'];
export type WelcomeDeliveryItem = components['schemas']['WelcomeDeliveryItem'];
export type WelcomeTemplateAudience = components['schemas']['WelcomeTemplateAudience'];
export type WelcomeDeliveryStatus = components['schemas']['WelcomeDeliveryStatus'];
export type WelcomeRecipientKind = components['schemas']['WelcomeRecipientKind'];

/**
 * The studio's welcome message, its automatic-send setting, and what it has sent.
 *
 * <b>Answers even when nothing has been saved</b> — `configured` is false and `body` is empty —
 * so the editor's empty state is a value rather than a caught 404.
 *
 * `messaging.templates.manage`, which is narrower than the rest of the settings screen: what comes
 * back includes the names of people the studio has messaged automatically and why some of them
 * failed.
 */
export async function getWelcomeTemplate(): Promise<WelcomeTemplateView> {
  return withAuth(() => client.GET('/api/v1/organization/whatsapp-template'));
}

/**
 * Saves the welcome message and whether it sends itself.
 *
 * <b>Placeholders are validated, never silently dropped.</b> A body using a token the server
 * cannot fill in is refused with `messaging.template.variable_unknown` and the offending ones are
 * named — the studio is looking at the editor when they can still fix it, and the customer who
 * would otherwise receive literal braces is not.
 */
export async function saveWelcomeTemplate(draft: {
  body: string;
  autoSendEnabled: boolean;
  audience: NonNullable<WelcomeTemplateAudience>;
}): Promise<WelcomeTemplateView> {
  return withAuth(() =>
    client.PUT('/api/v1/organization/whatsapp-template', {
      body: {
        body: draft.body,
        autoSendEnabled: draft.autoSendEnabled,
        audience: draft.audience,
      },
    }),
  );
}

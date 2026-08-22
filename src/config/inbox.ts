import type { ConversationListItem, MessageItem, MessageStatus, MessageType } from '@/api/messaging';
import { channelIdForProvider } from '@/config/channels';
import type { ChatMessage, Conversation } from '@/types/inbox';
import { addDays, fromIsoDate, localDateOf, todayIn, toIsoDate, TURKISH_MONTHS } from '@/utils/date';
import { initialsOf } from '@/utils/name';

/**
 * The wire shapes of `/api/v1/conversations`, in the shape the inbox components read.
 *
 * <b>The same role `config/channels.ts` plays for channel cards, and it is here for the same
 * reason.</b> The components were written against a local shape and are correct as they are; what
 * was missing was the adapter between that shape and the server's. Putting the mapping in the
 * screen would have spread ADR-0012's English-on-the-wire / Turkish-in-the-panel split across every
 * component that renders a bubble.
 *
 * <b>Nothing here invents a fact.</b> A message with no text previews as what it is, a status is
 * printed as the server holds it, and a name that could not be resolved says so rather than
 * borrowing one from somewhere else (CLAUDE.md §16).
 */

/** What the studio is called in their own outbound bubbles. */
const SELF_LABEL = 'Sen';

/**
 * The name shown for a contact whose record could not be read.
 *
 * <b>A sentence rather than a blank.</b> The contact row exists — a conversation cannot exist
 * without one — so an empty name here means the lookup failed, and "Kişi adı alınamadı" is the
 * difference between a broken request and a customer who genuinely has no name on file.
 */
const UNRESOLVED_CONTACT = 'Kişi adı alınamadı';

/** A contact the provider gave us no name for at all. Ordinary on Instagram. */
const UNNAMED_CONTACT = 'İsimsiz kişi';

/**
 * What a message *is*, for the messages that carry no text.
 *
 * The backend's `ConversationListItem.preview` is null for those on purpose and its contract says
 * the client renders the type — an image with no caption must preview as "Fotoğraf" rather than as
 * an empty row that reads like a bug.
 */
const TYPE_LABELS: Record<NonNullable<MessageType>, string> = {
  Text: 'Mesaj',
  Image: 'Fotoğraf',
  Video: 'Video',
  Audio: 'Ses kaydı',
  Voice: 'Sesli mesaj',
  Document: 'Belge',
  Location: 'Konum',
  Contact: 'Kişi kartı',
  Sticker: 'Çıkartma',
  Interactive: 'Etkileşimli mesaj',
  Template: 'Şablon mesaj',
  System: 'Sistem mesajı',
  Unsupported: 'Desteklenmeyen mesaj',
};

/**
 * Where an outbound message got to, in Turkish.
 *
 * <b>Eight states, not "gönderildi" for all of them.</b> `Pending` and `Sent` are different
 * promises to the person reading the screen: the first means we hold it, the second means the
 * provider accepted it. Collapsing them is how a studio comes to believe a customer was answered.
 */
export const MESSAGE_STATUS_LABELS: Record<NonNullable<MessageStatus>, string> = {
  Pending: 'Kuyrukta',
  Queued: 'Kuyrukta',
  Sending: 'Gönderiliyor…',
  Sent: 'Gönderildi',
  Delivered: 'İletildi',
  Read: 'Okundu',
  Failed: 'Gönderilemedi',
  Cancelled: 'İptal edildi',
};

/** The statuses that mean the message has not left us. */
const UNSENT: NonNullable<MessageStatus>[] = ['Pending', 'Queued', 'Sending'];

/** Whether a status means the studio is still waiting on the provider. */
export function isUnsent(status: MessageStatus | undefined): boolean {
  return status !== undefined && UNSENT.includes(status);
}

/**
 * One conversation row.
 *
 * @param item The server's row.
 * @param contactName The resolved name, or null when the lookup has not landed or failed.
 * @param timeZoneId The organization's zone, from `useAuth`.
 * @returns The row, or null for a provider this panel does not render.
 */
export function toConversation(
  item: ConversationListItem,
  contactName: string | null,
  timeZoneId: string,
  avatarUrl: string | null = null,
): Conversation | null {
  const channel = channelIdForProvider(item.provider);

  // Same rule as a channel card: a Telegram row has no icon, no label and no badge here, so it is
  // dropped rather than rendered blank — and it appears the moment this panel learns the channel.
  if (!channel) return null;

  const name = contactName ?? UNRESOLVED_CONTACT;

  return {
    id: item.id,
    contactId: item.contactId,
    contactName: name,
    avatarInitials: initialsOf(name),
    avatarUrl,
    channel,
    lastMessage: previewOf(item),
    lastMessageTime: formatInboxTime(item.lastMessageAt, timeZoneId),
    unread: item.unreadCount > 0,
  };
}

/**
 * The preview line, with the prefix that says whose turn it is.
 *
 * `previewDirection` exists on the contract for exactly this — without it a list of threads gives
 * no way to tell the ones waiting on the studio from the ones waiting on the customer, which is the
 * first question anybody asks of an inbox.
 */
function previewOf(item: ConversationListItem): string {
  const text = item.preview ?? TYPE_LABELS[item.previewType] ?? TYPE_LABELS.Unsupported;

  return item.previewDirection === 'Outbound' ? `Siz: ${text}` : text;
}

/**
 * One bubble.
 *
 * @param item The server's message.
 * @param conversationId The thread it belongs to.
 * @param names What to call each side. `self` is used for the staff member reading the screen.
 * @param timeZoneId The organization's zone.
 */
export function toChatMessage(
  item: MessageItem,
  conversationId: string,
  names: { contact: string; self: string; studio: string; selfStaffMemberId: string | null },
  timeZoneId: string,
): ChatMessage {
  const outbound = item.direction === 'Outbound';

  return {
    id: item.id,
    conversationId,
    sequence: item.sequence,
    occurredAt: item.occurredAt,
    sender: outbound ? 'studio' : 'contact',
    senderName: outbound ? outboundSenderName(item, names) : names.contact,
    text: item.body ?? TYPE_LABELS[item.type] ?? TYPE_LABELS.Unsupported,
    time: formatBubbleTime(item.occurredAt, timeZoneId),

    // Only from the status the provider reported. An Instagram thread stops at `Sent` because
    // Instagram sends no read receipt, and drawing a tick nobody sent is what §16 forbids.
    read: outbound ? item.status === 'Read' : undefined,
    status: outbound ? item.status : undefined,
  };
}

/**
 * Who sent an outbound message.
 *
 * <b>"Sen" only for the person actually reading the screen.</b> Attributing a colleague's reply to
 * whoever has the tab open is how two coaches end up disagreeing about who promised what. Any other
 * staff member falls back to the studio's own name rather than to an id — the panel has no staff
 * directory on this screen, and a UUID in a chat bubble is worse than the studio's name.
 */
function outboundSenderName(
  item: MessageItem,
  names: { self: string; studio: string; selfStaffMemberId: string | null },
): string {
  if (item.sentByStaffMemberId !== null && item.sentByStaffMemberId === names.selfStaffMemberId) {
    return names.self;
  }

  return names.studio;
}

/** The name to show for a contact, given whatever the contacts module holds. */
export function contactLabel(displayName: string | null | undefined): string {
  return displayName && displayName.trim().length > 0 ? displayName : UNNAMED_CONTACT;
}

/**
 * The thread in reading order: oldest at the top, newest at the bottom.
 *
 * <b>The server already answers in this order</b> — `/conversations/{id}/messages` sorts ascending
 * in SQL — so this is not where the ordering is decided. It is what keeps it true after the client
 * has touched the list: a reply appended on send, and a page of older messages prepended on
 * scroll-up, both have to land somewhere, and "wherever the code that added them put them" is not
 * an ordering.
 *
 * Sorted on the server's own sequence, which is unique within a thread and a total order by
 * construction (backend ADR-0050) — never on the timestamp, because provider clocks disagree with
 * ours and a late webhook carries an earlier time than a message already stored.
 */
export function inReadingOrder(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((left, right) => left.sequence - right.sequence);
}

export { SELF_LABEL, UNRESOLVED_CONTACT };

/**
 * A list timestamp — `Bugün 11:04`, `Dün 18:45`, `3 Ağustos 09:30`.
 *
 * <b>The studio's zone, never the device's.</b> A message that arrived at 01:20 in Istanbul is the
 * previous evening in UTC and a different day again on a laptop in London — so a coach abroad would
 * see this morning's messages filed under yesterday. The same reasoning `utils/instants.ts` records
 * for every other instant this panel prints.
 */
export function formatInboxTime(instant: string, timeZoneId: string): string {
  const day = localDateOf(instant, timeZoneId);
  const clock = clockIn(instant, timeZoneId);

  if (day === todayIn(timeZoneId)) return `Bugün ${clock}`;
  if (day === yesterdayIn(timeZoneId)) return `Dün ${clock}`;

  return `${dayLabel(day)} ${clock}`;
}

/**
 * A bubble timestamp — the clock alone for today, the date as well for anything older.
 *
 * The thread already draws a "Bugün" divider above the messages, so repeating the day on every
 * bubble from today is noise; an older message with no date is ambiguous, which is worse.
 */
export function formatBubbleTime(instant: string, timeZoneId: string): string {
  const day = localDateOf(instant, timeZoneId);
  const clock = clockIn(instant, timeZoneId);

  if (day === todayIn(timeZoneId)) return clock;
  if (day === yesterdayIn(timeZoneId)) return `Dün ${clock}`;

  return `${dayLabel(day)} ${clock}`;
}

/** `HH:mm` where the studio is. Falls back to the device rather than crashing a list. */
function clockIn(instant: string, timeZoneId: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: timeZoneId,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(instant));
  } catch {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(instant),
    );
  }
}

/** Yesterday where the studio is, as `YYYY-MM-DD`. */
function yesterdayIn(timeZoneId: string): string {
  const today = fromIsoDate(todayIn(timeZoneId));

  return today ? toIsoDate(addDays(today, -1)) : '';
}

/** `2026-08-03` → `3 Ağustos`. Built from parts; `new Date(iso)` is UTC midnight and shifts. */
function dayLabel(isoDate: string): string {
  const date = fromIsoDate(isoDate);

  return date ? `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]}` : isoDate;
}

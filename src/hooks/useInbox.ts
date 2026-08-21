import { useCallback, useEffect, useRef, useState } from 'react';
import * as messagingApi from '@/api/messaging';
import type { ConversationCounters, ConversationDetail, ConversationStatus } from '@/api/messaging';
import { getContact } from '@/api/contacts';
import { useAuth } from '@/context/AuthContext';
import { contactLabel, SELF_LABEL, toChatMessage, toConversation } from '@/config/inbox';
import type { ChatMessage, Conversation } from '@/types/inbox';

/** How many threads the list asks for. One page; the inbox does not paginate yet. */
const PAGE_SIZE = 30;

/** How many of a thread's messages are loaded. Newest first, reversed for display. */
const THREAD_SIZE = 50;

export interface InboxState {
  conversations: Conversation[];
  /** The studio's own counters, unfiltered by status. Null until the first page lands. */
  counters: ConversationCounters | null;
  status: 'loading' | 'ready' | 'error';
}

export interface ThreadState {
  detail: ConversationDetail | null;
  messages: ChatMessage[];
  status: 'idle' | 'loading' | 'ready' | 'error';
}

/**
 * What one thread's load produced, tagged with the thread it was for.
 *
 * <b>The tag is what makes the exposed state derivable.</b> Without it, switching conversations
 * would need an effect that synchronously clears the previous thread — which React's own rule
 * forbids and which shows the previous customer's messages under the new customer's name for a
 * frame. Comparing the tag against the current selection answers "is what I hold the thing being
 * asked for" without writing anything.
 */
type ThreadLoad =
  | { conversationId: string; status: 'ready'; detail: ConversationDetail; messages: ChatMessage[] }
  | { conversationId: string; status: 'error' }
  | null;

/**
 * Names resolved from the contacts module, kept for the life of the tab.
 *
 * <b>Module-level rather than in the hook, and it is not a micro-optimisation.</b> The messaging
 * module stores no names by contract — a conversation carries a `contactId` and nothing else — so
 * every thread costs a contacts lookup, and the same customer appears in the list, in the thread
 * header and in every one of their bubbles. Without a cache, opening a thread re-fetches the person
 * whose name is already on screen.
 *
 * A miss is not cached. A name that failed to load is retried on the next render that needs it,
 * because pinning "Kişi adı alınamadı" for the session on one dropped request is the kind of error
 * nobody can clear without a reload.
 */
const contactNames = new Map<string, string>();

/** Lookups in flight, so a page of ten threads with one customer makes one request. */
const contactRequests = new Map<string, Promise<string | null>>();

async function resolveContactName(contactId: string): Promise<string | null> {
  const cached = contactNames.get(contactId);

  if (cached !== undefined) return cached;

  let pending = contactRequests.get(contactId);

  if (!pending) {
    pending = (async () => {
      try {
        const contact = await getContact(contactId);

        // The tombstone's own name is used rather than chasing `mergedIntoContactId`. A merge keeps
        // the surviving record's name for the *actions* a person takes on a contact; for a label on
        // a bubble, one more request to print the same human's name is not worth the round trip.
        const name = contactLabel(contact.displayName);

        contactNames.set(contactId, name);

        return name;
      } catch {
        return null;
      } finally {
        contactRequests.delete(contactId);
      }
    })();

    contactRequests.set(contactId, pending);
  }

  return pending;
}

/**
 * The studio's inbox, and the acts that change it.
 *
 * <b>Every conversation, message and status on this screen is the server's.</b> The version this
 * replaces held eight fictional threads in `useState` and appended the studio's replies to a local
 * array — so the panel showed a working inbox on a deployment where no channel had ever been
 * connected, and "gönder" wrote to nothing.
 *
 * <b>Sending refetches the list rather than patching it.</b> A send moves the thread's status to
 * `WaitingForCustomer`, bumps its sequence and changes its position in the ordering — all rules the
 * server owns, and reproducing them here would be a second implementation that drifts. The bubble
 * is appended from the response so the composer clears immediately; the list catches up.
 *
 * <b>Reading a thread clears its badge locally and does not refetch.</b> Selecting a conversation
 * is the one act a person does dozens of times a minute, and a page load per click would make the
 * list flicker and reorder under the cursor. A failed `markRead` costs a badge that returns on the
 * next load, which is the cheapest possible wrong answer.
 */
export function useInbox(): InboxState & {
  thread: ThreadState;
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  sending: boolean;
  select: (conversationId: string) => void;
  send: (text: string) => Promise<void>;
  setStatus: (status: NonNullable<ConversationStatus>) => Promise<void>;
  reload: () => void;
} {
  const { status: authStatus, timeZoneId, user, studioName } = useAuth();

  const [state, setState] = useState<InboxState>({
    conversations: [],
    counters: null,
    status: 'loading',
  });
  const [load, setLoad] = useState<ThreadLoad>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Two counters, because the two requests race independently: switching threads while the list is
  // refetching must not let either answer overwrite the other's newer one.
  const listGeneration = useRef(0);
  const threadGeneration = useRef(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // ---- The list ------------------------------------------------------------------------

  useEffect(() => {
    if (authStatus !== 'signedIn') {
      listGeneration.current++;
      return;
    }

    const current = ++listGeneration.current;

    void (async () => {
      try {
        const list = await messagingApi.listConversations({ limit: PAGE_SIZE });

        // Names before the first paint rather than after. Resolving them in a second pass would
        // render every row as "Kişi adı alınamadı" and then replace it, which reads as a bug in
        // the half-second it is on screen.
        await Promise.all(
          [...new Set(list.page.items.map((item) => item.contactId))].map(resolveContactName),
        );

        if (listGeneration.current !== current) return;

        const conversations = list.page.items
          .map((item) => toConversation(item, contactNames.get(item.contactId) ?? null, timeZoneId))
          .filter((row): row is Conversation => row !== null);

        setState({ conversations, counters: list.counters, status: 'ready' });

        // The first thread opens itself, which is what a two-pane inbox does — but only when the
        // person has not already chosen one, or a background refetch would yank them out of the
        // conversation they are reading.
        setActiveConversationId((chosen) =>
          chosen !== null && conversations.some((row) => row.id === chosen)
            ? chosen
            : conversations[0]?.id ?? null,
        );
      } catch {
        if (listGeneration.current !== current) return;

        setState((existing) => ({ ...existing, status: 'error' }));
      }
    })();
  }, [authStatus, reloadToken, timeZoneId]);

  // ---- The open thread -----------------------------------------------------------------

  useEffect(() => {
    if (authStatus !== 'signedIn' || activeConversationId === null) {
      // Nothing is written. `thread` below derives "idle" from the selection being null, so there
      // is no stale load to clear — which is what keeps this effect free of a synchronous setState.
      threadGeneration.current++;
      return;
    }

    const conversationId = activeConversationId;
    const current = ++threadGeneration.current;

    void (async () => {
      try {
        // Together: the header decides whether the composer is usable and the page fills it, and
        // running them in series would show a thread whose composer state arrives a beat later.
        const [detail, page] = await Promise.all([
          messagingApi.getConversation(conversationId),
          messagingApi.listMessages(conversationId, undefined, THREAD_SIZE),
        ]);

        const contact = await resolveContactName(detail.contactId);

        if (threadGeneration.current !== current) return;

        setLoad({
          conversationId,
          status: 'ready',
          detail,

          // The server returns newest first — that is what a thread opens on and what paging is
          // built for. Display runs the other way.
          messages: [...page.items].reverse().map((item) =>
            toChatMessage(
              item,
              conversationId,
              {
                contact: contact ?? '',
                self: SELF_LABEL,
                studio: studioName,
                selfStaffMemberId: user?.id ?? null,
              },
              timeZoneId,
            ),
          ),
        });
      } catch {
        if (threadGeneration.current !== current) return;

        setLoad({ conversationId, status: 'error' });
      }
    })();
  }, [authStatus, activeConversationId, timeZoneId, studioName, user?.id]);

  // What the screen renders: the held load when it is for the thread being asked for, and one of
  // the two empty answers when it is not.
  const thread: ThreadState =
    activeConversationId === null
      ? { detail: null, messages: [], status: 'idle' }
      : load?.conversationId === activeConversationId
        ? load.status === 'ready'
          ? { detail: load.detail, messages: load.messages, status: 'ready' }
          : { detail: null, messages: [], status: 'error' }
        : { detail: null, messages: [], status: 'loading' };

  // ---- Acts ----------------------------------------------------------------------------

  const select = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);

    // Optimistic, and the request is deliberately not awaited. See the note on the hook.
    setState((existing) => ({
      ...existing,
      conversations: existing.conversations.map((row) =>
        row.id === conversationId ? { ...row, unread: false } : row,
      ),
    }));

    void messagingApi.markConversationRead(conversationId).catch(() => {});
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (activeConversationId === null) return;

      const conversationId = activeConversationId;

      setSending(true);

      try {
        const message = await messagingApi.sendMessage(conversationId, { body: text });

        setLoad((current) =>
          // Guard against the thread having been switched while the send was in flight: appending
          // to whatever is open now would put the studio's reply in somebody else's conversation.
          current?.conversationId === conversationId && current.status === 'ready'
            ? {
                ...current,
                messages: [
                  ...current.messages,
                  toChatMessage(
                    message,
                    conversationId,
                    {
                      contact: contactNames.get(current.detail.contactId) ?? '',
                      self: SELF_LABEL,
                      studio: studioName,
                      selfStaffMemberId: user?.id ?? null,
                    },
                    timeZoneId,
                  ),
                ],
              }
            : current,
        );

        reload();
      } finally {
        setSending(false);
      }
    },
    [activeConversationId, studioName, user?.id, timeZoneId, reload],
  );

  const setStatus = useCallback(
    async (status: NonNullable<ConversationStatus>) => {
      if (activeConversationId === null) return;

      const detail = await messagingApi.setConversationStatus(activeConversationId, status);

      setLoad((current) =>
        current?.conversationId === detail.id && current.status === 'ready'
          ? { ...current, detail }
          : current,
      );

      // The row may leave the default filter entirely — `Spam` is excluded from it — so the list is
      // refetched rather than patched.
      reload();
    },
    [activeConversationId, reload],
  );

  const activeConversation =
    state.conversations.find((row) => row.id === activeConversationId) ?? null;

  return {
    ...state,
    thread,
    activeConversationId,
    activeConversation,
    sending,
    select,
    send,
    setStatus,
    reload,
  };
}

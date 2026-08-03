import { useCallback, useEffect, useRef, useState } from 'react';
import * as membersApi from '@/api/members';
import type { MemberCounts, MemberListItem, MemberQuery } from '@/api/members';

/** How long to wait after the last keystroke before asking the server. */
const SEARCH_DEBOUNCE_MS = 300;

export interface MemberListState {
  items: MemberListItem[];
  counts: MemberCounts;
  status: 'loading' | 'ready' | 'error';
  /** True while a page after the first is loading, so the list can stay on screen. */
  loadingMore: boolean;
  hasMore: boolean;
}

const EMPTY_COUNTS: MemberCounts = { total: 0, active: 0, frozen: 0, expiring: 0, lapsed: 0 };

/**
 * The members list, paged and filtered by the server.
 *
 * <b>The filtering moved off the client, and that is the point.</b> The panel loads every member
 * into memory and filters with `Array.filter`, which works for eight mock rows and does not work
 * for a studio with four hundred — and its KPI row is five hardcoded constants beside a list they
 * do not describe. Here the counters come back with the page, computed from the same predicate.
 *
 * <b>Search is debounced, paging is not.</b> Typing produces a request per pause; pressing "load
 * more" produces one immediately, because the person already waited to decide.
 *
 * A generation counter guards every response. Without it, a slow request for "ay" can land after a
 * fast one for "ayşe" and repopulate the list with results for a query nobody is looking at.
 */
export function useMemberList(
  query: MemberQuery,
): MemberListState & { loadMore: () => void; reload: () => void } {
  const [items, setItems] = useState<MemberListItem[]>([]);
  const [counts, setCounts] = useState<MemberCounts>(EMPTY_COUNTS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  // Bumped to re-run the effect without changing the filter. Adding a member has to move the
  // counters as well as the rows, and both come from the same request — so the answer is to ask
  // again rather than to splice the new member in and adjust a number by hand.
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  // Serialised rather than passed as an object: a new object literal every render would restart
  // the effect on every keystroke of an unrelated field.
  const key = JSON.stringify([
    query.search ?? '',
    query.state ?? [],
    query.coachId ?? null,
    query.includeArchived ?? false,
    query.sort ?? 'RecentlyJoined',
  ]);

  useEffect(() => {
    const current = ++generation.current;
    const isSearch = (query.search ?? '').length > 0;

    // Only a search waits. Changing a filter chip is a deliberate act and should feel immediate.
    const timer = setTimeout(
      () => {
        void (async () => {
          try {
            const page = await membersApi.listMembers({ ...query, cursor: undefined });

            if (generation.current !== current) return;

            setItems(page.page.items);
            setCounts(page.counts);
            setCursor(page.page.nextCursor ?? null);
            setStatus('ready');
          } catch {
            if (generation.current !== current) return;
            setStatus('error');
          }
        })();
      },
      isSearch ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => clearTimeout(timer);
    // `key` is the serialised filter; `query` itself changes identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  const reload = useCallback(() => setReloadToken((current) => current + 1), []);

  const loadMore = useCallback(() => {
    if (cursor === null || loadingMore) return;

    const current = generation.current;
    setLoadingMore(true);

    void (async () => {
      try {
        const page = await membersApi.listMembers({ ...query, cursor });

        // A filter changed while this page was in flight. Appending it would splice rows from the
        // previous filter into the current list, which reads as the filter not working.
        if (generation.current !== current) return;

        setItems((existing) => [...existing, ...page.page.items]);
        setCursor(page.page.nextCursor ?? null);
      } catch {
        // Left as-is on purpose: the rows already on screen are still correct, and replacing them
        // with an error state because page four failed would lose what the person was reading.
      } finally {
        if (generation.current === current) setLoadingMore(false);
      }
    })();
  }, [cursor, loadingMore, query]);

  return { items, counts, status, loadingMore, hasMore: cursor !== null, loadMore, reload };
}

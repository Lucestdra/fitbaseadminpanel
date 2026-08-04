import { useCallback, useEffect, useRef, useState } from 'react';
import * as leadsApi from '@/api/leads';
import type { LeadBoard, LeadCounts, LeadListItem, LeadQuery } from '@/api/leads';

/** How long to wait after the last keystroke before asking the server. */
const SEARCH_DEBOUNCE_MS = 300;

export interface LeadsState {
  items: LeadListItem[];
  board: LeadBoard | null;
  counts: LeadCounts;
  status: 'loading' | 'ready' | 'error';
  loadingMore: boolean;
  hasMore: boolean;
}

const EMPTY_COUNTS: LeadCounts = {
  total: 0,
  overdue: 0,
  unassigned: 0,
  convertedThisMonth: 0,
  lostThisMonth: 0,
};

/**
 * The pipeline, in whichever shape the screen is showing.
 *
 * <b>One filter, two shapes.</b> The list and the board take the identical query and the server
 * applies it identically, so switching view cannot change which leads are in scope. This hook
 * fetches whichever one the screen is on and keeps the other null — asking for both on every
 * keystroke would double the traffic to render one of them.
 *
 * <b>The counters come back with the page</b>, computed server-side from the same predicate as the
 * rows. The panel's five KPI tiles are hardcoded constants beside a list they do not describe, so
 * filtering changes the list and not the numbers over it.
 *
 * A generation counter guards every response: a slow request for "ay" can otherwise land after a
 * fast one for "ayşe" and repopulate the board with results for a query nobody is looking at.
 */
export function useLeads(
  query: LeadQuery,
  view: 'list' | 'board',
): LeadsState & { loadMore: () => void; reload: () => void } {
  const [items, setItems] = useState<LeadListItem[]>([]);
  const [board, setBoard] = useState<LeadBoard | null>(null);
  const [counts, setCounts] = useState<LeadCounts>(EMPTY_COUNTS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  // Serialised rather than passed as an object: a new object literal every render would restart
  // the effect on every keystroke of an unrelated field.
  const key = JSON.stringify([
    query.search ?? '',
    query.stageId ?? [],
    query.sourceId ?? [],
    query.assignedTo ?? [],
    query.overdueOnly ?? false,
    query.includeClosed ?? false,
    view,
  ]);

  useEffect(() => {
    const current = ++generation.current;
    const isSearch = (query.search ?? '').length > 0;

    // Only a search waits. Changing a filter chip or switching view is a deliberate act and should
    // feel immediate.
    const timer = setTimeout(
      () => {
        void (async () => {
          try {
            if (view === 'board') {
              const next = await leadsApi.getLeadBoard({ ...query, cursor: undefined });

              if (generation.current !== current) return;

              setBoard(next);
              setItems([]);
              setCounts(next.counts);
              setCursor(null);
            } else {
              const next = await leadsApi.listLeads({ ...query, cursor: undefined });

              if (generation.current !== current) return;

              setItems(next.page.items);
              setBoard(null);
              setCounts(next.counts);
              setCursor(next.page.nextCursor ?? null);
            }

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
    // The board pages per column and has no single cursor — one token cannot resume nine columns.
    if (cursor === null || loadingMore || view === 'board') return;

    const current = generation.current;
    setLoadingMore(true);

    void (async () => {
      try {
        const next = await leadsApi.listLeads({ ...query, cursor });

        // A filter changed while this page was in flight. Appending it would splice rows from the
        // previous filter into the current list, which reads as the filter not working.
        if (generation.current !== current) return;

        setItems((existing) => [...existing, ...next.page.items]);
        setCursor(next.page.nextCursor ?? null);
      } catch {
        // Left as-is on purpose: the rows already on screen are still correct, and replacing them
        // with an error state because page four failed would lose what the person was reading.
      } finally {
        if (generation.current === current) setLoadingMore(false);
      }
    })();
  }, [cursor, loadingMore, query, view]);

  return { items, board, counts, status, loadingMore, hasMore: cursor !== null, loadMore, reload };
}

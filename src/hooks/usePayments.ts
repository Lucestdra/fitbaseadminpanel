import { useCallback, useEffect, useRef, useState } from 'react';
import * as financeApi from '@/api/finance';
import type {
  PaymentCounters,
  PaymentListItem,
  PaymentQuery,
  ReceivableItem,
  ReceivablesQuery,
} from '@/api/finance';

/** How long to wait after the last keystroke before asking the server. */
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_COUNTERS: PaymentCounters = {
  collected: 0,
  refunded: 0,
  outstanding: 0,
  overdue: 0,
};

export interface PaymentsState {
  items: PaymentListItem[];
  counters: PaymentCounters;
  status: 'loading' | 'ready' | 'error';
  loadingMore: boolean;
  hasMore: boolean;
}

/**
 * The payments list, with the counters that describe it.
 *
 * <b>The counters arrive with the page.</b> They are computed server-side from the same predicate
 * as the rows, so narrowing to card payments in June moves the tiles too. The five tiles this
 * replaces were hardcoded constants — `'₺67.850'` written into `mock/payments.ts` — beside a list
 * they never described.
 *
 * A generation counter guards every response: a slow request for a wide date range can otherwise
 * land after a fast one for a narrow range and repopulate the table with rows nobody asked for.
 */
export function usePayments(query: PaymentQuery): PaymentsState & {
  loadMore: () => void;
  reload: () => void;
} {
  const [items, setItems] = useState<PaymentListItem[]>([]);
  const [counters, setCounters] = useState<PaymentCounters>(EMPTY_COUNTERS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  // Serialised rather than passed as an object: a new object literal every render would restart the
  // effect on every keystroke of an unrelated field.
  const key = JSON.stringify([
    query.memberId ?? '',
    query.from ?? '',
    query.to ?? '',
    query.method ?? [],
    query.status ?? [],
    query.search ?? '',
  ]);

  useEffect(() => {
    const current = ++generation.current;
    const isSearch = (query.search ?? '').length > 0;

    // Only a search waits. Changing a filter chip or a date range is a deliberate act and should
    // feel immediate.
    const timer = setTimeout(
      () => {
        void (async () => {
          try {
            const next = await financeApi.listPayments({ ...query, cursor: undefined });

            if (generation.current !== current) return;

            setItems(next.page.items);
            setCounters(next.counters);
            setCursor(next.page.nextCursor ?? null);
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
        const next = await financeApi.listPayments({ ...query, cursor });

        // A filter changed while this page was in flight. Appending it would splice rows from the
        // previous filter into the current list, which reads as the filter not working.
        if (generation.current !== current) return;

        setItems((existing) => [...existing, ...next.page.items]);
        setCursor(next.page.nextCursor ?? null);
      } catch {
        // Left as-is on purpose: the rows already on screen are still correct.
      } finally {
        if (generation.current === current) setLoadingMore(false);
      }
    })();
  }, [cursor, loadingMore, query]);

  return { items, counters, status, loadingMore, hasMore: cursor !== null, loadMore, reload };
}

export interface ReceivablesState {
  items: ReceivableItem[];
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  /** The grace period the server computed the answer with. Rendered, not guessed. */
  graceDays: number;
  status: 'loading' | 'ready' | 'error';
}

/**
 * What the studio is owed.
 *
 * <b>A separate request from the payments list, because it is a separate question.</b> A payment is
 * money that arrived; a receivable is money that has not. The panel had one list for both, with
 * `gecikti` as a payment status — which is how it ended up with a "Bekleyen Ödemeler" tile that
 * could only ever be a constant.
 *
 * Nothing here computes overdue. `isOverdue`, `daysOverdue` and `graceDays` all come from the
 * server, which asks the question against the studio's own today rather than the device's
 * (ADR-0033).
 */
export function useReceivables(query: ReceivablesQuery): ReceivablesState & { reload: () => void } {
  const [state, setState] = useState<ReceivablesState>({
    items: [],
    totalOutstanding: 0,
    totalOverdue: 0,
    overdueCount: 0,
    graceDays: 0,
    status: 'loading',
  });
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  const key = JSON.stringify([
    query.memberId ?? '',
    query.overdueOnly ?? false,
    query.dueBefore ?? '',
    query.limit ?? 25,
  ]);

  useEffect(() => {
    const current = ++generation.current;

    void (async () => {
      try {
        const next = await financeApi.listReceivables(query);

        if (generation.current !== current) return;

        setState({
          items: next.items,
          totalOutstanding: next.totalOutstanding,
          totalOverdue: next.totalOverdue,
          overdueCount: next.overdueCount,
          graceDays: next.graceDays,
          status: 'ready',
        });
      } catch {
        if (generation.current !== current) return;
        setState((existing) => ({ ...existing, status: 'error' }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  const reload = useCallback(() => setReloadToken((current) => current + 1), []);

  return { ...state, reload };
}

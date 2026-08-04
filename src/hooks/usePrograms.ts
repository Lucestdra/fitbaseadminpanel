import { useCallback, useEffect, useRef, useState } from 'react';
import * as programsApi from '@/api/programs';
import type { ProgramCounters, ProgramMonth, ProgramRosterEntry } from '@/api/programs';

const EMPTY_COUNTERS: ProgramCounters = { members: 0, withProgram: 0, delivered: 0 };

export interface ProgramRosterState {
  items: ProgramRosterEntry[];
  counters: ProgramCounters;
  /** The month the rows are about, as the server resolved it. Never guessed here. */
  month: ProgramMonth | null;
  /** Whether that month is the studio's current one, decided in the organization's zone. */
  isCurrentMonth: boolean;
  /** `Own` or `All`. Server-computed from the caller's permission, never requested. */
  scope: string;
  status: 'loading' | 'ready' | 'error';
}

/**
 * The programme screen for a month.
 *
 * <b>The month comes back from the server even when the client did not ask for one.</b> That is the
 * point: the studio's month is decided in the organization's time zone, and a coach opening the app
 * at 01:30 on the first while travelling would otherwise write into the month their laptop is in.
 * The panel builds `'Temmuz 2026'` from `new Date()` and keys the programme on it.
 *
 * A generation counter guards every response, so stepping quickly between months cannot leave the
 * previous month's rows on screen under the new month's heading.
 */
export function usePrograms(month: ProgramMonth | null): ProgramRosterState & {
  reload: () => void;
} {
  const [state, setState] = useState<ProgramRosterState>({
    items: [],
    counters: EMPTY_COUNTERS,
    month: null,
    isCurrentMonth: true,
    scope: 'Own',
    status: 'loading',
  });
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  // Serialised: a new object literal every render would restart the effect on every keystroke
  // anywhere on the page.
  const key = month === null ? 'current' : `${month.year}-${month.month}`;

  useEffect(() => {
    const current = ++generation.current;

    void (async () => {
      try {
        const roster = await programsApi.getRoster(month);

        if (generation.current !== current) return;

        setState({
          items: roster.items,
          counters: roster.counters,
          month: roster.month,
          isCurrentMonth: roster.isCurrentMonth,
          scope: roster.scope,
          status: 'ready',
        });
      } catch {
        if (generation.current !== current) return;
        setState((existing) => ({ ...existing, status: 'error' }));
      }
    })();
    // `key` is the serialised month; `month` itself changes identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...state, reload };
}

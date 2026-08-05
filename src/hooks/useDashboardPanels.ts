import { useEffect, useRef, useState } from 'react';
import * as schedulingApi from '@/api/scheduling';
import * as membersApi from '@/api/members';
import type { CalendarSession } from '@/api/scheduling';
import type { MemberListItem } from '@/api/members';

export interface TodayScheduleState {
  sessions: CalendarSession[];
  /** Null when generation has never run; a date past which the calendar does not exist yet. */
  materializedThrough: string | null;
  status: 'loading' | 'ready' | 'error';
}

/**
 * Today's sessions, in the studio's own day.
 *
 * <b>`today` is passed in from the organization's time zone, never from `new Date()`.</b> A coach
 * opening the app at 00:30 while travelling would otherwise be shown yesterday's classes under
 * today's heading — which is the same class of bug the programme month had.
 */
export function useTodaySchedule(today: string | null): TodayScheduleState {
  const [state, setState] = useState<TodayScheduleState>({
    sessions: [],
    materializedThrough: null,
    status: 'loading',
  });

  const generation = useRef(0);

  useEffect(() => {
    if (today === null) return;

    const current = ++generation.current;

    void (async () => {
      try {
        const view = await schedulingApi.getCalendar({ from: today, to: today });

        if (generation.current !== current) return;

        setState({
          sessions: view.sessions,
          materializedThrough: view.range.materializedThrough,
          status: 'ready',
        });
      } catch {
        if (generation.current !== current) return;
        setState((existing) => ({ ...existing, status: 'error' }));
      }
    })();
  }, [today]);

  return state;
}

export interface RenewalsState {
  members: MemberListItem[];
  status: 'loading' | 'ready' | 'error';
}

/** Members whose membership is closest to running out. */
export const RENEWAL_HORIZON_DAYS = 30;

/**
 * Who is due to renew.
 *
 * <b>`renewalDaysLeft` is computed by the server on every read, never stored</b> — the panel wrote
 * 30 into the record on create and let it sit there, so a member joined in March still showed
 * "30 gün kaldı" in June.
 *
 * Sorted and cut here rather than server-side: this is a fixed small page of active members, and
 * a dedicated "expiring soon" endpoint would be a second definition of a threshold the members
 * screen already owns.
 */
export function useRenewals(limit = 5): RenewalsState {
  const [state, setState] = useState<RenewalsState>({ members: [], status: 'loading' });

  const generation = useRef(0);

  useEffect(() => {
    const current = ++generation.current;

    void (async () => {
      try {
        const page = await membersApi.listMembers({ state: ['Active'], limit: 100 });

        if (generation.current !== current) return;

        const due = page.page.items
          .filter(
            (member) =>
              member.renewalDaysLeft !== null &&
              member.renewalDaysLeft !== undefined &&
              member.renewalDaysLeft <= RENEWAL_HORIZON_DAYS,
          )
          .sort((left, right) => (left.renewalDaysLeft ?? 0) - (right.renewalDaysLeft ?? 0))
          .slice(0, limit);

        setState({ members: due, status: 'ready' });
      } catch {
        if (generation.current !== current) return;
        setState((existing) => ({ ...existing, status: 'error' }));
      }
    })();
  }, [limit]);

  return state;
}

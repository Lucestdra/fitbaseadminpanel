import { useCallback, useEffect, useRef, useState } from 'react';
import * as schedulingApi from '@/api/scheduling';
import type { CalendarRange, CalendarSession } from '@/api/scheduling';
import { ApiError } from '@/api/problem';

export interface CalendarState {
  sessions: CalendarSession[];
  /** Null until the first response. Carries `materializedThrough` and the horizon. */
  range: CalendarRange | null;
  status: 'loading' | 'ready' | 'error';
  /** The stable error code, so the screen can say something specific about the horizon. */
  errorCode: string | null;
}

/**
 * The calendar for one window of real dates.
 *
 * <b>The window is dates, not a month index.</b> The panel's grid asked which mock sessions carried
 * a matching weekday id and painted them onto every such weekday forever; here the screen names a
 * `from` and a `to` and the server answers with the occurrences that actually fall in it.
 *
 * `range.materializedThrough` comes back with every response and is the thing the screen must read
 * before rendering an empty week — past it, "no classes" is a lie about a job rather than a fact
 * about the studio.
 *
 * A generation counter guards every response. Paging quickly through months otherwise lets a slow
 * request for March land after a fast one for May and repopulate the grid with the wrong month.
 */
export function useCalendar(query: schedulingApi.CalendarQuery): CalendarState & { reload: () => void } {
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [range, setRange] = useState<CalendarRange | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  // Serialised: a fresh object literal every render would restart the effect continuously.
  const key = JSON.stringify([
    query.from,
    query.to,
    query.coachId ?? null,
    query.classId ?? null,
    query.includeCancelled ?? false,
  ]);

  useEffect(() => {
    const current = ++generation.current;

    void (async () => {
      try {
        const view = await schedulingApi.getCalendar(query);

        if (generation.current !== current) return;

        setSessions(view.sessions);
        setRange(view.range);
        setErrorCode(null);
        setStatus('ready');
      } catch (error) {
        if (generation.current !== current) return;

        // The code, not the message. `scheduling.horizon.exceeded` is a state the screen renders
        // differently from a network failure — one is "we do not generate that far ahead" and the
        // other is "try again" — and branching on prose is how that distinction gets lost.
        setErrorCode(error instanceof ApiError ? error.code : null);
        setStatus('error');
      }
    })();
    // `key` is the serialised window; `query` itself changes identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  const reload = useCallback(() => setReloadToken((current) => current + 1), []);

  return { sessions, range, status, errorCode, reload };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import * as analyticsApi from '@/api/analytics';
import type { AnalyticsPeriod, DashboardView, ReportView } from '@/api/analytics';
import { ApiError, ProblemCode } from '@/api/problem';

export type AnalyticsStatus = 'loading' | 'ready' | 'error' | 'forbidden';

interface Loaded<TView> {
  view: TView | null;
  status: Exclude<AnalyticsStatus, 'loading'>;
  /** Which period the view above describes. Loading is derived from this, never set. */
  period: AnalyticsPeriod | null;
  /** Bumped by `reload`, so a refetch of the same period is still a change. */
  token: number;
}

export interface DashboardState {
  view: DashboardView | null;
  status: AnalyticsStatus;
}

export interface ReportState {
  view: ReportView | null;
  status: AnalyticsStatus;
}

/**
 * The dashboard for a period.
 *
 * <b>Nothing here decides what the caller may see.</b> The response carries whichever tiles their
 * permissions allow and a `scope` saying which shape came back; a coach's response simply has fewer
 * metrics in it. The panel hid tiles in the client, which is a decision anybody can undo with a
 * debugger.
 *
 * <b>Loading is derived, not set.</b> `react-hooks/set-state-in-effect` forbids a synchronous
 * `setState` in an effect body, and it is right to: the state is already knowable from the period
 * asked for versus the period the held view describes. A generation counter guards each response,
 * so switching period twice quickly cannot leave the first period's numbers under the second
 * period's heading.
 */
export function useDashboard(period: AnalyticsPeriod): DashboardState & { reload: () => void } {
  const [loaded, setLoaded] = useState<Loaded<DashboardView>>({
    view: null,
    status: 'ready',
    period: null,
    token: 0,
  });
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  useEffect(() => {
    const current = ++generation.current;

    void (async () => {
      try {
        const view = await analyticsApi.getDashboard(period);

        if (generation.current !== current) return;

        setLoaded({ view, status: 'ready', period, token: reloadToken });
      } catch (error) {
        if (generation.current !== current) return;

        setLoaded({ view: null, status: statusOf(error), period, token: reloadToken });
      }
    })();
  }, [period, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const settled = loaded.period === period && loaded.token === reloadToken;

  return {
    view: settled ? loaded.view : null,
    status: settled ? loaded.status : 'loading',
    reload,
  };
}

/**
 * The reports screen for a period.
 *
 * <b>403 is a distinct state, not an error.</b> A consultant opening `/raporlar` is not looking at a
 * broken screen — they are looking at one that is not theirs, and telling them so is the honest
 * answer. The server refuses; this hook carries the refusal rather than flattening it into
 * "something went wrong".
 */
export function useReports(period: AnalyticsPeriod): ReportState & { reload: () => void } {
  const [loaded, setLoaded] = useState<Loaded<ReportView>>({
    view: null,
    status: 'ready',
    period: null,
    token: 0,
  });
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  useEffect(() => {
    const current = ++generation.current;

    void (async () => {
      try {
        const view = await analyticsApi.getReports(period);

        if (generation.current !== current) return;

        setLoaded({ view, status: 'ready', period, token: reloadToken });
      } catch (error) {
        if (generation.current !== current) return;

        setLoaded({ view: null, status: statusOf(error), period, token: reloadToken });
      }
    })();
  }, [period, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const settled = loaded.period === period && loaded.token === reloadToken;

  return {
    view: settled ? loaded.view : null,
    status: settled ? loaded.status : 'loading',
    reload,
  };
}

/**
 * A refusal, told apart from a failure.
 *
 * Branches on the stable problem `code`, never on `detail` — the vocabulary register forbids
 * repurposing a code and says nothing about the sentence beside it.
 */
function statusOf(error: unknown): Exclude<AnalyticsStatus, 'loading'> {
  return error instanceof ApiError && error.code === ProblemCode.PermissionDenied
    ? 'forbidden'
    : 'error';
}

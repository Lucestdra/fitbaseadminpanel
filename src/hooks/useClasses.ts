import { useCallback, useEffect, useRef, useState } from 'react';
import * as schedulingApi from '@/api/scheduling';
import { useAuth } from '@/context/AuthContext';
import type { ClassSummary } from '@/api/scheduling';

export interface ClassesState {
  classes: ClassSummary[];
  status: 'loading' | 'ready' | 'error';
}

/**
 * The studio's timetable: what it runs, and when.
 *
 * <b>Retired classes come back too.</b> Two questions get asked of one list — "what can I schedule"
 * wants active classes, "what did this session belong to" wants all of them — and a retired class
 * still owns every session it produced. Fetching the wider set once and narrowing at the call site
 * answers both from one request.
 */
export function useClasses(): ClassesState & { reload: () => void } {
  const { status: authStatus } = useAuth();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  useEffect(() => {
    if (authStatus !== 'signedIn') {
      generation.current++;
      return;
    }

    const current = ++generation.current;

    void (async () => {
      const next = await fetchClasses();

      if (generation.current !== current) return;

      if (next === null) {
        setStatus('error');
        return;
      }

      setClasses(next);
      setStatus('ready');
    })();
  }, [authStatus, reloadToken]);

  const reload = useCallback(() => setReloadToken((current) => current + 1), []);

  return { classes, status, reload };
}

/** Null on failure, so the effect can branch without a try/catch straddling a setState. */
async function fetchClasses(): Promise<ClassSummary[] | null> {
  try {
    return await schedulingApi.listClasses(true);
  } catch {
    return null;
  }
}

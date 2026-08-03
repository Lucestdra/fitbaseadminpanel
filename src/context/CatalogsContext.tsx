import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as api from '@/api/catalogs';
import { useAuth } from '@/context/AuthContext';

/**
 * The catalogs, read from the server.
 *
 * <b>Two things that were quietly wrong are gone.</b>
 *
 * `slugify()` appended `Date.now()`, so "Pilates" became `pilates-1754049600000` — unique,
 * unreadable, and different on every device that created it. It also mapped Turkish letters by
 * hand and dropped `ı` on the floor. Keys are minted server-side now and never change on rename.
 *
 * `responsibles` is not here at all. It was a free-text name list duplicated from the Team screen,
 * and it never becomes a server concept — assignments key on `staff_member.id` (backend ADR-0016),
 * and the vocabulary register bans the name outright. The four screens that used it import the
 * mock directly until their own phase migrates them to the roster. That is deliberately uglier at
 * the call site: a mock reached through a context that otherwise talks to the server is a mock
 * nobody notices.
 *
 * No mutators either. Creating and deleting entries is the settings screen's job and it calls
 * `@/api/catalogs` directly — deletion in particular is a conversation (probe, then deactivate or
 * reassign or remove), not a function call, and hiding that behind `removeStage(id)` is what made
 * the old version look harmless.
 */
interface CatalogsContextValue {
  status: 'loading' | 'ready' | 'error';

  stages: api.LeadStageEntry[];
  leadSources: api.LeadSourceEntry[];
  interests: api.LabelledEntry[];
  classCategories: api.LabelledEntry[];
  packages: api.PackageTemplateEntry[];
  gifts: api.GiftTemplateEntry[];

  /** Re-reads everything. Called after a mutation so the other screens see it. */
  refresh: () => Promise<void>;
}

const CatalogsContext = createContext<CatalogsContextValue | null>(null);

const EMPTY: api.CatalogSnapshot = {
  leadStages: [],
  leadSources: [],
  interests: [],
  classCategories: [],
  packageTemplates: [],
  giftTemplates: [],
};

/**
 * Fetches, and reports failure as a value rather than an exception.
 *
 * Outside the component so both callers — the mount effect and `refresh` — share one definition
 * without either of them setting state before an `await`. That is not a style preference: setting
 * state synchronously inside an effect body costs a cascading render, and React's lint rule
 * refuses it.
 */
async function fetchSnapshot(): Promise<api.CatalogSnapshot | null> {
  try {
    return await api.getCatalogs();
  } catch {
    return null;
  }
}

export function CatalogsProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [snapshot, setSnapshot] = useState<api.CatalogSnapshot | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  // A counter rather than a boolean, so a response from a previous session cannot land after a
  // sign-out and repopulate the catalogs of a studio nobody is signed into any more.
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    const next = await fetchSnapshot();

    if (generation.current !== current) return;

    if (next === null) {
      // Held as an error rather than falling back to an empty snapshot. An empty catalog and a
      // catalog that failed to load render identically — a form with no options — and only one of
      // them is something the studio should be told about.
      setLoadState('error');
      return;
    }

    setSnapshot(next);
    setLoadState('ready');
  }, []);

  useEffect(() => {
    // Only once signed in. Catalogs are tenant-scoped, so asking before a session exists is a
    // guaranteed 401 and a pointless refresh attempt.
    //
    // Deliberately no setState on the signed-out branch: that state is derivable from `authStatus`
    // at render, and clearing it here would cost a render to reach a conclusion already available.
    if (authStatus !== 'signedIn') {
      generation.current++;
      return;
    }

    const current = ++generation.current;

    void (async () => {
      const next = await fetchSnapshot();

      if (generation.current !== current) return;

      if (next === null) {
        setLoadState('error');
        return;
      }

      setSnapshot(next);
      setLoadState('ready');
    })();
  }, [authStatus]);

  const value = useMemo<CatalogsContextValue>(() => {
    // Derived, not stored. Signed out means empty catalogs, and there is nothing to load.
    const signedIn = authStatus === 'signedIn';
    const current = signedIn ? (snapshot ?? EMPTY) : EMPTY;

    const status: CatalogsContextValue['status'] =
      authStatus === 'loading' ? 'loading' : signedIn ? loadState : 'ready';

    return {
      status,
      stages: current.leadStages,
      leadSources: current.leadSources,
      interests: current.interests,
      classCategories: current.classCategories,
      packages: current.packageTemplates,
      gifts: current.giftTemplates,
      refresh,
    };
  }, [authStatus, snapshot, loadState, refresh]);

  return <CatalogsContext.Provider value={value}>{children}</CatalogsContext.Provider>;
}

export function useCatalogs(): CatalogsContextValue {
  const ctx = useContext(CatalogsContext);
  if (!ctx) throw new Error('useCatalogs must be used within a CatalogsProvider');
  return ctx;
}

/**
 * Only the entries offered for new work.
 *
 * An inactive entry still resolves for rows that already reference it — that is what makes
 * deactivating a safe alternative to deleting — but it must not appear in a picker, or a studio
 * that retired a package would carry on selling it.
 */
export function activeOnly<T extends { status: 'Active' | 'Inactive' }>(entries: T[]): T[] {
  return entries.filter((entry) => entry.status === 'Active');
}

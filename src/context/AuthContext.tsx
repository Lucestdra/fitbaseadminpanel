import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as api from '@/api/session';
import { refreshSession, setSessionLostHandler } from '@/api/client';
import { clearTokens } from '@/api/tokens';
import { ROLE_LABEL, type AuthUser } from '@/types/auth';
import { initialsOf } from '@/utils/name';

/** Where the bootstrap got to. Rendering the tree before this settles is what causes a flash. */
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;

  /** The signed-in person, shaped for the screens that already read it. Null when signed out. */
  user: AuthUser | null;

  /** The studio's name. One source now — `me.organization.name` — rather than three copies. */
  studioName: string;

  /**
   * The studio's address, as the studio typed it into Ayarlar.
   *
   * Empty when unset, and callers render nothing rather than a placeholder. The line this replaced
   * was a hard-coded `'Kadıköy, İstanbul'` in the old `mock/navigation.ts`, under every studio's name
   * — the last of the three duplicated studio identities, and the only one that was wrong rather
   * than merely repeated.
   */
  studioAddress: string;

  /**
   * The studio's IANA zone.
   *
   * <b>Not the device's.</b> "Today" is an organization-local question — a member joined today,
   * a freeze starts today — and answering it from the device clock means a coach travelling puts
   * yesterday's date on a new member. Empty until the session loads; callers fall back to the
   * device, which is the same answer for everyone who is not travelling.
   */
  timeZoneId: string;

  roleLabel: string;

  /** Nav ids the server says this caller reaches, in sidebar order. */
  allowedNavIds: string[];

  /** Where to go after signing in: the first screen the server listed. */
  landingRoute: string;

  /** Permission string → scope. Only what the caller holds; absence is how something is denied. */
  permissions: Record<string, string>;

  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  /** Re-reads `/me`. Called after anything that can change a permission. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY_PERMISSIONS: Record<string, string> = {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [me, setMe] = useState<api.MeResponse | null>(null);

  const load = useCallback(async () => {
    const session = await api.fetchMe();
    setMe(session);
    setStatus('signedIn');
  }, []);

  // A session can end underneath any request — revoked from another device, a password changed,
  // a permission version the refresh could not catch up with. The client clears its tokens and
  // calls this; without it every screen would have to notice a 401 for itself.
  useEffect(() => {
    setSessionLostHandler(() => {
      setMe(null);
      setStatus('signedOut');
    });

    return () => setSessionLostHandler(() => {});
  }, []);

  // Bootstrap. On web the refresh cookie may already hold a session from a previous visit, and on
  // native SecureStore may hold a handle — so the app asks before deciding nobody is signed in.
  // Until this settles the tree renders a splash rather than the sign-in screen, because showing
  // sign-in to somebody who is already signed in is the flash this exists to prevent.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (await refreshSession()) {
          if (!cancelled) {
            await load();
          }
          return;
        }
      } catch {
        // Falls through to signed out. A bootstrap that threw would leave the app on its splash
        // for ever, which is worse than asking somebody to sign in again.
      }

      if (!cancelled) {
        setStatus('signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await api.signIn(email, password);
      await load();
    },
    [load],
  );

  const signOut = useCallback(async () => {
    await api.signOut();
    await clearTokens();
    setMe(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const navigation = me?.navigation ?? [];

    return {
      status,
      user: me ? toAuthUser(me) : null,
      studioName: me?.organization.name ?? '',
      studioAddress: me?.organization.address ?? '',
      timeZoneId: me?.organization.timeZoneId ?? '',
      roleLabel: me ? ROLE_LABEL[me.staffMember.role] : '',
      allowedNavIds: navigation.map((entry) => entry.id),

      // The server's first entry, not a client-side role map. A caller whose permissions change
      // lands somewhere different without this app being redeployed.
      landingRoute: navigation[0]?.route ?? '/',
      permissions: me?.permissions ?? EMPTY_PERMISSIONS,
      signIn,
      signOut,
      refresh: load,
    };
  }, [me, status, signIn, signOut, load]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Adapts the wire shape to what the screens already read.
 *
 * ADR-0012: the wire carries English `PascalCase` and this app holds the Turkish labels. The
 * adapter lives here so that exactly one place knows both vocabularies.
 */
function toAuthUser(me: api.MeResponse): AuthUser {
  return {
    id: me.staffMember.id,
    name: me.staffMember.fullName,
    role: me.staffMember.role,
    avatarInitials: initialsOf(me.staffMember.fullName),
    email: me.user.email,
  };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

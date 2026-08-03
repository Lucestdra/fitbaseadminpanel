import { useEffect, useRef, useState } from 'react';
import * as staffApi from '@/api/staff';
import { useAuth } from '@/context/AuthContext';
import type { StaffMemberSummary } from '@/api/staff';

/**
 * Who works here, for the assignment pickers.
 *
 * <b>Includes people who have left.</b> Two different questions get asked of one list: "who can I
 * assign this to" wants only current staff, and "whose name goes on this existing assignment" wants
 * everybody. Fetching the wider set once and narrowing at the call site answers both from one
 * request — and stops a member whose coach left from rendering as a member with no coach.
 *
 * Not a context, unlike the catalogs. The catalogs are read by nine screens; this is read by the
 * member form and the member drawer, and a provider around the whole tree for two callers is a
 * request on every screen that does not need one.
 */
export function useStaffRoster(): {
  roster: StaffMemberSummary[];
  status: 'loading' | 'ready' | 'error';
} {
  const { status: authStatus } = useAuth();
  const [roster, setRoster] = useState<StaffMemberSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const generation = useRef(0);

  useEffect(() => {
    if (authStatus !== 'signedIn') {
      generation.current++;
      return;
    }

    const current = ++generation.current;

    void (async () => {
      try {
        const next = await staffApi.listStaff(true);

        if (generation.current !== current) return;

        setRoster(next);
        setStatus('ready');
      } catch {
        if (generation.current !== current) return;

        // Held as an error rather than as an empty roster. A studio with no coaches and a failed
        // request render the same — an empty dropdown — and only one of them is worth saying.
        setStatus('error');
      }
    })();
  }, [authStatus]);

  return { roster, status };
}

/** The name for a staff id, or null when the id is not on the roster at all. */
export function nameOf(roster: StaffMemberSummary[], staffMemberId: string | null): string | null {
  if (!staffMemberId) return null;

  const found = roster.find((member) => member.id === staffMemberId);
  if (!found) return null;

  // Said out loud, because the alternative is a member who appears to have no coach when what
  // actually happened is that their coach left the studio.
  return found.status === 'Inactive' ? `${found.fullName} (ayrıldı)` : found.fullName;
}

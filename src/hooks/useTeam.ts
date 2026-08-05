import { useCallback, useEffect, useRef, useState } from 'react';
import * as staffApi from '@/api/staff';
import { useAuth } from '@/context/AuthContext';
import type {
  InviteStaffMemberBody,
  PendingInvitation,
  StaffMemberSummary,
  UpdateStaffMemberBody,
} from '@/api/staff';

export interface TeamState {
  /** Everyone on the roster, including people who have left and people not yet accepted. */
  roster: StaffMemberSummary[];
  /** Invitations neither accepted nor withdrawn. */
  invitations: PendingInvitation[];
  status: 'loading' | 'ready' | 'error';
}

/**
 * The Ekip screen's data.
 *
 * <b>Two lists, because the server has two.</b> A roster row exists from the moment somebody is
 * invited and sits at `Invited` until they accept; the invitation beside it is what can be resent
 * or withdrawn. The panel had one local array and no notion of either, so "adding" a team member
 * created an object with a `Date.now()` id that never reached a server and vanished on refresh.
 *
 * Inactive staff are included deliberately. A studio needs to see who used to work here — every
 * assignment they ever held still points at their id (ADR-0016), and a roster that hid them would
 * make those assignments look like they point at nobody.
 */
export function useTeam(): TeamState & {
  invite: (body: InviteStaffMemberBody) => Promise<void>;
  update: (staffMemberId: string, body: UpdateStaffMemberBody) => Promise<void>;
  resend: (invitationId: string) => Promise<void>;
  revoke: (invitationId: string) => Promise<void>;
} {
  const { status: authStatus } = useAuth();

  const [state, setState] = useState<TeamState>({
    roster: [],
    invitations: [],
    status: 'loading',
  });
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  useEffect(() => {
    if (authStatus !== 'signedIn') {
      generation.current++;
      return;
    }

    const current = ++generation.current;

    void (async () => {
      try {
        const [roster, invitations] = await Promise.all([
          staffApi.listStaff(true),
          staffApi.listInvitations(),
        ]);

        if (generation.current !== current) return;

        setState({ roster, invitations, status: 'ready' });
      } catch {
        if (generation.current !== current) return;

        // Held as an error rather than as two empty lists. A studio with no team and a failed
        // request render identically, and only one of them is worth saying out loud.
        setState((existing) => ({ ...existing, status: 'error' }));
      }
    })();
  }, [authStatus, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // Every mutation refetches rather than patching local state. Inviting somebody creates a roster
  // row *and* an invitation, and revoking removes both — reproducing that here would be a second
  // implementation of a rule the server already owns.
  const invite = useCallback(
    async (body: InviteStaffMemberBody) => {
      await staffApi.invite(body);
      reload();
    },
    [reload],
  );

  const resend = useCallback(
    async (invitationId: string) => {
      await staffApi.resendInvitation(invitationId);
      reload();
    },
    [reload],
  );

  const update = useCallback(
    async (staffMemberId: string, body: UpdateStaffMemberBody) => {
      await staffApi.updateStaffMember(staffMemberId, body);
      reload();
    },
    [reload],
  );

  const revoke = useCallback(
    async (invitationId: string) => {
      await staffApi.revokeInvitation(invitationId);
      reload();
    },
    [reload],
  );

  return { ...state, invite, update, resend, revoke };
}

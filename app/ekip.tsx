import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { TeamTable } from '@/components/team/TeamTable';
import { InviteStaffMemberModal } from '@/components/team/InviteStaffMemberModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme';
import { formatIsoDateLabel, localDateOf } from '@/utils/date';
import { ROLE_META } from '@/utils/staff';
import type { InviteStaffMemberBody } from '@/api/staff';
import type { KpiItem } from '@/types/dashboard';

/**
 * The Ekip screen.
 *
 * <b>A roster and an invitation list, because that is what the server has.</b> The panel's version
 * was a local CRUD table: "adding" somebody built an object with a `Date.now()` id that was never
 * emailed, never persisted and gone on refresh, and the edit drawer's Save wrote to `useState`.
 *
 * Four fields left the screen with the mock. `staff_member` carries a name, a role and a status —
 * no speciality, no phone, no joining date. The fifth, `attendanceRate`, is a trainer metric behind
 * `analytics.reports.read` (ADR-0038); showing it here would have reopened the leak the dashboard's
 * trainer card just had closed.
 *
 * <b>There is no edit path, and its absence is deliberate rather than pending.</b> No staff-update
 * endpoint exists, so a row that opened an editor would be an editor whose Save could not save.
 */
export default function TeamScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [inviteVisible, setInviteVisible] = useState(false);
  const { message, visible, show } = useToast();

  const { timeZoneId } = useAuth();
  const { roster, invitations, status, invite, resend, revoke } = useTeam();

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    if (!query) return roster;

    return roster.filter(
      (member) =>
        member.fullName.toLocaleLowerCase('tr').includes(query) ||
        ROLE_META[member.role].label.toLocaleLowerCase('tr').includes(query),
    );
  }, [roster, search]);

  /**
   * Counts of the rows below, not metrics.
   *
   * `KpiCard` rather than `MetricCard` on purpose: these count a list already on the screen and
   * have nothing to define, no polarity and no window. Anything from the metric register goes
   * through the other component.
   */
  const kpis: KpiItem[] = useMemo(
    () => [
      {
        id: 'team-total',
        title: 'Ekip Üyesi',
        value: String(roster.filter((member) => member.status !== 'Inactive').length),
        icon: 'people-outline',
      },
      {
        id: 'team-coaches',
        title: 'Eğitmen',
        value: String(
          roster.filter((member) => member.role === 'Coach' && member.status !== 'Inactive').length,
        ),
        icon: 'barbell-outline',
      },
      {
        id: 'team-invited',
        title: 'Davet Bekleyen',
        value: String(invitations.length),
        icon: 'mail-outline',
      },
      {
        id: 'team-left',
        title: 'Ayrılan',
        value: String(roster.filter((member) => member.status === 'Inactive').length),
        icon: 'exit-outline',
      },
    ],
    [roster, invitations],
  );

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '23%';

  const handleInvite = async (body: InviteStaffMemberBody) => {
    await invite(body);
    show(`${body.fullName} davet edildi. E-postasına bağlantı gönderildi.`);
  };

  return (
    <AppShell activeId="team">
      <ListPageHeader
        title="Ekip"
        subtitle="Eğitmenlerini ve stüdyo ekibini yönet."
        searchPlaceholder="Ara (isim, rol...)"
        searchValue={search}
        onSearchChange={setSearch}
        primaryActionLabel="Ekibe Davet Et"
        primaryActionIcon="add"
        onPrimaryAction={() => setInviteVisible(true)}
      />

      {status === 'error' ? (
        <Text style={styles.notice}>Ekip listesi yüklenemedi. Sayfayı yenilemeyi dene.</Text>
      ) : null}

      <View style={styles.kpiGrid}>
        {kpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      {/* A section the panel had no concept of. Somebody invited is on the roster and cannot yet
          sign in; without this list there is no telling a forgotten invitation from a colleague who
          simply has not got round to it. */}
      {invitations.length > 0 ? (
        <Card style={styles.invitations}>
          <SectionHeader title="Bekleyen Davetler" icon="mail-outline" />

          {invitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationRow}>
              <View style={styles.invitationInfo}>
                <Text style={styles.invitationName} numberOfLines={1}>
                  {invitation.fullName}
                </Text>
                <Text style={styles.invitationEmail} numberOfLines={1}>
                  {invitation.email}
                </Text>
              </View>

              <Badge
                label={ROLE_META[invitation.role].label}
                tone={ROLE_META[invitation.role].tone}
              />

              {/* An expired invitation is not a pending one. Saying which turns "chase them" into
                  "send a new link", which is a different action. */}
              <Text style={[styles.expiry, invitation.isExpired && styles.expired]}>
                {invitation.isExpired
                  ? 'Süresi doldu'
                  : `${formatIsoDateLabel(localDateOf(invitation.expiresAt, timeZoneId))} tarihine kadar geçerli`}
              </Text>

              <View style={styles.invitationActions}>
                <Pressable
                  onPress={() =>
                    void resend(invitation.id).then(() =>
                      show(`${invitation.fullName} için yeni bağlantı gönderildi.`),
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${invitation.fullName} davetini yeniden gönder`}
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                >
                  <Text style={styles.actionLabel}>Yeniden Gönder</Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    void revoke(invitation.id).then(() =>
                      show(`${invitation.fullName} daveti geri alındı.`),
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${invitation.fullName} davetini geri al`}
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                >
                  <Text style={[styles.actionLabel, styles.actionDanger]}>Geri Al</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <TeamTable members={filteredMembers} />

      <InviteStaffMemberModal
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        onInvite={handleInvite}
      />

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...typography.body,
    color: colors.textSecondary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  kpiItem: {
    flexGrow: 1,
    minWidth: 150,
  },
  invitations: {
    gap: spacing.md,
  },
  invitationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  invitationInfo: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  invitationName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  invitationEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  expiry: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  expired: {
    color: colors.critical,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionLabel: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  actionDanger: {
    color: colors.critical,
  },
});

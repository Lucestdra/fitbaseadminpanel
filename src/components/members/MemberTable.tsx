import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { MEMBER_BADGE_LABELS, MEMBER_BADGE_TONES } from '@/api/enums';
import { formatIsoDateLabel } from '@/utils/date';
import { initialsOf } from '@/utils/name';
import type { MemberListItem } from '@/api/members';

interface MemberTableProps {
  members: MemberListItem[];
  onMemberPress: (member: MemberListItem) => void;
}

/**
 * Initials from a name, computed at render.
 *
 * The panel stores `avatarInitials` on the member, which is one more field to keep in step with a
 * rename and no cheaper than deriving it.
 */
function sessionsColor(remaining: number | null) {
  if (remaining === null) return colors.info;
  if (remaining <= 0) return colors.critical;
  if (remaining <= 3) return colors.warning;
  return colors.textPrimary;
}

/**
 * How a member's remaining sessions read.
 *
 * `null` is unlimited, not zero and not missing — the server returns no number for an unlimited
 * package because there is no honest one to return.
 */
function sessionsLabel(item: MemberListItem): string {
  if (item.membershipState === 'NoMembership') return '—';
  if (item.sessionsTotal === null) return 'Sınırsız';
  return `${item.sessionsRemaining ?? 0} / ${item.sessionsTotal}`;
}

function renewalSubtext(daysLeft: number | null) {
  if (daysLeft === null) return null;
  if (daysLeft < 0) return { text: `${Math.abs(daysLeft)} gün gecikmiş`, color: colors.critical };
  if (daysLeft <= 7) return { text: `${daysLeft} gün kaldı`, color: colors.warning };
  return { text: `${daysLeft} gün kaldı`, color: colors.textSecondary };
}

/**
 * The members list.
 *
 * <b>"Son Ziyaret" is gone.</b> It was a formatted string on the mock and there is nothing behind
 * it yet: a last visit is the most recent attended booking, and attendance arrives in Phase 2.3.
 * A column reading "—" for everybody says so; one reading a stale date does not.
 */
export function MemberTable({ members, onMemberPress }: MemberTableProps) {
  const { isMobile } = useResponsiveLayout();

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {members.map((member) => {
          const renewal = renewalSubtext(member.renewalDaysLeft);

          return (
            <Pressable
              key={member.id}
              onPress={() => onMemberPress(member)}
              accessibilityRole="button"
              accessibilityLabel={`${member.fullName} detayını gör`}
            >
              <Card style={styles.mobileCard}>
                <View style={styles.mobileHeaderRow}>
                  <Avatar initials={initialsOf(member.fullName)} />
                  <View style={styles.mobileNameGroup}>
                    <Text style={styles.name} numberOfLines={1}>
                      {member.fullName}
                    </Text>
                    <Text style={styles.packageText} numberOfLines={1}>
                      {member.packageName ?? 'Üyelik yok'}
                    </Text>
                  </View>
                  <Badge
                    label={MEMBER_BADGE_LABELS[member.badge]}
                    tone={MEMBER_BADGE_TONES[member.badge]}
                  />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Kalan Ders</Text>
                  <Text
                    style={[
                      styles.mobileMetaValue,
                      { color: sessionsColor(member.sessionsRemaining) },
                    ]}
                  >
                    {sessionsLabel(member)}
                  </Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Telefon</Text>
                  <Text style={styles.mobileMetaValue}>{member.phoneNumber ?? '—'}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Yenileme</Text>
                  <View style={styles.mobileRenewalGroup}>
                    <Text style={styles.mobileMetaValue}>
                      {member.membershipEndsOn ? formatIsoDateLabel(member.membershipEndsOn) : '—'}
                    </Text>
                    {renewal ? (
                      <Text style={[styles.renewalSubtext, { color: renewal.color }]}>
                        {renewal.text}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <Card style={styles.card} noPadding>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, columnStyles.member]}>Üye</Text>
        <Text style={[styles.headerLabel, columnStyles.package]}>Paket</Text>
        <Text style={[styles.headerLabel, columnStyles.sessions]}>Kalan Ders</Text>
        <Text style={[styles.headerLabel, columnStyles.visit]}>Telefon</Text>
        <Text style={[styles.headerLabel, columnStyles.renewal]}>Yenileme</Text>
        <Text style={[styles.headerLabel, columnStyles.status]}>Durum</Text>
        <View style={columnStyles.menu} />
      </View>

      {members.map((member, index) => {
        const renewal = renewalSubtext(member.renewalDaysLeft);

        return (
          // The whole row opens the member, not just the chevron. The panel made a 32px target the
          // only way in, which is a hard thing to hit and an easy thing to not notice missing.
          <Pressable
            key={member.id}
            onPress={() => onMemberPress(member)}
            accessibilityRole="button"
            accessibilityLabel={`${member.fullName} detayını gör`}
            style={({ pressed }) => [
              styles.row,
              index === members.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={[styles.memberCell, columnStyles.member]}>
              <Avatar initials={initialsOf(member.fullName)} size={32} />
              <Text style={styles.name} numberOfLines={1}>
                {member.fullName}
              </Text>
            </View>
            <Text style={[styles.cellText, columnStyles.package]} numberOfLines={1}>
              {member.packageName ?? 'Üyelik yok'}
            </Text>
            <Text
              style={[
                styles.cellText,
                columnStyles.sessions,
                { color: sessionsColor(member.sessionsRemaining) },
              ]}
            >
              {sessionsLabel(member)}
            </Text>
            <Text style={[styles.cellText, columnStyles.visit]} numberOfLines={1}>
              {member.phoneNumber ?? '—'}
            </Text>
            <View style={columnStyles.renewal}>
              <Text style={styles.cellText}>
                {member.membershipEndsOn ? formatIsoDateLabel(member.membershipEndsOn) : '—'}
              </Text>
              {renewal ? (
                <Text style={[styles.renewalSubtext, { color: renewal.color }]}>
                  {renewal.text}
                </Text>
              ) : null}
            </View>
            <View style={columnStyles.status}>
              <Badge
                label={MEMBER_BADGE_LABELS[member.badge]}
                tone={MEMBER_BADGE_TONES[member.badge]}
              />
            </View>
            <View style={[columnStyles.menu, styles.menuButton]}>
              <AppIcon name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  member: { flex: 2.2 },
  package: { flex: 1.6 },
  sessions: { flex: 1 },
  visit: { flex: 1.3 },
  renewal: { flex: 1.5 },
  status: { flex: 1.3 },
  menu: { width: 32, alignItems: 'center' },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 64,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.pageBackground,
  },
  memberCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  packageText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cellText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  renewalSubtext: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  menuButton: {
    height: 32,
    borderRadius: radii.sm,
    justifyContent: 'center',
  },
  mobileList: {
    gap: spacing.md,
  },
  mobileCard: {
    gap: spacing.sm,
  },
  mobileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mobileNameGroup: {
    flex: 1,
    gap: 2,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mobileMetaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mobileMetaValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  mobileRenewalGroup: {
    alignItems: 'flex-end',
  },
});

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getMemberDisplayStatus } from '@/utils/members';
import type { Member } from '@/types/members';

interface MemberTableProps {
  members: Member[];
  onMemberPress: (member: Member) => void;
}

function sessionsColor(remaining: number | null) {
  if (remaining === null) return colors.info;
  if (remaining <= 0) return colors.critical;
  if (remaining <= 3) return colors.warning;
  return colors.textPrimary;
}

function renewalSubtext(daysLeft: number) {
  if (daysLeft < 0) return { text: `${Math.abs(daysLeft)} gün gecikmiş`, color: colors.critical };
  if (daysLeft <= 7) return { text: `${daysLeft} gün kaldı`, color: colors.warning };
  return { text: `${daysLeft} gün kaldı`, color: colors.textSecondary };
}

export function MemberTable({ members, onMemberPress }: MemberTableProps) {
  const { isMobile } = useResponsiveLayout();

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {members.map((member) => {
          const status = getMemberDisplayStatus(member);
          const renewal = renewalSubtext(member.renewalDaysLeft);
          const sessionsLabel = member.sessionsTotal === null ? 'Sınırsız' : `${member.sessionsRemaining} / ${member.sessionsTotal}`;
          return (
            <Pressable
              key={member.id}
              onPress={() => onMemberPress(member)}
              accessibilityRole="button"
              accessibilityLabel={`${member.name} detayını gör`}
            >
              <Card style={styles.mobileCard}>
                <View style={styles.mobileHeaderRow}>
                  <Avatar initials={member.avatarInitials} />
                  <View style={styles.mobileNameGroup}>
                    <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
                    <Text style={styles.packageText} numberOfLines={1}>{member.packageName}</Text>
                  </View>
                  <Badge label={status.label} tone={status.tone} />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Kalan Ders</Text>
                  <Text style={[styles.mobileMetaValue, { color: sessionsColor(member.sessionsRemaining) }]}>{sessionsLabel}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Son Ziyaret</Text>
                  <Text style={styles.mobileMetaValue}>{member.lastVisit}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Yenileme</Text>
                  <View style={styles.mobileRenewalGroup}>
                    <Text style={styles.mobileMetaValue}>{member.renewalDate}</Text>
                    <Text style={[styles.renewalSubtext, { color: renewal.color }]}>{renewal.text}</Text>
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
        <Text style={[styles.headerLabel, columnStyles.visit]}>Son Ziyaret</Text>
        <Text style={[styles.headerLabel, columnStyles.renewal]}>Yenileme</Text>
        <Text style={[styles.headerLabel, columnStyles.status]}>Durum</Text>
        <View style={columnStyles.menu} />
      </View>

      {members.map((member, index) => {
        const status = getMemberDisplayStatus(member);
        const renewal = renewalSubtext(member.renewalDaysLeft);
        const sessionsLabel = member.sessionsTotal === null ? 'Sınırsız' : `${member.sessionsRemaining} / ${member.sessionsTotal}`;
        return (
          <View key={member.id} style={[styles.row, index === members.length - 1 && styles.rowLast]}>
            <View style={[styles.memberCell, columnStyles.member]}>
              <Avatar initials={member.avatarInitials} size={32} />
              <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
            </View>
            <Text style={[styles.cellText, columnStyles.package]} numberOfLines={1}>{member.packageName}</Text>
            <Text style={[styles.cellText, columnStyles.sessions, { color: sessionsColor(member.sessionsRemaining) }]}>
              {sessionsLabel}
            </Text>
            <Text style={[styles.cellText, columnStyles.visit]}>{member.lastVisit}</Text>
            <View style={columnStyles.renewal}>
              <Text style={styles.cellText}>{member.renewalDate}</Text>
              <Text style={[styles.renewalSubtext, { color: renewal.color }]}>{renewal.text}</Text>
            </View>
            <View style={columnStyles.status}>
              <Badge label={status.label} tone={status.tone} />
            </View>
            <Pressable
              onPress={() => onMemberPress(member)}
              accessibilityRole="button"
              accessibilityLabel={`${member.name} için daha fazla işlem`}
              hitSlop={8}
              style={({ pressed }) => [columnStyles.menu, styles.menuButton, pressed && styles.menuButtonPressed]}
            >
              <AppIcon name="ellipsis-vertical" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
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
  menuButtonPressed: {
    backgroundColor: colors.pageBackground,
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

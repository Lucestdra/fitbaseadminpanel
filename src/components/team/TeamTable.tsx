import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { TeamMember, TeamRole, TeamStatus } from '@/types/team';

interface TeamTableProps {
  members: TeamMember[];
  onMemberPress: (member: TeamMember) => void;
}

const ROLE_META: Record<TeamRole, { label: string; tone: BadgeTone }> = {
  yonetici: { label: 'Yönetici', tone: 'dark' },
  egitmen: { label: 'Eğitmen', tone: 'mint' },
  satis: { label: 'Satış', tone: 'info' },
};

const STATUS_META: Record<TeamStatus, { label: string; tone: BadgeTone }> = {
  aktif: { label: 'Aktif', tone: 'mint' },
  izinli: { label: 'İzinli', tone: 'warning' },
  pasif: { label: 'Pasif', tone: 'neutral' },
};

export function TeamTable({ members, onMemberPress }: TeamTableProps) {
  const { isMobile } = useResponsiveLayout();

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {members.map((member) => {
          const role = ROLE_META[member.role];
          const status = STATUS_META[member.status];
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
                    <Text style={styles.specialty} numberOfLines={1}>{member.specialty ?? role.label}</Text>
                  </View>
                  <Badge label={status.label} tone={status.tone} />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Rol</Text>
                  <Badge label={role.label} tone={role.tone} />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>E-posta</Text>
                  <Text style={styles.mobileMetaValue} numberOfLines={1}>{member.email}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Telefon</Text>
                  <Text style={styles.mobileMetaValue} numberOfLines={1}>{member.phone}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Katılım</Text>
                  <Text style={styles.mobileMetaValue}>{member.attendanceRate !== null ? `%${member.attendanceRate}` : '—'}</Text>
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
        <Text style={[styles.headerLabel, columnStyles.member]}>Ad</Text>
        <Text style={[styles.headerLabel, columnStyles.role]}>Rol</Text>
        <Text style={[styles.headerLabel, columnStyles.contact]}>İletişim</Text>
        <Text style={[styles.headerLabel, columnStyles.attendance]}>Katılım</Text>
        <Text style={[styles.headerLabel, columnStyles.status]}>Durum</Text>
        <View style={columnStyles.menu} />
      </View>

      {members.map((member, index) => {
        const role = ROLE_META[member.role];
        const status = STATUS_META[member.status];
        return (
          <View key={member.id} style={[styles.row, index === members.length - 1 && styles.rowLast]}>
            <View style={[styles.memberCell, columnStyles.member]}>
              <Avatar initials={member.avatarInitials} size={32} />
              <View style={styles.memberTextGroup}>
                <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
                {member.specialty && <Text style={styles.specialty} numberOfLines={1}>{member.specialty}</Text>}
              </View>
            </View>
            <View style={columnStyles.role}>
              <Badge label={role.label} tone={role.tone} />
            </View>
            <View style={[styles.contactCell, columnStyles.contact]}>
              <Text style={styles.contactText} numberOfLines={1}>{member.email}</Text>
              <Text style={styles.contactSubtext} numberOfLines={1}>{member.phone}</Text>
            </View>
            <Text style={[styles.cellText, columnStyles.attendance]}>
              {member.attendanceRate !== null ? `%${member.attendanceRate}` : '—'}
            </Text>
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
  member: { flex: 1.8 },
  role: { flex: 1.1 },
  contact: { flex: 2.1 },
  attendance: { flex: 1 },
  status: { flex: 1 },
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
  memberTextGroup: {
    gap: 2,
    flexShrink: 1,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  specialty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  contactCell: {
    gap: 2,
  },
  contactText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  contactSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cellText: {
    ...typography.body,
    color: colors.textPrimary,
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
});

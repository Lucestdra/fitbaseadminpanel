import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { ROLE_META, STATUS_META, initialsOf } from '@/utils/staff';
import type { StaffMemberSummary } from '@/api/staff';

interface TeamTableProps {
  members: StaffMemberSummary[];
  /** Opens the edit sheet. Omitted for a caller without `organizations.staff.manage`. */
  onMemberPress?: (member: StaffMemberSummary) => void;
}

/**
 * Who is on the roster.
 *
 * <b>Four columns, because the server has four fields.</b> The panel's table also carried a
 * speciality, a phone number, a joining date and an attendance rate — none of which exists on
 * `staff_member`, and the last of which is a trainer metric behind `analytics.reports.read`
 * (ADR-0038). Showing it here would have re-opened the leak the dashboard's trainer card just had
 * closed.
 *
 * A row opens the edit sheet only when `onMemberPress` is supplied. A caller who cannot manage
 * staff gets a list rather than a disabled button — the two are the same information and only one
 * of them invites a click that goes nowhere.
 */
export function TeamTable({ members, onMemberPress }: TeamTableProps) {
  const { isMobile } = useResponsiveLayout();

  if (members.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>Aramaya uyan ekip üyesi yok.</Text>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {members.map((member) => {
          const role = ROLE_META[member.role];
          const status = STATUS_META[member.status];

          return (
            <Pressable
              key={member.id}
              disabled={!onMemberPress}
              onPress={() => onMemberPress?.(member)}
              accessibilityRole={onMemberPress ? 'button' : undefined}
              accessibilityLabel={onMemberPress ? `${member.fullName} düzenle` : undefined}
            >
              <Card style={styles.mobileCard}>
              <View style={styles.mobileHeaderRow}>
                <Avatar initials={initialsOf(member.fullName)} />
                <View style={styles.mobileNameGroup}>
                  <Text style={styles.name} numberOfLines={1}>
                    {member.fullName}
                  </Text>
                  <Text style={styles.roleText} numberOfLines={1}>
                    {role.label}
                  </Text>
                </View>
                <Badge label={status.label} tone={status.tone} />
              </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <Card noPadding>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, columnStyles.name]}>Ad Soyad</Text>
        <Text style={[styles.headerLabel, columnStyles.role]}>Rol</Text>
        <Text style={[styles.headerLabel, columnStyles.status]}>Durum</Text>
      </View>

      {members.map((member, index) => {
        const role = ROLE_META[member.role];
        const status = STATUS_META[member.status];

        return (
          <Pressable
            key={member.id}
            disabled={!onMemberPress}
            onPress={() => onMemberPress?.(member)}
            accessibilityRole={onMemberPress ? 'button' : undefined}
            accessibilityLabel={onMemberPress ? `${member.fullName} düzenle` : undefined}
            style={({ pressed }) => [
              styles.row,
              index === members.length - 1 && styles.rowLast,
              pressed && onMemberPress && styles.rowPressed,
            ]}
          >
            <View style={[styles.nameCell, columnStyles.name]}>
              <Avatar initials={initialsOf(member.fullName)} />
              <Text style={styles.name} numberOfLines={1}>
                {member.fullName}
              </Text>
            </View>

            <View style={columnStyles.role}>
              <Badge label={role.label} tone={role.tone} />
            </View>

            <View style={columnStyles.status}>
              <Badge label={status.label} tone={status.tone} />
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  name: { flex: 2.4 },
  role: { flex: 1, alignItems: 'flex-start' },
  status: { flex: 1, alignItems: 'flex-start' },
});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
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
    minHeight: 60,
    gap: spacing.md,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.pageBackground,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  roleText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mobileList: {
    gap: spacing.md,
  },
  mobileCard: {
    gap: spacing.md,
  },
  mobileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mobileNameGroup: {
    flex: 1,
    gap: 2,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

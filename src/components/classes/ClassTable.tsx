import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { describeSlots } from '@/utils/calendar';
import type { ClassSummary } from '@/api/scheduling';

interface ClassTableProps {
  classes: ClassSummary[];
  /** Catalog entry id → display name. Categories are user-editable, so the id is what is stored. */
  categoryNames: Record<string, string>;
  onEditClass: (item: ClassSummary) => void;
}

/**
 * The studio's classes.
 *
 * <b>The occupancy column is gone, and that is deliberate.</b> It read `averageOccupancy`, a
 * hardcoded constant on every mock row — `%82`, `%88`, `%79` — beside a product that had never
 * recorded a single attendance. Now that the register exists the number becomes computable, but it
 * is a rollup over past sessions and belongs with the rest of the reporting phase. A column showing
 * a real-looking percentage nobody can trace is worse than a column that is not there: the first
 * gets quoted in a meeting.
 */
export function ClassTable({ classes, categoryNames, onEditClass }: ClassTableProps) {
  const { isMobile } = useResponsiveLayout();

  if (classes.length === 0) {
    return (
      <Card style={styles.empty}>
        <Text style={styles.emptyText}>Henüz ders tanımlanmadı.</Text>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {classes.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onEditClass(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} dersini düzenle`}
          >
            <Card style={styles.mobileCard}>
              <View style={styles.mobileHeaderRow}>
                <View style={styles.mobileNameGroup}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.trainer} numberOfLines={1}>
                    {item.defaultCoachName ?? 'Eğitmen atanmadı'}
                  </Text>
                </View>
                <Badge
                  label={item.isActive ? 'Aktif' : 'Pasif'}
                  tone={item.isActive ? 'mint' : 'neutral'}
                />
              </View>

              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Kategori</Text>
                <Text style={styles.mobileMetaValue}>{categoryLabel(item, categoryNames)}</Text>
              </View>
              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Program</Text>
                <Text style={styles.mobileMetaValue}>{describeSlots(item.slots)}</Text>
              </View>
              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Kapasite</Text>
                <Text style={styles.mobileMetaValue}>{item.defaultCapacity}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <Card style={styles.card} noPadding>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, columnStyles.name]}>Ders Adı</Text>
        <Text style={[styles.headerLabel, columnStyles.category]}>Kategori</Text>
        <Text style={[styles.headerLabel, columnStyles.trainer]}>Eğitmen</Text>
        <Text style={[styles.headerLabel, columnStyles.schedule]}>Program</Text>
        <Text style={[styles.headerLabel, columnStyles.capacity]}>Kapasite</Text>
        <Text style={[styles.headerLabel, columnStyles.status]}>Durum</Text>
        <View style={columnStyles.menu} />
      </View>

      {classes.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={() => onEditClass(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name} dersini düzenle`}
          style={({ pressed }) => [
            styles.row,
            index === classes.length - 1 && styles.rowLast,
            pressed && styles.rowPressed,
          ]}
        >
          <Text style={[styles.name, columnStyles.name]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cellText, columnStyles.category]} numberOfLines={1}>
            {categoryLabel(item, categoryNames)}
          </Text>
          <Text style={[styles.cellText, columnStyles.trainer]} numberOfLines={1}>
            {item.defaultCoachName ?? '—'}
          </Text>
          <Text style={[styles.cellText, columnStyles.schedule]} numberOfLines={2}>
            {describeSlots(item.slots)}
          </Text>
          <Text style={[styles.cellText, columnStyles.capacity]}>{item.defaultCapacity}</Text>
          <View style={columnStyles.status}>
            <Badge
              label={item.isActive ? 'Aktif' : 'Pasif'}
              tone={item.isActive ? 'mint' : 'neutral'}
            />
          </View>
          <View style={[columnStyles.menu, styles.menuButton]}>
            <AppIcon name="ellipsis-vertical" size={16} color={colors.textSecondary} />
          </View>
        </Pressable>
      ))}
    </Card>
  );
}

/**
 * The category's name, or a marker that it is gone.
 *
 * A deleted catalog entry leaves the id pointing at nothing — there is no foreign key behind it
 * (ADR-0017), only the probe that should have blocked the delete. Saying so is better than
 * rendering an empty cell that reads as "no category".
 */
function categoryLabel(item: ClassSummary, names: Record<string, string>): string {
  if (item.categoryId === null) return '—';
  return names[item.categoryId] ?? 'Silinmiş kategori';
}

const columnStyles = StyleSheet.create({
  name: { flex: 1.5 },
  category: { flex: 1.3 },
  trainer: { flex: 1.3 },
  schedule: { flex: 2 },
  capacity: { flex: 0.8 },
  status: { flex: 1 },
  menu: { width: 32, alignItems: 'center' },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
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
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  trainer: {
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
  mobileList: {
    gap: spacing.md,
  },
  mobileCard: {
    gap: spacing.sm,
  },
  mobileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    gap: spacing.md,
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
    flexShrink: 1,
    textAlign: 'right',
  },
});

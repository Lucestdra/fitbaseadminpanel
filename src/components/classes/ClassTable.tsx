import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { ClassCategory, ClassDefinition, ClassStatus } from '@/types/classes';

interface ClassTableProps {
  classes: ClassDefinition[];
  onEditClass: (item: ClassDefinition) => void;
}

const CATEGORY_TONE: Record<ClassCategory, BadgeTone> = {
  Pilates: 'mint',
  Yoga: 'info',
  Fonksiyonel: 'warning',
  PT: 'dark',
};

const STATUS_META: Record<ClassStatus, { label: string; tone: BadgeTone }> = {
  aktif: { label: 'Aktif', tone: 'mint' },
  pasif: { label: 'Pasif', tone: 'neutral' },
};

function occupancyColor(value: number) {
  if (value >= 85) return colors.primaryDark;
  if (value < 60) return colors.warning;
  return colors.textPrimary;
}

export function ClassTable({ classes, onEditClass }: ClassTableProps) {
  const { isMobile } = useResponsiveLayout();

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {classes.map((item) => {
          const status = STATUS_META[item.status];
          return (
            <Pressable
              key={item.id}
              onPress={() => onEditClass(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} dersini düzenle`}
            >
              <Card style={styles.mobileCard}>
                <View style={styles.mobileHeaderRow}>
                  <View style={styles.mobileNameGroup}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.trainer} numberOfLines={1}>{item.trainer}</Text>
                  </View>
                  <Badge label={status.label} tone={status.tone} />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Kategori</Text>
                  <Badge label={item.category} tone={CATEGORY_TONE[item.category]} />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Program</Text>
                  <Text style={styles.mobileMetaValue}>{item.schedule}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Kapasite</Text>
                  <Text style={styles.mobileMetaValue}>{item.capacity}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Doluluk</Text>
                  <Text style={[styles.mobileMetaValue, { color: occupancyColor(item.averageOccupancy) }]}>
                    %{item.averageOccupancy}
                  </Text>
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
        <Text style={[styles.headerLabel, columnStyles.name]}>Ders Adı</Text>
        <Text style={[styles.headerLabel, columnStyles.category]}>Kategori</Text>
        <Text style={[styles.headerLabel, columnStyles.trainer]}>Eğitmen</Text>
        <Text style={[styles.headerLabel, columnStyles.schedule]}>Program</Text>
        <Text style={[styles.headerLabel, columnStyles.capacity]}>Kapasite</Text>
        <Text style={[styles.headerLabel, columnStyles.occupancy]}>Doluluk</Text>
        <Text style={[styles.headerLabel, columnStyles.status]}>Durum</Text>
        <View style={columnStyles.menu} />
      </View>

      {classes.map((item, index) => {
        const status = STATUS_META[item.status];
        return (
          <Pressable
            key={item.id}
            onPress={() => onEditClass(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} dersini düzenle`}
            style={({ pressed }) => [styles.row, index === classes.length - 1 && styles.rowLast, pressed && styles.rowPressed]}
          >
            <Text style={[styles.name, columnStyles.name]} numberOfLines={1}>{item.name}</Text>
            <View style={columnStyles.category}>
              <Badge label={item.category} tone={CATEGORY_TONE[item.category]} />
            </View>
            <Text style={[styles.cellText, columnStyles.trainer]} numberOfLines={1}>{item.trainer}</Text>
            <Text style={[styles.cellText, columnStyles.schedule]} numberOfLines={2}>{item.schedule}</Text>
            <Text style={[styles.cellText, columnStyles.capacity]}>{item.capacity}</Text>
            <Text style={[styles.cellText, columnStyles.occupancy, { color: occupancyColor(item.averageOccupancy) }]}>
              %{item.averageOccupancy}
            </Text>
            <View style={columnStyles.status}>
              <Badge label={status.label} tone={status.tone} />
            </View>
            <View style={[columnStyles.menu, styles.menuButton]}>
              <AppIcon name="ellipsis-vertical" size={16} color={colors.textSecondary} />
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  name: { flex: 1.5 },
  category: { flex: 1.3 },
  trainer: { flex: 1.3 },
  schedule: { flex: 1.6 },
  capacity: { flex: 0.7 },
  occupancy: { flex: 0.9 },
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

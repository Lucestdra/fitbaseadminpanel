import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { PackageTemplate } from '@/types/settings';

interface PackagesCardProps {
  packages: PackageTemplate[];
  onCreatePackage: () => void;
  onEditPackage: (pkg: PackageTemplate) => void;
  onDeletePackage: (pkg: PackageTemplate) => void;
}

export function PackagesCard({ packages, onCreatePackage, onEditPackage, onDeletePackage }: PackagesCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Paketler" icon="pricetag-outline" />

      <View style={styles.list}>
        {packages.map((pkg, index) => (
          <View key={pkg.id} style={[styles.row, index === packages.length - 1 && styles.rowLast]}>
            <View style={styles.infoGroup}>
              <Text style={styles.name} numberOfLines={1}>{pkg.name}</Text>
              <Text style={styles.meta}>
                {pkg.sessionCount === null ? 'Sınırsız' : `${pkg.sessionCount} seans`} · {pkg.durationDays} gün geçerli
              </Text>
            </View>
            <Text style={styles.price}>{pkg.price}</Text>
            <Badge label={pkg.status === 'aktif' ? 'Aktif' : 'Pasif'} tone={pkg.status === 'aktif' ? 'mint' : 'neutral'} />
            <View style={styles.rowActions}>
              <Pressable
                onPress={() => onEditPackage(pkg)}
                accessibilityRole="button"
                accessibilityLabel={`${pkg.name} düzenle`}
                hitSlop={8}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              >
                <AppIcon name="create-outline" size={16} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => onDeletePackage(pkg)}
                accessibilityRole="button"
                accessibilityLabel={`${pkg.name} sil`}
                hitSlop={8}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              >
                <AppIcon name="trash-outline" size={16} color={colors.critical} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onCreatePackage}
        accessibilityRole="button"
        accessibilityLabel="Yeni paket oluştur"
        style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
      >
        <AppIcon name="add-circle-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.createLabel}>Yeni Paket Oluştur</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  infoGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  price: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    minWidth: 70,
    textAlign: 'right',
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.mintLight,
  },
  createButtonPressed: {
    backgroundColor: '#DFF7EC',
  },
  createLabel: {
    ...typography.button,
    color: colors.primaryDark,
  },
});

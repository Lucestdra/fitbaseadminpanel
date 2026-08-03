import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { PackageTemplateEntry } from '@/api/catalogs';

interface PackagesCardProps {
  packages: PackageTemplateEntry[];
  onCreatePackage: () => void;
  onEditPackage: (pkg: PackageTemplateEntry) => void;
  onDeletePackage: (pkg: PackageTemplateEntry) => void;
}

export function PackagesCard({
  packages,
  onCreatePackage,
  onEditPackage,
  onDeletePackage,
}: PackagesCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Paketler" icon="pricetag-outline" />

      <View style={styles.list}>
        {packages.map((pkg, index) => (
          <View key={pkg.id} style={[styles.row, index === packages.length - 1 && styles.rowLast]}>
            <View style={styles.infoGroup}>
              <Text style={styles.name} numberOfLines={1}>
                {pkg.name}
              </Text>
              <Text style={styles.meta}>
                {pkg.sessionCount === null ? 'Sınırsız' : `${pkg.sessionCount} seans`} ·{' '}
                {pkg.durationDays} gün geçerli
              </Text>
            </View>
            {/*
              Formatted here, from a number. The value crossing the wire is a decimal — the panel
              used to store '₺2.400' and parse it back with a non-digit strip, which read
              ₺2.400,50 as 240050. `price` is null when the caller lacks members.financial.read,
              and the server omits it at the query rather than blanking it in the response.
            */}
            <Text style={styles.price}>
              {pkg.price === null
                ? '—'
                : `₺${pkg.price.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`}
            </Text>
            <Badge
              label={pkg.status === 'Active' ? 'Aktif' : 'Pasif'}
              tone={pkg.status === 'Active' ? 'mint' : 'neutral'}
            />
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

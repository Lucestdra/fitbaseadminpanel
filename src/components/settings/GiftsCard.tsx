import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { GiftTemplate } from '@/types/settings';

interface GiftsCardProps {
  gifts: GiftTemplate[];
  onCreateGift: () => void;
  onDeleteGift: (gift: GiftTemplate) => void;
}

export function GiftsCard({ gifts, onCreateGift, onDeleteGift }: GiftsCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Hediyeler" icon="gift-outline" />
      <Text style={styles.subtitle}>
        Üye eklerken veya satış yaparken verilebilecek hediye türlerini yönet.
      </Text>

      <View style={styles.list}>
        {gifts.map((gift, index) => (
          <View key={gift.id} style={[styles.row, index === gifts.length - 1 && styles.rowLast]}>
            <View style={styles.infoGroup}>
              <Text style={styles.name} numberOfLines={1}>{gift.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>{gift.description}</Text>
            </View>
            <Pressable
              onPress={() => onDeleteGift(gift)}
              accessibilityRole="button"
              accessibilityLabel={`${gift.name} sil`}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <AppIcon name="trash-outline" size={16} color={colors.critical} />
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onCreateGift}
        accessibilityRole="button"
        accessibilityLabel="Yeni hediye oluştur"
        style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
      >
        <AppIcon name="add-circle-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.createLabel}>Yeni Hediye Ekle</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
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

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { colors, spacing, typography, radii } from '@/theme';
import type { QuickAction } from '@/types/dashboard';

/**
 * Shortcuts to screens that exist.
 *
 * A constant rather than a mock import: these are navigation targets, not data. Every one routes
 * somewhere real — the two that only ever raised a toast saying "yakında" are gone, because a
 * button that does nothing teaches a studio the product is unreliable rather than unfinished.
 */
const quickActions: QuickAction[] = [
  { id: 'qa-new-member', label: 'Yeni Üye Ekle', icon: 'person-add-outline', toastMessage: '' },
  { id: 'qa-plan-trial', label: 'Deneme Planla', icon: 'sparkles-outline', toastMessage: '' },
  { id: 'qa-record-payment', label: 'Ödeme Kaydet', icon: 'card-outline', toastMessage: '' },
  { id: 'qa-create-class', label: 'Ders Oluştur', icon: 'add-circle-outline', toastMessage: '' },
];

interface QuickActionsCardProps {
  onActionPress?: (action: QuickAction) => void;
}

export function QuickActionsCard({ onActionPress }: QuickActionsCardProps) {
  const { message, visible, show } = useToast();

  return (
    <Card style={styles.card}>
      <SectionHeader title="Hızlı İşlemler" />

      <View style={styles.list}>
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => (onActionPress ? onActionPress(action) : show(action.toastMessage))}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <AppIcon name={action.icon} size={18} color={colors.primaryDark} />
            <Text style={styles.buttonLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Toast message={message} visible={visible} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  list: {
    gap: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.mintLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonPressed: {
    backgroundColor: '#DFF7EC',
  },
  buttonLabel: {
    ...typography.button,
    color: colors.primaryDark,
  },
});

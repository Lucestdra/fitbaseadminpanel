import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { colors, spacing, typography, radii } from '@/theme';
import type { QuickAction } from '@/types/dashboard';

interface QuickActionsGridProps {
  actions: QuickAction[];
  onActionPress?: (action: QuickAction) => void;
}

export function QuickActionsGrid({ actions, onActionPress }: QuickActionsGridProps) {
  const { message, visible, show } = useToast();

  return (
    <Card style={styles.card}>
      <SectionHeader title="Hızlı İşlemler" />

      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => (onActionPress ? onActionPress(action) : show(action.toastMessage))}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <AppIcon name={action.icon} size={17} color={colors.primaryDark} />
            <Text style={styles.buttonLabel} numberOfLines={1}>{action.label}</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.mintLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonPressed: {
    backgroundColor: '#DFF7EC',
  },
  buttonLabel: {
    ...typography.captionStrong,
    color: colors.primaryDark,
    flexShrink: 1,
  },
});

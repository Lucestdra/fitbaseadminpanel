import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography, cardShadow } from '@/theme';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...cardShadow,
  },
  text: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
});

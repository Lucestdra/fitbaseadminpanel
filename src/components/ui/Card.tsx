import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, radii, spacing, cardShadow } from '@/theme';

interface CardProps extends ViewProps {
  noPadding?: boolean;
}

export function Card({ style, noPadding, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    ...cardShadow,
  },
  noPadding: {
    padding: 0,
  },
});

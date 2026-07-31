import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography } from '@/theme';
import type { IconName } from '@/types/dashboard';

interface PlaceholderScreenProps {
  title: string;
  icon: IconName;
}

export function PlaceholderScreen({ title, icon }: PlaceholderScreenProps) {
  return (
    <Card style={styles.card}>
      <AppIcon name={icon} withBackground size={28} backgroundSize={64} />
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Bu sayfa yakında eklenecek.</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  textGroup: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.pageTitle,
    fontSize: 20,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography } from '@/theme';
import type { KpiItem } from '@/types/dashboard';

interface KpiCardProps {
  item: KpiItem;
  onPress?: () => void;
}

export function KpiCard({ item, onPress }: KpiCardProps) {
  const router = useRouter();
  const isPressable = Boolean(item.href) || Boolean(onPress);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (item.href) router.replace(item.href as never);
  };

  return (
    <Pressable
      disabled={!isPressable}
      onPress={handlePress}
      accessibilityRole={isPressable ? 'button' : undefined}
      accessibilityLabel={isPressable ? `${item.title} detayına git` : undefined}
      style={({ pressed, hovered }: any) => [
        styles.pressWrapper,
        isPressable && hovered && styles.hovered,
        isPressable && pressed && styles.pressed,
      ]}
    >
      <Card style={styles.card}>
        <AppIcon name={item.icon} withBackground size={19} />
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
        {item.change ? (
          <View style={styles.changeRow}>
            <AppIcon
              name={item.change.startsWith('↓') ? 'arrow-down-outline' : 'arrow-up-outline'}
              size={12}
              color={colors.primaryDark}
            />
            <Text style={styles.change} numberOfLines={1}>{item.change.replace(/^[↑↓]\s*/, '')}</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrapper: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
  },
  hovered: {
    transform: [{ translateY: -2 }],
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    ...typography.kpiTitle,
    color: colors.textSecondary,
  },
  value: {
    ...typography.kpiValue,
    color: colors.textPrimary,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  change: {
    ...typography.kpiChange,
    color: colors.primaryDark,
  },
});

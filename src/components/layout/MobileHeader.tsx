import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { LogoMark } from '@/components/ui/LogoMark';
import { colors, radii, spacing } from '@/theme';

interface MobileHeaderProps {
  onMenuPress: () => void;
}

export function MobileHeader({ onMenuPress }: MobileHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Menüyü aç"
        hitSlop={8}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
        <AppIcon name="menu-outline" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.logoRow}>
        <LogoMark size={22} />
        <Text style={styles.logoText}>fitbase</Text>
      </View>

      <View style={styles.menuButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

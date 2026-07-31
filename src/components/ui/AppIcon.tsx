import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/theme';
import type { IconName } from '@/types/dashboard';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  withBackground?: boolean;
  backgroundColor?: string;
  backgroundSize?: number;
}

export function AppIcon({
  name,
  size = 18,
  color = colors.primaryDark,
  withBackground = false,
  backgroundColor = colors.mintLight,
  backgroundSize = 40,
}: AppIconProps) {
  if (!withBackground) {
    return <Ionicons name={name} size={size} color={color} />;
  }

  return (
    <View
      style={[
        styles.circle,
        { width: backgroundSize, height: backgroundSize, borderRadius: backgroundSize / 2, backgroundColor },
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const iconColors = {
  positive: colors.primaryDark,
  warning: colors.warning,
  critical: colors.critical,
  info: colors.info,
};

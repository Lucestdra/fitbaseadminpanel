import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '@/theme';

interface AvatarProps {
  initials: string;
  size?: number;
}

export function Avatar({ initials, size = 36 }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radii.pill },
      ]}
      accessible
      accessibilityLabel={`${initials} profil resmi`}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

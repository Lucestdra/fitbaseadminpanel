import { Pressable, View, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, radii } from '@/theme';
import { CHANNEL_META, type ChannelConnection } from '@/types/messaging';

interface ConnectedChannelIconProps {
  channel: ChannelConnection;
  onPress: () => void;
}

export function ConnectedChannelIcon({ channel, onPress }: ConnectedChannelIconProps) {
  const meta = CHANNEL_META[channel.id];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${channel.label} bağlantı durumu, bağlı`}
      style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}
    >
      <View style={[styles.circle, { backgroundColor: meta.backgroundColor }]}>
        <AppIcon name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.statusDot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
  },
  wrapperPressed: {
    opacity: 0.8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
});

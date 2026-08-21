import { View, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, radii } from '@/theme';
import { CHANNEL_META, type MessagingChannelId } from '@/types/messaging';

interface AvatarWithBadgeProps {
  initials: string;
  channel: MessagingChannelId;
  size?: number;
  /** The contact's provider picture, when the channel gave one. Falls back to the initials. */
  imageUrl?: string | null;
}

export function AvatarWithBadge({ initials, channel, size = 44, imageUrl }: AvatarWithBadgeProps) {
  const meta = CHANNEL_META[channel];
  const badgeSize = Math.round(size * 0.4);

  return (
    <View style={{ width: size, height: size }}>
      <Avatar initials={initials} size={size} imageUrl={imageUrl} />
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: meta.backgroundColor,
          },
        ]}
      >
        <AppIcon name={meta.icon} size={badgeSize * 0.62} color={meta.color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBackground,
    borderRadius: radii.pill,
  },
});

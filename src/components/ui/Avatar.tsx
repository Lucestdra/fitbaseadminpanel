import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, radii } from '@/theme';

interface AvatarProps {
  initials: string;
  size?: number;
  /**
   * Where the provider serves the person's picture, when we have one.
   *
   * <b>Layered over the initials rather than swapped for them.</b> These URLs are Meta's, signed
   * and short-lived, so one that has expired must degrade to the letters that were already there
   * instead of to an empty circle — and `onError` is what makes that happen for a link that
   * resolved yesterday and does not today.
   */
  imageUrl?: string | null;
}

export function Avatar({ initials, size = 36, imageUrl }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  // Keyed on the URL so a contact whose picture is refreshed gets another attempt: without the
  // reset a single failure would pin the fallback for as long as the component stayed mounted.
  const showImage = Boolean(imageUrl) && !failed;

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

      {showImage && (
        <Image
          key={imageUrl}
          source={{ uri: imageUrl! }}
          style={[styles.image, { width: size, height: size, borderRadius: radii.pill }]}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

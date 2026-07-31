import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import { CHANNEL_META, type ChannelConnection } from '@/types/messaging';

interface ChannelConnectionCardProps {
  channel: ChannelConnection;
  onDisconnect: (channel: ChannelConnection) => void;
  onConnect: (channel: ChannelConnection) => void;
}

export function ChannelConnectionCard({ channel, onDisconnect, onConnect }: ChannelConnectionCardProps) {
  const meta = CHANNEL_META[channel.id];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: meta.backgroundColor }]}>
            <AppIcon name={meta.icon} size={20} color={meta.color} />
          </View>
          <View>
            <Text style={styles.title}>{channel.label}</Text>
            <Text style={styles.accountName} numberOfLines={1}>{channel.accountName}</Text>
          </View>
        </View>
        <Badge label={channel.connected ? 'Bağlı' : 'Bağlı Değil'} tone={channel.connected ? 'mint' : 'neutral'} />
      </View>

      {channel.connected ? (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bağlantı Tarihi</Text>
            <Text style={styles.statValue}>{channel.connectedSince}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Son Senkron</Text>
            <Text style={styles.statValue}>{channel.lastSync}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Oluşan Müşteri Adayı</Text>
            <Text style={styles.statValue}>{channel.leadsGenerated}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.disconnectedText}>
          Bu kanalı bağlayarak gelen mesajlardan otomatik müşteri adayı oluşturmaya başla.
        </Text>
      )}

      <Pressable
        onPress={() => (channel.connected ? onDisconnect(channel) : onConnect(channel))}
        accessibilityRole="button"
        accessibilityLabel={channel.connected ? `${channel.label} bağlantısını kes` : `${channel.label} hesabını bağla`}
        style={({ pressed }) => [
          styles.actionButton,
          channel.connected ? styles.actionButtonOutline : styles.actionButtonPrimary,
          pressed && (channel.connected ? styles.actionButtonOutlinePressed : styles.actionButtonPrimaryPressed),
        ]}
      >
        <AppIcon
          name={channel.connected ? 'unlink-outline' : 'link-outline'}
          size={16}
          color={channel.connected ? colors.textSecondary : colors.white}
        />
        <Text style={[styles.actionLabel, { color: channel.connected ? colors.textSecondary : colors.white }]}>
          {channel.connected ? 'Bağlantıyı Kes' : 'Hesabı Bağla'}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  accountName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  statItem: {
    gap: 2,
    minWidth: 100,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  disconnectedText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radii.md,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonPrimaryPressed: {
    backgroundColor: colors.primaryDark,
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  actionButtonOutlinePressed: {
    backgroundColor: colors.pageBackground,
  },
  actionLabel: {
    ...typography.button,
  },
});

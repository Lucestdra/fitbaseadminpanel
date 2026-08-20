import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import {
  CHANNEL_META,
  CHANNEL_STATUS_LABELS,
  CHANNEL_STATUS_REMEDIES,
  CHANNEL_STATUS_TONES,
  type ChannelConnection,
} from '@/types/messaging';

interface ChannelConnectionCardProps {
  channel: ChannelConnection;
  /**
   * Whether this caller holds `integrations.manage`.
   *
   * False hides the action rather than disabling it. A greyed-out button invites somebody to keep
   * pressing it; the sentence that replaces it says who can, which is the thing a coach actually
   * needs in order to get the channel connected.
   */
  canManage: boolean;
  onDisconnect: (channel: ChannelConnection) => void;
  onConnect: (channel: ChannelConnection) => void;
}

/** The statuses that mean messages are flowing, or would be but for a transient fault. */
const LIVE: ChannelConnection['status'][] = ['Active', 'Degraded'];

/**
 * One channel, and what a studio can do about it.
 *
 * <b>Reads a status, not a boolean.</b> The version this replaces rendered `connected ? 'Bağlı' :
 * 'Bağlı Değil'`, which collapsed an expired token, a suspended connection and a studio that never
 * authorized into one label with one button. Each of those needs a different sentence and two of
 * them need a different action, which is why `ChannelConnectionStatus` has eight values.
 */
export function ChannelConnectionCard({
  channel,
  canManage,
  onDisconnect,
  onConnect,
}: ChannelConnectionCardProps) {
  const meta = CHANNEL_META[channel.id];
  const live = LIVE.includes(channel.status);
  const remedy = CHANNEL_STATUS_REMEDIES[channel.status];

  // Re-authorizing is connecting again, not disconnecting first. Offering "Bağlantıyı Kes" to
  // somebody whose token expired would ask them to throw away the connection to fix it.
  const primaryIsConnect = !live;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: meta.backgroundColor }]}>
            <AppIcon name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{channel.label}</Text>
            <Text style={styles.accountName} numberOfLines={1}>
              {channel.accountName ?? meta.flowSummary}
            </Text>
          </View>
        </View>
        <Badge
          label={CHANNEL_STATUS_LABELS[channel.status]}
          tone={CHANNEL_STATUS_TONES[channel.status]}
        />
      </View>

      {remedy ? (
        <View style={styles.remedy}>
          <AppIcon name="alert-circle-outline" size={15} color={colors.warning} />
          <Text style={styles.remedyText}>{remedy}</Text>
        </View>
      ) : null}

      {live ? (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bağlantı Tarihi</Text>
            <Text style={styles.statValue}>{channel.connectedSince ?? '—'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Son Gelen Mesaj</Text>
            {/* Null on a live connection is worth showing rather than hiding: it is either a quiet
                studio or a subscription that stopped delivering, and only one of those is fine. */}
            <Text style={styles.statValue}>{channel.lastInboundAt ?? 'Henüz yok'}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.disconnectedText}>
          Bağladığında bu kanaldan gelen mesajları buradan okuyup yanıtlarsın.
        </Text>
      )}

      {!canManage ? (
        <Text style={styles.noPermission}>
          Kanal bağlantılarını yalnızca stüdyo yöneticisi yönetebilir.
        </Text>
      ) : (
        <Pressable
          onPress={() => (primaryIsConnect ? onConnect(channel) : onDisconnect(channel))}
          accessibilityRole="button"
          accessibilityLabel={
            primaryIsConnect
              ? `${channel.label} hesabını bağla`
              : `${channel.label} bağlantısını kes`
          }
          style={({ pressed }) => [
            styles.actionButton,
            primaryIsConnect ? styles.actionButtonPrimary : styles.actionButtonOutline,
            pressed &&
              (primaryIsConnect
                ? styles.actionButtonPrimaryPressed
                : styles.actionButtonOutlinePressed),
          ]}
        >
          <AppIcon
            name={primaryIsConnect ? 'link-outline' : 'unlink-outline'}
            size={16}
            color={primaryIsConnect ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionLabel,
              { color: primaryIsConnect ? colors.white : colors.textSecondary },
            ]}
          >
            {channel.status === 'ReauthorizationRequired'
              ? 'Yeniden Yetkilendir'
              : primaryIsConnect
                ? 'Hesabı Bağla'
                : 'Bağlantıyı Kes'}
          </Text>
        </Pressable>
      )}
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
  headerText: {
    flexShrink: 1,
    minWidth: 0,
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
  remedy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.warningLight,
  },
  remedyText: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
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
  noPermission: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

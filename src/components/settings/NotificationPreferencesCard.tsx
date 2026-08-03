import { View, Text, Switch, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography } from '@/theme';
import type {
  NotificationChannel,
  NotificationPreference,
  NotificationTopic,
} from '@/api/settings';

interface NotificationPreferencesCardProps {
  preferences: NotificationPreference[];
  onToggle: (topic: NotificationTopic, channel: NotificationChannel, isEnabled: boolean) => void;
  busy: boolean;
}

/** What each topic is, in the studio's words. */
const TOPIC_LABEL: Record<NotificationTopic, { label: string; description: string }> = {
  NewLead: {
    label: 'Yeni Müşteri Adayı',
    description: 'Web formu, gelen mesaj veya elle eklenen bir aday olduğunda.',
  },
  PaymentReceived: {
    label: 'Ödeme Alındı',
    description: 'Bir ödeme kaydedildiğinde.',
  },
  AppointmentReminder: {
    label: 'Randevu Hatırlatması',
    description: 'Yaklaşan seans ve randevular için üyeye gönderilir.',
  },
  WeeklyDigest: {
    label: 'Haftalık Özet',
    description: 'Her pazartesi performans özeti.',
  },
};

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  Email: 'E-posta',
  Sms: 'SMS',
  Push: 'Anlık bildirim',
};

/**
 * The notification matrix.
 *
 * <b>Topic and channel are separate</b>, which the panel's four switches conflated: "SMS
 * Bildirimleri" was described as *randevu hatırlatmaları ve iptaller*, so it was really
 * AppointmentReminder × SMS, while "Haftalık Özet Raporu" named no channel at all. Splitting them
 * is what makes "e-posta gönder ama SMS gönderme" expressible.
 *
 * <b>A channel with no sender behind it renders as unavailable, not as a switch.</b> The server
 * refuses to store a preference it cannot honour, and a toggle that silently does nothing is the
 * same failure as a gift template that grants nothing — it looks like it works until somebody
 * waits for a message that never comes.
 */
export function NotificationPreferencesCard({
  preferences,
  onToggle,
  busy,
}: NotificationPreferencesCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Bildirim Ayarları" icon="notifications-outline" />

      <View style={styles.list}>
        {preferences.map((pref, index) => {
          const topic = TOPIC_LABEL[pref.topic];

          return (
            <View
              key={`${pref.topic}-${pref.channel}`}
              style={[styles.row, index === preferences.length - 1 && styles.rowLast]}
            >
              <View style={styles.textGroup}>
                <Text style={styles.label}>
                  {topic?.label ?? pref.topic} · {CHANNEL_LABEL[pref.channel] ?? pref.channel}
                </Text>
                <Text style={styles.description}>
                  {pref.isAvailable
                    ? (topic?.description ?? '')
                    : `${CHANNEL_LABEL[pref.channel] ?? pref.channel} kanalı henüz kullanılamıyor.`}
                </Text>
              </View>
              {pref.isAvailable ? (
                <Switch
                  value={pref.isEnabled}
                  onValueChange={(value) => onToggle(pref.topic, pref.channel, value)}
                  disabled={busy}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                  accessibilityLabel={`${topic?.label ?? pref.topic} aç/kapat`}
                />
              ) : (
                <Text style={styles.unavailable}>Yakında</Text>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  unavailable: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.lg,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

import { View, Text, Switch, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography } from '@/theme';
import type { NotificationPreference } from '@/types/settings';

interface NotificationPreferencesCardProps {
  preferences: NotificationPreference[];
  onToggle: (id: string, value: boolean) => void;
}

export function NotificationPreferencesCard({ preferences, onToggle }: NotificationPreferencesCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Bildirim Ayarları" icon="notifications-outline" />

      <View style={styles.list}>
        {preferences.map((pref, index) => (
          <View key={pref.id} style={[styles.row, index === preferences.length - 1 && styles.rowLast]}>
            <View style={styles.textGroup}>
              <Text style={styles.label}>{pref.label}</Text>
              <Text style={styles.description}>{pref.description}</Text>
            </View>
            <Switch
              value={pref.enabled}
              onValueChange={(value) => onToggle(pref.id, value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              accessibilityLabel={`${pref.label} aç/kapat`}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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

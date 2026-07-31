import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography, radii } from '@/theme';
import type { WorkingHoursDay } from '@/types/settings';

interface WorkingHoursCardProps {
  days: WorkingHoursDay[];
  onToggleDay: (dayId: string, isOpen: boolean) => void;
  onChangeStart: (dayId: string, value: string) => void;
  onChangeEnd: (dayId: string, value: string) => void;
}

export function WorkingHoursCard({ days, onToggleDay, onChangeStart, onChangeEnd }: WorkingHoursCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Çalışma Saatleri" icon="time-outline" />

      <View style={styles.list}>
        {days.map((day, index) => (
          <View key={day.id} style={[styles.row, index === days.length - 1 && styles.rowLast]}>
            <Switch
              value={day.isOpen}
              onValueChange={(value) => onToggleDay(day.id, value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              accessibilityLabel={`${day.label} çalışma durumu`}
            />
            <Text style={styles.dayLabel}>{day.label}</Text>
            {day.isOpen ? (
              <View style={styles.timeGroup}>
                <TextInput
                  value={day.start}
                  onChangeText={(value) => onChangeStart(day.id, value)}
                  style={styles.timeInput}
                  accessibilityLabel={`${day.label} açılış saati`}
                />
                <Text style={styles.timeSeparator}>–</Text>
                <TextInput
                  value={day.end}
                  onChangeText={(value) => onChangeEnd(day.id, value)}
                  style={styles.timeInput}
                  accessibilityLabel={`${day.label} kapanış saati`}
                />
              </View>
            ) : (
              <Text style={styles.closedLabel}>Kapalı</Text>
            )}
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  dayLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeInput: {
    ...typography.captionStrong,
    color: colors.textPrimary,
    width: 64,
    height: 36,
    textAlign: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  timeSeparator: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closedLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

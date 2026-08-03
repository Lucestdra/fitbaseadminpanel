import { useState } from 'react';
import { View, Text, TextInput, Switch, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography, radii } from '@/theme';
import type { BusinessHourInterval } from '@/api/settings';

interface WorkingHoursCardProps {
  intervals: BusinessHourInterval[];
  onSave: (intervals: BusinessHourInterval[]) => Promise<void>;
  busy: boolean;
}

/** Monday first, matching the studio's week rather than JavaScript's Sunday-first ordering. */
const WEEK: { day: BusinessHourInterval['dayOfWeek']; label: string }[] = [
  { day: 'Monday', label: 'Pazartesi' },
  { day: 'Tuesday', label: 'Salı' },
  { day: 'Wednesday', label: 'Çarşamba' },
  { day: 'Thursday', label: 'Perşembe' },
  { day: 'Friday', label: 'Cuma' },
  { day: 'Saturday', label: 'Cumartesi' },
  { day: 'Sunday', label: 'Pazar' },
];

/** `08:00:00` on the wire, `08:00` in the field. */
function toField(value: string): string {
  return value.slice(0, 5);
}

function toWire(value: string): string {
  return /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}

/**
 * The studio's weekly opening hours.
 *
 * <b>Saved as a whole week</b>, because that is what the server replaces. Editing a field used to
 * mutate a mock array with no save at all; here the changes are local until Kaydet, which is also
 * what stops a half-typed "0" in an hour field being sent as a time.
 *
 * A day that is switched off keeps its hours rather than clearing them, so turning it back on does
 * not mean retyping. The server stores `is_open` beside the times for the same reason.
 *
 * <b>One interval per day here, several in the model.</b> A studio that closes for lunch is
 * expressible server-side and this form cannot express it yet; it renders the first interval of
 * each day and saves that. Adding the second row is a UI change, not a schema one.
 */
export function WorkingHoursCard({ intervals, onSave, busy }: WorkingHoursCardProps) {
  // Seeded once, at mount. The settings screen mounts this card only while its section is open, so
  // reopening it after a save picks up the server's copy without an effect watching the prop.
  const [draft, setDraft] = useState(intervals);

  const forDay = (day: BusinessHourInterval['dayOfWeek']): BusinessHourInterval =>
    draft.find((interval) => interval.dayOfWeek === day) ?? {
      dayOfWeek: day,
      opensAt: '09:00:00',
      closesAt: '18:00:00',
      isOpen: false,
    };

  const update = (day: BusinessHourInterval['dayOfWeek'], change: Partial<BusinessHourInterval>) =>
    setDraft((current) => {
      const existing = current.find((interval) => interval.dayOfWeek === day);
      const next = { ...forDay(day), ...change };

      return existing
        ? current.map((interval) => (interval.dayOfWeek === day ? next : interval))
        : [...current, next];
    });

  return (
    <Card style={styles.card}>
      <SectionHeader title="Çalışma Saatleri" icon="time-outline" />

      <View style={styles.list}>
        {WEEK.map(({ day, label }, index) => {
          const interval = forDay(day);

          return (
            <View key={day} style={[styles.row, index === WEEK.length - 1 && styles.rowLast]}>
              <Switch
                value={interval.isOpen}
                onValueChange={(value) => update(day, { isOpen: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                accessibilityLabel={`${label} çalışma durumu`}
              />
              <Text style={styles.dayLabel}>{label}</Text>
              {interval.isOpen ? (
                <View style={styles.timeGroup}>
                  <TextInput
                    value={toField(interval.opensAt)}
                    onChangeText={(value) => update(day, { opensAt: toWire(value) })}
                    style={styles.timeInput}
                    accessibilityLabel={`${label} açılış saati`}
                  />
                  <Text style={styles.timeSeparator}>–</Text>
                  <TextInput
                    value={toField(interval.closesAt)}
                    onChangeText={(value) => update(day, { closesAt: toWire(value) })}
                    style={styles.timeInput}
                    accessibilityLabel={`${label} kapanış saati`}
                  />
                </View>
              ) : (
                <Text style={styles.closedLabel}>Kapalı</Text>
              )}
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => void onSave(draft)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Çalışma saatlerini kaydet"
        style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
      >
        <Text style={styles.saveLabel}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveLabel: {
    ...typography.button,
    color: colors.white,
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

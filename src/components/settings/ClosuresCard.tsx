import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { colors, spacing, typography, radii } from '@/theme';
import { formatIsoDateLabel, fromIsoDate, toIsoDate, todayIn } from '@/utils/date';
import type { BusinessClosurePeriod } from '@/api/settings';

export interface ClosureDraft {
  startsOn: string;
  endsOn: string;
  reason: string;
}

interface ClosuresCardProps {
  closures: BusinessClosurePeriod[];
  timeZoneId: string;
  onAdd: (draft: ClosureDraft) => Promise<void>;
  onRemove: (closure: BusinessClosurePeriod) => void;
  busy: boolean;
}

/** Both ends are inclusive on the server, so a one-day closure has the same start and end. */
function describeRange(startsOn: string, endsOn: string): string {
  return startsOn === endsOn
    ? formatIsoDateLabel(startsOn)
    : `${formatIsoDateLabel(startsOn)} – ${formatIsoDateLabel(endsOn)}`;
}

function countDays(startsOn: string, endsOn: string): number {
  const [start, end] = [fromIsoDate(startsOn), fromIsoDate(endsOn)];
  if (!start || !end) return 0;

  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/**
 * The days the studio is closed — holidays, maintenance, the owner's holiday.
 *
 * <b>Only current and upcoming closures are listed</b>, because that is what the server returns: a
 * studio accumulates years of these and nobody scrolls a decade of past bayram closures. That has
 * one consequence worth handling here rather than surprising somebody with — a closure that has
 * already ended cannot be saved and then seen, so the form refuses it and says why instead of
 * reporting success over an empty list.
 *
 * "Already ended" is measured in the studio's own time zone, not the device's. That is the whole
 * point of the localization setting: an owner adding tomorrow's closure from another country should
 * not be told it is in the past.
 */
export function ClosuresCard({ closures, timeZoneId, onAdd, onRemove, busy }: ClosuresCardProps) {
  const today = todayIn(timeZoneId);

  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(today);
  const [reason, setReason] = useState('');
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);

  const endsBeforeStart = endsOn < startsOn;
  const alreadyOver = endsOn < today;
  const canSubmit = reason.trim().length > 0 && !endsBeforeStart && !alreadyOver;

  const pickStart = (date: Date) => {
    const next = toIsoDate(date);
    setStartsOn(next);
    // Dragging the start past the end is how somebody ends up staring at a disabled button with no
    // idea which field is wrong. Carrying the end along keeps the range valid by construction.
    if (endsOn < next) setEndsOn(next);
  };

  const submit = () => {
    if (!canSubmit || busy) return;

    void onAdd({ startsOn, endsOn, reason: reason.trim() });
    setReason('');
  };

  return (
    <Card style={styles.card}>
      <SectionHeader title="Kapalı Günler" icon="calendar-outline" />
      <Text style={styles.subtitle}>
        Tatiller ve stüdyonun kapalı olduğu günler. Geçmiş kapanışlar listede görünmez.
      </Text>

      <View style={styles.list}>
        {closures.length === 0 ? (
          <Text style={styles.emptyText}>Yaklaşan kapalı gün yok.</Text>
        ) : null}

        {closures.map((closure) => {
          const active = closure.startsOn <= today && today <= closure.endsOn;
          const days = countDays(closure.startsOn, closure.endsOn);

          return (
            <View key={closure.id} style={styles.row}>
              <View style={styles.rowText}>
                <View style={styles.rowHeading}>
                  <Text style={styles.rowDate}>
                    {describeRange(closure.startsOn, closure.endsOn)}
                  </Text>
                  {active ? <Badge label="Bugün kapalı" tone="warning" /> : null}
                </View>
                <Text style={styles.rowReason} numberOfLines={2}>
                  {closure.reason}
                  {days > 1 ? ` · ${days} gün` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => onRemove(closure)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`${closure.reason} kapanışını sil`}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.removeButtonPressed,
                ]}
              >
                <AppIcon name="trash-outline" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.form}>
        <Text style={styles.fieldLabel}>Yeni Kapanış</Text>

        <View style={styles.dateRow}>
          <Pressable
            onPress={() => setPicking('start')}
            accessibilityRole="button"
            accessibilityLabel="Başlangıç tarihi seç"
            style={({ pressed }) => [styles.dateButton, pressed && styles.dateButtonPressed]}
          >
            <AppIcon name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.dateText}>{formatIsoDateLabel(startsOn)}</Text>
          </Pressable>
          <Text style={styles.dateSeparator}>–</Text>
          <Pressable
            onPress={() => setPicking('end')}
            accessibilityRole="button"
            accessibilityLabel="Bitiş tarihi seç"
            style={({ pressed }) => [styles.dateButton, pressed && styles.dateButtonPressed]}
          >
            <AppIcon name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.dateText}>{formatIsoDateLabel(endsOn)}</Text>
          </Pressable>
        </View>

        <TextInput
          value={reason}
          onChangeText={setReason}
          onSubmitEditing={submit}
          placeholder="Sebep — ör. Kurban Bayramı"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          accessibilityLabel="Kapanış sebebi"
        />

        {endsBeforeStart ? (
          <Text style={styles.warning}>Bitiş tarihi başlangıçtan önce olamaz.</Text>
        ) : null}
        {alreadyOver && !endsBeforeStart ? (
          <Text style={styles.warning}>
            Bu kapanış çoktan bitmiş. Kaydedilse bile listede görünmez.
          </Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!canSubmit || busy}
          accessibilityRole="button"
          accessibilityLabel="Kapanış ekle"
          style={({ pressed }) => [
            styles.addButton,
            (!canSubmit || busy) && styles.addButtonDisabled,
            pressed && canSubmit && !busy && styles.addButtonPressed,
          ]}
        >
          <Text style={styles.addLabel}>{busy ? 'Kaydediliyor…' : 'Ekle'}</Text>
        </Pressable>
      </View>

      {/*
        Mounted only while picking and keyed by which end is being picked, so it opens on the date
        that field already holds rather than on whichever one it was last opened with.
      */}
      {picking ? (
        <SingleDatePickerModal
          key={picking}
          visible
          title={picking === 'start' ? 'Başlangıç Tarihi' : 'Bitiş Tarihi'}
          initialDate={fromIsoDate(picking === 'start' ? startsOn : endsOn) ?? undefined}
          onClose={() => setPicking(null)}
          onSelect={(date) => {
            if (picking === 'start') pickStart(date);
            else setEndsOn(toIsoDate(date));
          }}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  list: {
    gap: 0,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  rowDate: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  rowReason: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  form: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  dateButtonPressed: {
    backgroundColor: colors.cardBackground,
  },
  dateText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  dateSeparator: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  warning: {
    ...typography.caption,
    color: colors.warning,
  },
  addButton: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  addLabel: {
    ...typography.button,
    color: colors.white,
  },
});

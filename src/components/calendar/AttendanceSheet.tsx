import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { IconName } from '@/types/dashboard';
import * as schedulingApi from '@/api/scheduling';
import type { AttendanceMark, SessionDetail, SessionSeat } from '@/api/scheduling';

interface AttendanceSheetProps {
  detail: SessionDetail;
  /** Called with the fresh detail after a successful save, so the drawer's counts move with it. */
  onSaved: (summary: schedulingApi.AttendanceSummary) => void;
  onError: (message: string) => void;
}

/** The three marks a coach chooses between, plus the way back. */
const MARKS: { value: AttendanceMark; label: string; icon: IconName; color: string }[] = [
  { value: 'Attended', label: 'Geldi', icon: 'checkmark', color: colors.primaryDark },
  { value: 'NoShow', label: 'Gelmedi', icon: 'close', color: colors.critical },
  { value: 'Excused', label: 'Mazeretli', icon: 'time-outline', color: colors.warning },
];

/**
 * The register for one session.
 *
 * <b>This screen is what makes occupancy real.</b> Nothing in the product recorded attendance before
 * it, so every no-show rate and every trainer attribution in the reporting phase was a hardcoded
 * constant. It is also why marks are never inferred: a session that completes with an unmarked
 * register stays unmarked, because "nobody took the register" and "nobody came" are different facts
 * and only one of them is about the members.
 *
 * <b>Saved in one request.</b> The whole sheet goes at once — one call per member would turn a
 * twelve-person class into twelve transactions that can half-succeed, leaving a register that is
 * partly this coach's answer and partly nothing.
 *
 * Marking somebody <i>Mazeretli</i> refunds their credit, server-side and once. Marking them
 * <i>Gelmedi</i> does not: they held a seat nobody else could have.
 */
export function AttendanceSheet({ detail, onSaved, onError }: AttendanceSheetProps) {
  const live = detail.seats.filter((seat) => seat.state === 'Booked');

  const [marks, setMarks] = useState<Record<string, AttendanceMark>>(() => initialMarks(live));
  const [seededFrom, setSeededFrom] = useState(detail);
  const [saving, setSaving] = useState(false);

  // Re-seeded during render when the drawer hands over a different session, which is React's own
  // "adjusting state when a prop changes" pattern rather than an effect. An effect would render
  // the previous session's marks against the new session's names for one frame — and that frame
  // reads exactly like the register being wrong.
  if (seededFrom !== detail) {
    setSeededFrom(detail);
    setMarks(initialMarks(detail.seats.filter((seat) => seat.state === 'Booked')));
  }

  const dirty = live.some((seat) => marks[seat.bookingId] !== seat.attendance);

  const save = () => {
    if (saving) return;

    setSaving(true);

    void (async () => {
      try {
        const summary = await schedulingApi.markAttendance(
          detail.session.id,
          live.map((seat) => ({ bookingId: seat.bookingId, mark: marks[seat.bookingId] })),
        );

        onSaved(summary);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Yoklama kaydedilemedi.');
      } finally {
        setSaving(false);
      }
    })();
  };

  if (detail.session.state === 'Cancelled') {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Bu ders iptal edildi; alınacak bir yoklama yok.</Text>
      </View>
    );
  }

  if (live.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Bu derse henüz kimse kayıtlı değil.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <Counter label="Kayıtlı" value={detail.attendance.booked} />
        <Counter label="Geldi" value={detail.attendance.attended} tone={colors.primaryDark} />
        <Counter label="Gelmedi" value={detail.attendance.noShow} tone={colors.critical} />
        {/*
          Reported on its own rather than folded into "gelmedi". An unmarked register is missing
          information, not a room full of absentees, and every occupancy figure downstream depends
          on the two staying distinguishable.
        */}
        <Counter label="İşaretlenmedi" value={detail.attendance.unmarked} tone={colors.textSecondary} />
      </View>

      {live.map((seat) => (
        <View key={seat.bookingId} style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {seat.memberName ?? 'Bilinmeyen üye'}
          </Text>

          <View style={styles.markRow}>
            {MARKS.map((mark) => {
              const selected = marks[seat.bookingId] === mark.value;

              return (
                <Pressable
                  key={mark.value}
                  onPress={() =>
                    setMarks((current) => ({
                      ...current,
                      // Pressing the selected mark again clears it. A coach who tapped the wrong
                      // row needs a way back, and the alternative is a no-show nobody can undo.
                      [seat.bookingId]: selected ? 'Unmarked' : mark.value,
                    }))
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${seat.memberName ?? 'Üye'}: ${mark.label}`}
                  style={[
                    styles.markButton,
                    selected && { backgroundColor: mark.color, borderColor: mark.color },
                  ]}
                >
                  <AppIcon
                    name={mark.icon}
                    size={14}
                    color={selected ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.markLabel, selected && styles.markLabelSelected]}>
                    {mark.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable
        onPress={save}
        disabled={!dirty || saving}
        accessibilityRole="button"
        accessibilityLabel="Yoklamayı kaydet"
        style={[styles.saveButton, (!dirty || saving) && styles.saveButtonDisabled]}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.saveLabel}>Yoklamayı Kaydet</Text>
        )}
      </Pressable>

      <Text style={styles.note}>
        Mazeretli işaretlenen üyenin seans hakkı iade edilir. Gelmeyen üyenin hakkı iade edilmez.
      </Text>
    </View>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <View style={styles.counter}>
      <Text style={[styles.counterValue, tone ? { color: tone } : null]}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

function initialMarks(seats: SessionSeat[]): Record<string, AttendanceMark> {
  return Object.fromEntries(seats.map((seat) => [seat.bookingId, seat.attendance]));
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  counter: {
    alignItems: 'center',
  },
  counterValue: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  counterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  markRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  markLabelSelected: {
    color: colors.white,
  },
  saveButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

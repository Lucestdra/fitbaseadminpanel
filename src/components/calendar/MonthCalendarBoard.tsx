import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS } from '@/utils/date';
import { buildMonthGrid, formatTimeIn, isBeyondGenerated } from '@/utils/calendar';
import type { CalendarSession } from '@/api/scheduling';

interface MonthCalendarBoardProps {
  year: number;
  /** Zero-based, matching `TURKISH_MONTHS`. */
  month: number;
  sessions: CalendarSession[];
  /** From `range.materializedThrough`. Null means generation has never run. */
  materializedThrough: string | null;
  /** The studio's zone. Times are meaningless in any other. */
  timeZoneId: string;
  /** `YYYY-MM-DD` in the studio's zone, not the device's. */
  today: string;
  onChangeMonth: (year: number, month: number) => void;
  onSelectDay: (isoDate: string) => void;
  onSelectSession: (sessionId: string) => void;
}

const MAX_VISIBLE_PER_DAY = 3;

function stateColor(session: CalendarSession) {
  if (session.state === 'Cancelled') return colors.textSecondary;
  if (session.kind === 'Appointment') return colors.info;
  if (session.kind === 'OneOff') return colors.warning;
  return colors.primary;
}

/**
 * A month of real dates.
 *
 * <b>Every cell is a date and a session belongs to it by `occursOn`.</b> The version this replaces
 * matched on a weekday id — `sessions.filter(s => s.day === cell.weekdayId)` — so one Tuesday class
 * rendered on every Tuesday of every month in every year, a studio could not tell this Tuesday from
 * next, and cancelling a single date was not expressible at all.
 *
 * Days past `materializedThrough` are marked rather than left blank. An empty cell there means "not
 * generated yet", which is a fact about a job; an empty cell inside the horizon means the studio has
 * nothing on. Rendering both as white space is how the panel's calendar could never be trusted.
 */
export function MonthCalendarBoard({
  year,
  month,
  sessions,
  materializedThrough,
  timeZoneId,
  today,
  onChangeMonth,
  onSelectDay,
  onSelectSession,
}: MonthCalendarBoardProps) {
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // Bucketed once per render rather than filtered per cell: 42 cells × N sessions is a scan for
  // every square, and the month view is the screen a studio leaves open.
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarSession[]>();

    for (const session of sessions) {
      const bucket = map.get(session.occursOn);
      if (bucket) bucket.push(session);
      else map.set(session.occursOn, [session]);
    }

    return map;
  }, [sessions]);

  const step = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    onChangeMonth(next.getFullYear(), next.getMonth());
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthNav}>
        <Pressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel="Önceki ay"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-back" size={16} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {TURKISH_MONTHS[month]} {year}
        </Text>
        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel="Sonraki ay"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-forward" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.days.map((cell) => {
          const daySessions = byDate.get(cell.isoDate) ?? [];
          const visible = daySessions.slice(0, MAX_VISIBLE_PER_DAY);
          const extra = daySessions.length - visible.length;
          const ungenerated = isBeyondGenerated(cell.isoDate, materializedThrough);

          return (
            <View
              key={cell.isoDate}
              style={[
                styles.dayCell,
                !cell.inMonth && styles.dayCellOutside,
                cell.isoDate === today && styles.dayCellToday,
              ]}
            >
              {/*
                The day's own target, behind the content rather than around it.

                <b>It used to wrap the cell, and a session chip is a button too.</b> That nests one
                button inside another — invalid HTML, which React says so about, and worse than a
                warning: a click on a chip bubbles to the cell, so opening a session also selected
                its day. Every tap did two things and only one of them was asked for.

                Absolutely positioned and first, so it fills the cell and paints underneath. The
                content above it is `box-none`, which lets a click land here everywhere except on a
                chip — so "tap the empty part of a day to open it" still works, and the chips are
                siblings in the DOM rather than children.
              */}
              <Pressable
                onPress={() => onSelectDay(cell.isoDate)}
                accessibilityRole="button"
                accessibilityLabel={`${cell.dayOfMonth} ${TURKISH_MONTHS[month]}, ${daySessions.length} ders`}
                style={({ pressed }) => [StyleSheet.absoluteFill, pressed && styles.dayCellPressed]}
              />

              <View style={styles.dayContent}>
                <Text
                  style={[
                    styles.dayNumber,
                    !cell.inMonth && styles.dayNumberOutside,
                    cell.isoDate === today && styles.dayNumberToday,
                  ]}
                >
                  {cell.dayOfMonth}
                </Text>

                {/* `box-none` again: the list's own bounds are wider than its chips, and without it
                    the gaps between them would swallow the day's click. */}
                <View style={styles.sessionList}>
                  {visible.map((session) => (
                    <Pressable
                      key={session.id}
                      onPress={() => onSelectSession(session.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${session.title} detayları`}
                      style={styles.sessionChip}
                    >
                      <View style={[styles.sessionDot, { backgroundColor: stateColor(session) }]} />
                      <Text
                        style={[
                          styles.sessionText,
                          session.state === 'Cancelled' && styles.sessionTextCancelled,
                        ]}
                        numberOfLines={1}
                      >
                        {formatTimeIn(session.startsAt, timeZoneId)} {session.title}
                      </Text>
                    </Pressable>
                  ))}

                  {/* Not pressable, and reached by the day's target underneath — which is right:
                      "+2 daha" means "there is more here", and the day view is where the rest is. */}
                  {extra > 0 ? <Text style={styles.moreText}>+{extra} daha</Text> : null}

                  {/*
                    Only where there is nothing to show. A day past the horizon that somehow holds a
                    one-off session is not ungenerated in any sense the person cares about — one-offs
                    are written directly and never wait for the materialiser.
                  */}
                  {ungenerated && daySessions.length === 0 ? (
                    <Text style={styles.ungeneratedText}>oluşturulmadı</Text>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  monthLabel: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCellOutside: {
    backgroundColor: colors.pageBackground,
  },
  dayCellToday: {
    backgroundColor: colors.mintLight,
  },
  // The only signal that a day is clickable, now that the whole cell is no longer a button. Without
  // it the target is invisible and silent.
  dayCellPressed: {
    backgroundColor: colors.pageBackground,
  },
  // The padding moved here from the cell: the day's target is absolutely positioned and would
  // otherwise inset by it, leaving a dead border a few pixels wide all the way round.
  dayContent: {
    flex: 1,
    padding: spacing.xs,
    gap: 4,

    // In the style rather than as a prop: React Native deprecated `pointerEvents` as a prop, and
    // the runtime says so on every render.
    pointerEvents: 'box-none',
  },
  dayNumber: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  dayNumberOutside: {
    color: colors.textSecondary,
  },
  dayNumberToday: {
    color: colors.primaryDark,
  },
  sessionList: {
    gap: 2,

    // The list's bounds are wider than its chips; without this the gaps between them would swallow
    // the day's click instead of passing it to the target underneath.
    pointerEvents: 'box-none',
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  sessionTextCancelled: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  moreText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
  ungeneratedText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

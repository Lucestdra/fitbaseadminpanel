import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { AppIcon } from '@/components/ui/AppIcon';
import { WeekCalendarBoard } from '@/components/calendar/WeekCalendarBoard';
import { MonthCalendarBoard } from '@/components/calendar/MonthCalendarBoard';
import { DayAgendaBoard } from '@/components/calendar/DayAgendaBoard';
import { SessionDetailDrawer } from '@/components/calendar/SessionDetailDrawer';
import { NewSessionModal } from '@/components/calendar/NewSessionModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import { useCalendar } from '@/hooks/useCalendar';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import { colors, spacing, typography, radii } from '@/theme';
import { buildMonthGrid, buildWeek, formatDayLabel } from '@/utils/calendar';
import { fromIsoDate, todayIn } from '@/utils/date';

type ViewMode = 'day' | 'week' | 'month';

const viewOptions: SegmentOption<ViewMode>[] = [
  { value: 'day', label: 'Gün' },
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Ay' },
];

/**
 * The calendar, on real dates.
 *
 * <b>What changed.</b> This screen used to read a mock array of weekday templates through
 * `CalendarContext` and paint each one onto every matching weekday of every month — so a class that
 * started last March rendered in March 2019, "Yeni Randevu" pushed a row into React state that
 * vanished on reload, and cancelling one Tuesday was not a thing the data model could express.
 *
 * Now the screen names a window of dates and the server answers with the occurrences in it. Three
 * things follow that were previously impossible: a single occurrence can be opened, its register
 * taken, and it can be called off without touching the ones either side of it.
 *
 * <b>`range.materializedThrough` is read, not ignored.</b> Class occurrences are generated on a
 * rolling horizon, so a week past it is not a week with no classes. The boards render those two
 * states differently, and the banner below says so once for the whole screen.
 */
export default function CalendarScreen() {
  const { timeZoneId, permissions } = useAuth();
  const { message, visible, show } = useToast();
  const { roster } = useStaffRoster();

  // The studio's today, not the device's. An owner checking the timetable from London would
  // otherwise see the wrong day highlighted for three hours out of every twenty-four.
  const today = useMemo(() => todayIn(timeZoneId), [timeZoneId]);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState(today);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const canManageSessions = permissions['scheduling.sessions.manage'] !== undefined;
  const canManageBookings = permissions['scheduling.bookings.manage'] !== undefined;
  const canMarkAttendance = permissions['scheduling.attendance.manage'] !== undefined;

  // The window the current view needs, as dates. The month grid asks for its six rendered weeks
  // rather than for the calendar month, so the leading and trailing days are not blank.
  const window = useMemo(() => {
    const anchorDate = fromIsoDate(anchor) ?? new Date();

    if (viewMode === 'month') {
      const grid = buildMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth());
      return { from: grid.from, to: grid.to };
    }

    if (viewMode === 'week') {
      const week = buildWeek(anchor);
      return { from: week[0], to: week[6] };
    }

    return { from: anchor, to: anchor };
  }, [anchor, viewMode]);

  const { sessions, range, status, errorCode, reload } = useCalendar({
    from: window.from,
    to: window.to,
    coachId: coachId ?? undefined,
  });

  // Client-side, and only over what the server already returned for this window. Server-side search
  // belongs with the list endpoints that page; a calendar window is bounded at 92 days by contract,
  // so there is nothing here that a filter can fail to reach.
  const query = search.trim().toLocaleLowerCase('tr');
  const visible_sessions = query
    ? sessions.filter(
        (session) =>
          session.title.toLocaleLowerCase('tr').includes(query) ||
          (session.coachName ?? '').toLocaleLowerCase('tr').includes(query),
      )
    : sessions;

  const anchorDate = fromIsoDate(anchor) ?? new Date();
  const materializedThrough = range?.materializedThrough ?? null;

  return (
    <AppShell activeId="calendar">
      <ListPageHeader
        title="Takvim"
        subtitle="Tüm ders ve randevularını tek takvimde gör."
        searchPlaceholder="Ara (ders, eğitmen...)"
        searchValue={search}
        onSearchChange={setSearch}
        filterCount={coachId ? 1 : 0}
        onFilterPress={() => setCoachId(null)}
        primaryActionLabel={canManageSessions ? 'Yeni Ders' : undefined}
        primaryActionIcon="add"
        onPrimaryAction={canManageSessions ? () => setCreating(true) : undefined}
      />

      <View style={styles.controlRow}>
        <Text style={styles.controlLabel}>Görünüm</Text>
        <SegmentedControl options={viewOptions} value={viewMode} onChange={setViewMode} />

        {anchor !== today ? (
          <Pressable
            onPress={() => setAnchor(today)}
            accessibilityRole="button"
            accessibilityLabel="Bugüne dön"
            style={({ pressed }) => [styles.todayChip, pressed && styles.todayChipPressed]}
          >
            <Text style={styles.todayChipLabel}>Bugün</Text>
          </Pressable>
        ) : null}
      </View>

      {/*
        Said once, for the whole screen. Each board also marks its own ungenerated days, but a
        person looking at an empty November needs the reason where they are looking rather than
        inferred from grey text in forty cells.
      */}
      {status === 'ready' && materializedThrough !== null && window.to > materializedThrough ? (
        <View style={styles.notice}>
          <AppIcon name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noticeText}>
            Ders takvimi {formatDayLabel(materializedThrough)} tarihine kadar oluşturuldu. Sonrası
            için görünen boşluk, ders olmadığı anlamına gelmiyor.
          </Text>
        </View>
      ) : null}

      {status === 'ready' && materializedThrough === null ? (
        <View style={styles.notice}>
          <AppIcon name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noticeText}>
            Ders takvimi henüz oluşturulmadı. Ders saatlerini tanımladığında otomatik oluşturulur.
          </Text>
        </View>
      ) : null}

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : status === 'error' ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {errorCode === 'scheduling.horizon.exceeded'
              ? 'Takvim bu kadar ileri bir tarih için oluşturulmuyor.'
              : 'Takvim yüklenemedi.'}
          </Text>
          <Pressable onPress={reload} accessibilityRole="button" style={styles.retryButton}>
            <Text style={styles.retryLabel}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : viewMode === 'week' ? (
        <WeekCalendarBoard
          anchorDate={anchor}
          sessions={visible_sessions}
          materializedThrough={materializedThrough}
          timeZoneId={timeZoneId}
          today={today}
          onChangeWeek={setAnchor}
          onSelectSession={setSelectedSessionId}
        />
      ) : viewMode === 'month' ? (
        <MonthCalendarBoard
          year={anchorDate.getFullYear()}
          month={anchorDate.getMonth()}
          sessions={visible_sessions}
          materializedThrough={materializedThrough}
          timeZoneId={timeZoneId}
          today={today}
          onChangeMonth={(year, month) => setAnchor(`${year}-${String(month + 1).padStart(2, '0')}-01`)}
          onSelectDay={(isoDate) => {
            setAnchor(isoDate);
            setViewMode('day');
          }}
          onSelectSession={setSelectedSessionId}
        />
      ) : (
        <DayAgendaBoard
          isoDate={anchor}
          sessions={visible_sessions}
          materializedThrough={materializedThrough}
          timeZoneId={timeZoneId}
          today={today}
          onChangeDay={setAnchor}
          onSelectSession={setSelectedSessionId}
        />
      )}

      {selectedSessionId ? (
        <SessionDetailDrawer
          sessionId={selectedSessionId}
          timeZoneId={timeZoneId}
          canMarkAttendance={canMarkAttendance}
          canManageBookings={canManageBookings}
          canManageSessions={canManageSessions}
          onChanged={reload}
          onClose={() => setSelectedSessionId(null)}
          onNotify={show}
        />
      ) : null}

      {creating ? (
        <NewSessionModal
          visible
          staff={roster}
          defaultDate={anchor}
          timeZoneId={timeZoneId}
          onClose={() => setCreating(false)}
          onCreated={(title) => {
            show(`${title} takvime eklendi.`);
            reload();
          }}
          onError={show}
        />
      ) : null}

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  controlLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  todayChip: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayChipPressed: {
    backgroundColor: '#DFF7EC',
  },
  todayChipLabel: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.pageBackground,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  loading: {
    paddingVertical: spacing.xxxl,
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
});

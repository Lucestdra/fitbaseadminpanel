import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { WeekCalendarBoard } from '@/components/calendar/WeekCalendarBoard';
import { MonthCalendarBoard } from '@/components/calendar/MonthCalendarBoard';
import { DayAgendaBoard } from '@/components/calendar/DayAgendaBoard';
import { CalendarFilterModal } from '@/components/calendar/CalendarFilterModal';
import { NewAppointmentModal, type NewAppointmentInput } from '@/components/calendar/NewAppointmentModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, spacing, typography } from '@/theme';
import { weekDays, todayDayId, calendarKpis } from '@/mock/calendar';
import { useCalendar } from '@/context/CalendarContext';
import type { CalendarSessionType } from '@/types/calendar';

type ViewMode = 'day' | 'week' | 'month';

const viewOptions: SegmentOption<ViewMode>[] = [
  { value: 'day', label: 'Gün' },
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Ay' },
];

const DEFAULT_VISIBLE_TYPES: CalendarSessionType[] = ['ders', 'randevu'];

export default function CalendarScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [visibleTypes, setVisibleTypes] = useState<CalendarSessionType[]>(DEFAULT_VISIBLE_TYPES);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [newAppointmentModalVisible, setNewAppointmentModalVisible] = useState(false);
  const { message, visible, show } = useToast();
  const { sessions, addSession } = useCalendar();

  const handleCreateAppointment = (input: NewAppointmentInput) => {
    addSession({ id: `sess-${Date.now()}`, ...input, booked: 0 });
    show(`${input.title} takvime eklendi.`);
  };

  const query = search.trim().toLocaleLowerCase('tr');
  const filteredSchedule = sessions.filter((session) => {
    if (!visibleTypes.includes(session.type)) return false;
    if (!query) return true;
    return (
      session.title.toLocaleLowerCase('tr').includes(query) ||
      session.trainer.toLocaleLowerCase('tr').includes(query)
    );
  });
  const isDefaultFilter =
    visibleTypes.length === DEFAULT_VISIBLE_TYPES.length && visibleTypes.every((type) => DEFAULT_VISIBLE_TYPES.includes(type));
  const filterCount = isDefaultFilter ? 0 : 1;

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  return (
    <AppShell activeId="calendar">
      <ListPageHeader
        title="Takvim"
        subtitle="Tüm ders ve randevularını tek takvimde gör."
        searchPlaceholder="Ara (ders, eğitmen, üye...)"
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={() => setFilterModalVisible(true)}
        filterCount={filterCount}
        primaryActionLabel="Yeni Randevu"
        primaryActionIcon="add"
        onPrimaryAction={() => setNewAppointmentModalVisible(true)}
      />

      <View style={styles.kpiGrid}>
        {calendarKpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      <View style={styles.viewToggleRow}>
        <Text style={styles.viewToggleLabel}>Görünüm</Text>
        <SegmentedControl options={viewOptions} value={viewMode} onChange={setViewMode} />
      </View>

      {viewMode === 'week' ? (
        <WeekCalendarBoard days={weekDays} sessions={filteredSchedule} todayDayId={todayDayId} />
      ) : viewMode === 'month' ? (
        <MonthCalendarBoard sessions={filteredSchedule} />
      ) : (
        <DayAgendaBoard sessions={filteredSchedule} />
      )}

      <CalendarFilterModal
        visible={filterModalVisible}
        visibleTypes={visibleTypes}
        onClose={() => setFilterModalVisible(false)}
        onChange={setVisibleTypes}
      />

      <NewAppointmentModal
        visible={newAppointmentModalVisible}
        onClose={() => setNewAppointmentModalVisible(false)}
        onCreate={handleCreateAppointment}
      />

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  kpiItem: {
    flexGrow: 1,
    minWidth: 150,
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  viewToggleLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
});

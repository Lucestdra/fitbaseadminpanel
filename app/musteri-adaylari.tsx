import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { DistributionCard } from '@/components/shared/DistributionCard';
import { QuickActionsGrid } from '@/components/shared/QuickActionsGrid';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LeadListView } from '@/components/leads/LeadListView';
import { LeadKanbanBoard } from '@/components/leads/LeadKanbanBoard';
import { TodaysTrialsCard } from '@/components/leads/TodaysTrialsCard';
import { NewLeadModal } from '@/components/leads/NewLeadModal';
import { LeadFilterModal, type LeadFilters } from '@/components/leads/LeadFilterModal';
import { LeadDetailModal, type MeetingKind } from '@/components/leads/LeadDetailModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, spacing, typography } from '@/theme';
import { formatDateTimeLabel, addHours, formatRelativeDateTimeLabel, WEEKDAYS } from '@/utils/date';
import { useCalendar } from '@/context/CalendarContext';
import {
  leads as initialLeads,
  additionalLeadsByStage,
  leadKpis,
  trialsToday,
  additionalTrialsToday,
  leadSourceDistribution,
  leadSourceTotal,
  leadQuickActions,
} from '@/mock/leads';
import { teamMembers } from '@/mock/team';
import type { Lead, LeadStage, CallOutcome, CallLogEntry } from '@/types/leads';
import { useCatalogs } from '@/context/CatalogsContext';
import type { QuickAction } from '@/types/dashboard';

type ViewMode = 'list' | 'kanban';

const viewOptions: SegmentOption<ViewMode>[] = [
  { value: 'list', label: 'Liste' },
  { value: 'kanban', label: 'Kanban' },
];

const EMPTY_FILTERS: LeadFilters = { sources: [], stages: [], trainers: [] };
const trainers = teamMembers.filter((member) => member.role === 'egitmen');

export default function LeadsScreen() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsiveLayout();
  const { stages } = useCatalogs();
  const { addSession } = useCalendar();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [leads, setLeads] = useState(initialLeads);
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [newLeadModalVisible, setNewLeadModalVisible] = useState(false);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const { message, visible, show } = useToast();

  const detailLead = leads.find((lead) => lead.id === detailLeadId) ?? null;
  const columns = stages.map((stage) => ({ stage: stage.id, title: stage.title }));

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    return leads.filter((lead) => {
      const matchesQuery =
        !query ||
        lead.name.toLocaleLowerCase('tr').includes(query) ||
        lead.interest.toLocaleLowerCase('tr').includes(query) ||
        lead.assignedTrainer.toLocaleLowerCase('tr').includes(query);
      const matchesSource = filters.sources.length === 0 || filters.sources.includes(lead.source);
      const matchesStage = filters.stages.length === 0 || filters.stages.includes(lead.stage);
      const matchesTrainer = filters.trainers.length === 0 || filters.trainers.includes(lead.assignedTrainer);
      return matchesQuery && matchesSource && matchesStage && matchesTrainer;
    });
  }, [leads, search, filters]);

  const filterCount = filters.sources.length + filters.stages.length + filters.trainers.length;

  const handleMoveLead = (leadId: string, newStage: LeadStage) => {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? { ...lead, stage: newStage, statusLabel: stages.find((stage) => stage.id === newStage)?.statusLabel ?? newStage }
          : lead
      )
    );
  };

  const handleCreateLead = (
    input: Omit<Lead, 'id' | 'stage' | 'statusLabel' | 'dateLabel' | 'notes'> & { note?: string }
  ) => {
    const { note, ...rest } = input;
    const newLead: Lead = {
      ...rest,
      id: `lead-${Date.now()}`,
      stage: 'yeni',
      statusLabel: stages.find((stage) => stage.id === 'yeni')?.statusLabel ?? 'Yeni',
      dateLabel: 'Şimdi',
      notes: note ? [{ id: `note-${Date.now()}`, text: note, dateLabel: formatDateTimeLabel(new Date()) }] : [],
    };
    setLeads((current) => [newLead, ...current]);
    show(`${newLead.name} müşteri adayı olarak eklendi.`);
  };

  const handleAddNote = (leadId: string, text: string) => {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? { ...lead, notes: [...(lead.notes ?? []), { id: `note-${Date.now()}`, text, dateLabel: formatDateTimeLabel(new Date()) }] }
          : lead
      )
    );
    show('Not eklendi.');
  };

  const handleLogCall = (leadId: string, outcome: CallOutcome, followUpHours?: number) => {
    const now = new Date();
    const nowLabel = formatRelativeDateTimeLabel(now, now);
    const stageOrder = stages.map((stage) => stage.id);
    const ilgileniyorIndex = stageOrder.indexOf('ilgileniyor');
    const targetLead = leads.find((lead) => lead.id === leadId);

    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== leadId) return lead;

        const entry: CallLogEntry = { id: `call-${Date.now()}`, outcome, dateLabel: nowLabel };
        let nextStage = lead.stage;
        let nextDateLabel = lead.dateLabel;

        if (followUpHours) {
          const followUpLabel = formatRelativeDateTimeLabel(addHours(now, followUpHours), now);
          entry.followUpLabel = followUpLabel;
          nextStage = 'tekrar-ara';
          nextDateLabel = followUpLabel;
        } else if (outcome === 'konustu') {
          const currentIndex = stageOrder.indexOf(lead.stage);
          if (currentIndex !== -1 && ilgileniyorIndex !== -1 && currentIndex < ilgileniyorIndex) {
            nextStage = 'ilgileniyor';
          }
          nextDateLabel = nowLabel;
        }

        const nextStatusLabel =
          nextStage !== lead.stage ? stages.find((stage) => stage.id === nextStage)?.statusLabel ?? nextStage : lead.statusLabel;

        return {
          ...lead,
          stage: nextStage,
          statusLabel: nextStatusLabel,
          dateLabel: nextDateLabel,
          callLogs: [...(lead.callLogs ?? []), entry],
        };
      })
    );

    const name = targetLead?.name ?? 'Aday';
    if (followUpHours) {
      show(`${name} için ${followUpHours} saat sonra tekrar arama planlandı.`);
    } else if (outcome === 'konustu') {
      show(`${name} ile görüşme kaydedildi.`);
    } else {
      show('Arama kaydedildi.');
    }
  };

  const handleScheduleMeeting = (
    leadId: string,
    kind: MeetingKind,
    weekdayId: string,
    time: string,
    trainerName?: string
  ) => {
    const targetLead = leads.find((lead) => lead.id === leadId);
    if (!targetLead) return;

    const weekdayLabel = WEEKDAYS.find((day) => day.id === weekdayId)?.label ?? weekdayId;
    const dateLabel = `${weekdayLabel} ${time}`;
    const kindLabel = kind === 'yuzyuze-gorusme' ? 'Yüzyüze Görüşme' : 'Deneme Dersi';
    const now = new Date();
    const nowLabel = formatRelativeDateTimeLabel(now, now);

    addSession({
      id: `sess-${Date.now()}`,
      day: weekdayId,
      time,
      title: `${targetLead.name} - ${kindLabel}`,
      trainer: trainerName ?? targetLead.assignedTrainer,
      booked: 1,
      capacity: 1,
      type: kind === 'yuzyuze-gorusme' ? 'randevu' : 'deneme',
    });

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage: kind,
              statusLabel: stages.find((stage) => stage.id === kind)?.statusLabel ?? kind,
              dateLabel,
              callLogs: [
                ...(lead.callLogs ?? []),
                { id: `call-${Date.now()}`, outcome: 'konustu', dateLabel: nowLabel, followUpLabel: `${dateLabel} · ${kindLabel}` },
              ],
            }
          : lead
      )
    );

    show(`${targetLead.name} için ${dateLabel} tarihine ${kindLabel.toLocaleLowerCase('tr')} planlandı ve takvime eklendi.`);
  };

  const handleQuickAction = (action: QuickAction) => {
    switch (action.id) {
      case 'qa-new-lead':
        setNewLeadModalVisible(true);
        break;
      case 'qa-send-whatsapp':
        router.replace('/mesajlar');
        break;
      default:
        show(action.toastMessage);
    }
  };

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  const sidebar = (
    <>
      <TodaysTrialsCard trials={trialsToday} additionalCount={additionalTrialsToday} />
      <DistributionCard title="Kaynak Dağılımı" segments={leadSourceDistribution} total={leadSourceTotal} totalUnitLabel="aday" />
      <QuickActionsGrid actions={leadQuickActions} onActionPress={handleQuickAction} />
    </>
  );

  return (
    <AppShell activeId="leads">
      <ListPageHeader
        title="Müşteri Adayları"
        subtitle="Potansiyel üyeleri takip et, denemeleri planla ve satış sürecini yönet."
        searchPlaceholder="Ara (isim, telefon, kaynak...)"
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={() => setFilterModalVisible(true)}
        filterCount={filterCount}
        primaryActionLabel="Yeni Müşteri Adayı"
        primaryActionIcon="add"
        onPrimaryAction={() => setNewLeadModalVisible(true)}
      />

      <View style={styles.kpiGrid}>
        {leadKpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      <View style={styles.viewToggleRow}>
        <Text style={styles.viewToggleLabel}>Görünüm</Text>
        <SegmentedControl options={viewOptions} value={viewMode} onChange={setViewMode} />
      </View>

      {isMobile || isTablet ? (
        <View style={styles.stack}>
          {viewMode === 'list' ? (
            <LeadListView leads={filteredLeads} onLeadPress={(lead) => setDetailLeadId(lead.id)} />
          ) : (
            <LeadKanbanBoard
              columns={columns}
              leads={filteredLeads}
              additionalCounts={additionalLeadsByStage}
              onMoveLead={handleMoveLead}
              onShowMore={() => setViewMode('list')}
              onLeadPress={(lead) => setDetailLeadId(lead.id)}
            />
          )}
          {sidebar}
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.mainCol}>
            {viewMode === 'list' ? (
              <LeadListView leads={filteredLeads} onLeadPress={(lead) => setDetailLeadId(lead.id)} />
            ) : (
              <LeadKanbanBoard
                columns={columns}
                leads={filteredLeads}
                additionalCounts={additionalLeadsByStage}
                onMoveLead={handleMoveLead}
                onShowMore={() => setViewMode('list')}
                onLeadPress={(lead) => setDetailLeadId(lead.id)}
              />
            )}
          </View>
          <View style={styles.sideCol}>{sidebar}</View>
        </View>
      )}

      <NewLeadModal
        visible={newLeadModalVisible}
        onClose={() => setNewLeadModalVisible(false)}
        onCreate={handleCreateLead}
      />

      <LeadFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onChange={setFilters}
        columns={columns}
      />

      <LeadDetailModal
        visible={detailLeadId !== null}
        lead={detailLead}
        trainers={trainers}
        onClose={() => setDetailLeadId(null)}
        onAddNote={handleAddNote}
        onLogCall={handleLogCall}
        onScheduleMeeting={handleScheduleMeeting}
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
  stack: {
    gap: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xxl,
    alignItems: 'flex-start',
  },
  mainCol: {
    flex: 68,
  },
  sideCol: {
    flex: 32,
    gap: spacing.xxl,
  },
});

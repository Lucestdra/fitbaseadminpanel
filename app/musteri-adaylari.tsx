import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LeadListView } from '@/components/leads/LeadListView';
import { LeadKanbanBoard } from '@/components/leads/LeadKanbanBoard';
import { LeadFormModal } from '@/components/leads/LeadFormModal';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';
import {
  LeadFilterSheet,
  EMPTY_LEAD_FILTERS,
  countLeadFilters,
  type LeadFilters,
} from '@/components/leads/LeadFilterSheet';
import { useToast } from '@/context/ToastContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/context/AuthContext';
import * as leadsApi from '@/api/leads';
import { colors, spacing, typography, radii } from '@/theme';
import type { KpiItem } from '@/types/dashboard';

type ViewMode = 'list' | 'kanban';

const viewOptions: SegmentOption<ViewMode>[] = [
  { value: 'list', label: 'Liste' },
  { value: 'kanban', label: 'Kanban' },
];

/**
 * The sales pipeline, on real data.
 *
 * <b>Three things moved to the server, and all three were wrong here.</b> The call-outcome
 * promotion rule ran client-side over the catalog's array order, so renaming a column broke it
 * silently. The stage of a lead was a string that got overwritten, so nothing recorded that it ever
 * moved. And there was no way to lose a lead at all — every lead that ever arrived stayed on the
 * board, so the conversion rate divided by a denominator that only grew.
 *
 * <b>The counters come from the same request as the rows</b>, computed server-side from the same
 * predicate. The five tiles this replaces were constants beside a list they did not describe.
 */
export default function LeadsScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { timeZoneId, permissions } = useAuth();
  const { show } = useToast();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_LEAD_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const canManage = permissions['leads.manage'] !== undefined;
  const canConvert = permissions['leads.convert'] !== undefined;

  const query = useMemo<leadsApi.LeadQuery>(
    () => ({
      search: search.trim() || undefined,
      stageId: filters.stageIds.length > 0 ? filters.stageIds : undefined,
      sourceId: filters.sourceIds.length > 0 ? filters.sourceIds : undefined,
      assignedTo: filters.assignedTo.length > 0 ? filters.assignedTo : undefined,
      overdueOnly: filters.overdueOnly || undefined,
      includeClosed: filters.includeClosed || undefined,
      limit: viewMode === 'kanban' ? 20 : 25,
    }),
    [search, filters, viewMode],
  );

  const { items, board, counts, status, loadingMore, hasMore, loadMore, reload } = useLeads(
    query,
    viewMode === 'kanban' ? 'board' : 'list',
  );

  const kpis: KpiItem[] = [
    { id: 'total', title: 'Açık Aday', value: String(counts.total), icon: 'people-outline' },
    {
      id: 'overdue',
      title: 'Gecikmiş Takip',
      value: String(counts.overdue),
      icon: 'alert-circle-outline',
    },
    {
      id: 'unassigned',
      title: 'Sorumlusuz',
      value: String(counts.unassigned),
      icon: 'person-remove-outline',
    },
    {
      id: 'converted',
      title: 'Bu Ay Üye Olan',
      value: String(counts.convertedThisMonth),
      icon: 'checkmark-circle-outline',
    },
    {
      // Reported beside conversions rather than hidden. A month with forty conversions and two
      // hundred losses is a different month, and the panel could not show the second number at all.
      id: 'lost',
      title: 'Bu Ay Kaybedilen',
      value: String(counts.lostThisMonth),
      icon: 'close-circle-outline',
    },
  ];

  const moveLead = (leadId: string, stageId: string) => {
    void (async () => {
      try {
        const result = await leadsApi.moveLeadStage(leadId, stageId, null);
        show(`${result.lead.fullName} → ${result.lead.stageTitle}`);
        reload();
      } catch (error) {
        // Includes the two deliberate refusals: dropping onto the converted or the lost column
        // comes back as a conflict naming the action to use instead. The board reloads either way,
        // so the card snaps back to where it actually is.
        show(error instanceof Error ? error.message : 'Aday taşınamadı.');
        reload();
      }
    })();
  };

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  return (
    <AppShell activeId="leads">
      <ListPageHeader
        title="Müşteri Adayları"
        subtitle="Aday havuzunu takip et, arama yap, üyeliğe dönüştür."
        searchPlaceholder="Ara (ad, telefon, e-posta...)"
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={() => setFilterVisible(true)}
        filterCount={countLeadFilters(filters)}
        primaryActionLabel={canManage ? 'Yeni Aday' : undefined}
        primaryActionIcon="add"
        onPrimaryAction={canManage ? () => setCreating(true) : undefined}
      />

      <View style={styles.kpiGrid}>
        {kpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      <View style={styles.controlRow}>
        <Text style={styles.controlLabel}>Görünüm</Text>
        <SegmentedControl options={viewOptions} value={viewMode} onChange={setViewMode} />
      </View>

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : status === 'error' ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Adaylar yüklenemedi.</Text>
          <Pressable onPress={reload} accessibilityRole="button" style={styles.retryButton}>
            <Text style={styles.retryLabel}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : viewMode === 'kanban' ? (
        <LeadKanbanBoard
          columns={board?.columns ?? []}
          onMoveLead={moveLead}
          onShowMore={() => setViewMode('list')}
          onLeadPress={(lead) => setSelectedLeadId(lead.id)}
        />
      ) : items.length === 0 ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {countLeadFilters(filters) > 0 || search.trim()
              ? 'Bu filtreye uyan aday yok.'
              : 'Henüz aday eklenmedi.'}
          </Text>
        </View>
      ) : (
        <>
          <LeadListView leads={items} onLeadPress={(lead) => setSelectedLeadId(lead.id)} />

          {hasMore ? (
            <Pressable
              onPress={loadMore}
              disabled={loadingMore}
              accessibilityRole="button"
              style={[styles.retryButton, styles.loadMore, loadingMore && styles.disabled]}
            >
              <Text style={styles.retryLabel}>
                {loadingMore ? 'Yükleniyor...' : 'Daha fazla göster'}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}

      <LeadFilterSheet
        visible={filterVisible}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterVisible(false)}
      />

      {creating ? (
        <LeadFormModal
          editing={null}
          onClose={() => setCreating(false)}
          onSaved={(text) => {
            show(text);
            reload();
          }}
          onError={show}
        />
      ) : null}

      {selectedLeadId ? (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          timeZoneId={timeZoneId}
          canConvert={canConvert}
          onChanged={reload}
          onClose={() => setSelectedLeadId(null)}
          onNotify={show}
        />
      ) : null}

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
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  controlLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
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
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMore: {
    alignSelf: 'center',
  },
  retryLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});

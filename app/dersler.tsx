import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { DistributionCard } from '@/components/shared/DistributionCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ClassTable } from '@/components/classes/ClassTable';
import { ClassFormModal } from '@/components/classes/ClassFormModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useClasses } from '@/hooks/useClasses';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme';
import type { ClassSummary } from '@/api/scheduling';
import type { DistributionSegment } from '@/types/shared';
import type { KpiItem } from '@/types/dashboard';

/** The palette the distribution card cycles through. */
const SEGMENT_COLORS = [colors.primary, colors.primaryDark, colors.info, '#8FE2B9', colors.warning];

/**
 * The studio's classes, on real data.
 *
 * <b>Three of the five KPI tiles are gone.</b> They read `classKpis`, five hardcoded strings —
 * "Bu Hafta Planlanan Seans: 42", "Ortalama Doluluk: %82" — beside a product that had never
 * scheduled a session or recorded an attendance. What is left is derived from the list below it:
 * how many class types exist, how many are retired, how many coaches are assigned. The other two
 * are rollups over sessions and attendance, and they arrive with the reporting phase.
 *
 * Shipping a tile that says "yeterli veri yok" would be the alternative. It is not better here:
 * these two are not empty for want of data, they are questions this screen is the wrong place to
 * answer.
 */
export default function ClassesScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { permissions } = useAuth();
  const { classes, status, reload } = useClasses();
  const { roster } = useStaffRoster();
  const { classCategories } = useCatalogs();
  const { message, visible, show } = useToast();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ClassSummary | null>(null);
  const [creating, setCreating] = useState(false);

  const canManage = permissions['scheduling.classes.manage'] !== undefined;

  const categoryNames = useMemo(
    () => Object.fromEntries(classCategories.map((entry) => [entry.id, entry.label])),
    [classCategories],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');

    if (!query) return classes;

    return classes.filter(
      (item) =>
        item.name.toLocaleLowerCase('tr').includes(query) ||
        (item.defaultCoachName ?? '').toLocaleLowerCase('tr').includes(query) ||
        (item.categoryId ? (categoryNames[item.categoryId] ?? '') : '')
          .toLocaleLowerCase('tr')
          .includes(query),
    );
  }, [classes, search, categoryNames]);

  // Counted from the same array the table renders, so a filter cannot move the list without moving
  // the numbers over it — the failure the members screen's hardcoded counters used to have.
  const kpis: KpiItem[] = useMemo(() => {
    const active = classes.filter((item) => item.isActive);
    const scheduled = active.filter((item) => item.slots.length > 0);
    const coaches = new Set(
      classes.flatMap((item) => [
        item.defaultCoachStaffMemberId,
        ...item.slots.map((slot) => slot.coachStaffMemberId),
      ]),
    );
    coaches.delete(null);

    return [
      { id: 'total-classes', title: 'Aktif Ders Tipi', value: String(active.length), icon: 'albums-outline' },
      {
        id: 'scheduled-classes',
        title: 'Programı Olan Ders',
        value: String(scheduled.length),
        icon: 'repeat-outline',
      },
      {
        id: 'assigned-coaches',
        title: 'Ders Veren Eğitmen',
        value: String(coaches.size),
        icon: 'ribbon-outline',
      },
      {
        id: 'inactive-classes',
        title: 'Pasif Dersler',
        value: String(classes.length - active.length),
        icon: 'pause-circle-outline',
      },
    ];
  }, [classes]);

  // By class count, not by session count. The panel's version claimed "14 seans" per category from
  // a constant; counting the classes filed under each is the honest question this data can answer.
  const distribution: DistributionSegment[] = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of classes) {
      if (!item.isActive) continue;

      const label = item.categoryId ? (categoryNames[item.categoryId] ?? 'Silinmiş') : 'Kategorisiz';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);

    return [...counts.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([label, count], index) => ({
        id: `cat-${label}`,
        label,
        count,
        percentage: total === 0 ? 0 : Math.round((count / total) * 100),
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      }));
  }, [classes, categoryNames]);

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '23%';

  const table = (
    <ClassTable
      classes={filtered}
      categoryNames={categoryNames}
      onEditClass={(item) => {
        if (canManage) setEditing(item);
      }}
    />
  );

  const sidebar = (
    <DistributionCard
      title="Kategori Dağılımı"
      segments={distribution}
      total={distribution.reduce((sum, segment) => sum + segment.count, 0)}
      totalUnitLabel="ders"
    />
  );

  return (
    <AppShell activeId="classes">
      <ListPageHeader
        title="Dersler"
        subtitle="Stüdyondaki tüm ders tiplerini ve programlarını yönet."
        searchPlaceholder="Ara (ders, eğitmen, kategori...)"
        searchValue={search}
        onSearchChange={setSearch}
        primaryActionLabel={canManage ? 'Yeni Ders' : undefined}
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

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : status === 'error' ? (
        <Text style={styles.errorText}>Dersler yüklenemedi.</Text>
      ) : isMobile || isTablet ? (
        <View style={styles.stack}>
          {table}
          {sidebar}
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.mainCol}>{table}</View>
          <View style={styles.sideCol}>{sidebar}</View>
        </View>
      )}

      {creating || editing ? (
        <ClassFormModal
          editing={editing}
          categories={classCategories}
          staff={roster}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(text) => {
            show(text);
            // Re-read rather than splice. Adding a slot materialises sessions and ending one
            // cancels bookings; both change more than the row that was edited.
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  kpiItem: {
    flexGrow: 1,
    minWidth: 150,
  },
  loading: {
    paddingVertical: spacing.xxxl,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
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

import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { MemberTable } from '@/components/members/MemberTable';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useMemberList } from '@/hooks/useMemberList';
import { colors, spacing, typography, radii } from '@/theme';
import { MEMBERSHIP_STATE_LABELS } from '@/api/enums';
import type { MembershipState } from '@/api/members';
import type { IconName } from '@/types/dashboard';

/**
 * The counter tiles, and the filter each one applies.
 *
 * <b>Every tile is derived from the same query as the list.</b> The panel's five KPIs are hardcoded
 * constants — `'342'`, `'18'`, `'24'` — sitting above a list they have no relationship to, so
 * filtering the list leaves them saying something about a different set of people.
 *
 * "Bu Ay Yeni Üyeler" is not here. It needs a joined-on range filter the server does not take yet,
 * and a tile that silently filtered by something else would be worse than one that is absent.
 */
const TILES: {
  id: string;
  title: string;
  icon: IconName;
  states: MembershipState[] | null;
  count: (counts: {
    total: number;
    active: number;
    frozen: number;
    expiring: number;
    lapsed: number;
  }) => number;
}[] = [
  {
    id: 'all',
    title: 'Toplam Üye',
    icon: 'people-outline',
    states: null,
    count: (counts) => counts.total,
  },
  {
    id: 'active',
    title: 'Aktif Üyeler',
    icon: 'checkmark-circle-outline',
    states: ['Active'],
    count: (counts) => counts.active,
  },
  {
    id: 'expiring',
    title: 'Paket Bitiyor',
    icon: 'calendar-outline',
    states: ['Active'],
    count: (counts) => counts.expiring,
  },
  {
    id: 'frozen',
    title: 'Dondurulmuş',
    icon: 'pause-circle-outline',
    states: ['Frozen'],
    count: (counts) => counts.frozen,
  },
  {
    id: 'lapsed',
    title: 'Üyeliği Bitenler',
    icon: 'person-remove-outline',
    states: ['Expired', 'Cancelled', 'NoMembership'],
    count: (counts) => counts.lapsed,
  },
];

/**
 * The members screen.
 *
 * <b>Search, filter and paging all happen on the server.</b> The panel loads every member into
 * memory and filters with `Array.filter`, which is fine for eight mock rows and is not fine for a
 * studio with four hundred — the first page would be four hundred rows over the wire before
 * anything rendered.
 */
export default function MembersScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { message, visible, show } = useToast();

  const [search, setSearch] = useState('');
  const [tileId, setTileId] = useState<string>('all');

  const tile = TILES.find((candidate) => candidate.id === tileId) ?? TILES[0];

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      state: tile.states ?? undefined,
      sort: 'RecentlyJoined' as const,
      limit: 25,
    }),
    [search, tile],
  );

  const { items, counts, status, loadingMore, hasMore, loadMore } = useMemberList(query);

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  return (
    <AppShell activeId="members">
      <ListPageHeader
        title="Üyeler"
        subtitle="Aktif üyeleri, paket durumlarını ve yenilemeleri sade bir ekrandan yönet."
        searchPlaceholder="Ara (isim veya telefon)"
        searchValue={search}
        onSearchChange={setSearch}
        primaryActionLabel="Yeni Üye"
        primaryActionIcon="add"
        onPrimaryAction={() => show('Yeni üye formu bir sonraki adımda bağlanacak.')}
      />

      <View style={styles.kpiGrid}>
        {TILES.map((candidate) => (
          <View key={candidate.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard
              item={{
                id: candidate.id,
                title: candidate.title,
                value: String(candidate.count(counts)),
                icon: candidate.icon,
              }}
              onPress={() =>
                setTileId((current) => (current === candidate.id ? 'all' : candidate.id))
              }
            />
          </View>
        ))}
      </View>

      {tileId !== 'all' ? (
        <View style={styles.filterChipRow}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipLabel}>
              Filtre: {tile.title}
              {tile.states
                ? ` (${tile.states.map((s) => MEMBERSHIP_STATE_LABELS[s]).join(', ')})`
                : ''}
            </Text>
            <Pressable
              onPress={() => setTileId('all')}
              accessibilityRole="button"
              accessibilityLabel="Filtreyi temizle"
              hitSlop={8}
            >
              <AppIcon name="close" size={14} color={colors.primaryDark} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {status === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}

      {status === 'error' ? (
        // Told apart from "no members yet" on purpose. An empty studio and a failed request look
        // identical, and only one of them is worth telling somebody about.
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Üyeler yüklenemedi</Text>
          <Text style={styles.emptyBody}>Bağlantını kontrol edip sayfayı yenile.</Text>
        </View>
      ) : null}

      {status === 'ready' && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>
            {search.trim() || tileId !== 'all' ? 'Bu filtreye uyan üye yok' : 'Henüz üye yok'}
          </Text>
          <Text style={styles.emptyBody}>
            {search.trim() || tileId !== 'all'
              ? 'Aramayı veya filtreyi değiştirmeyi dene.'
              : 'İlk üyeni ekleyerek başla.'}
          </Text>
        </View>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <MemberTable
            members={items}
            onMemberPress={(member) =>
              show(`${member.fullName} detayı bir sonraki adımda açılacak.`)
            }
          />

          {hasMore ? (
            <Pressable
              onPress={loadMore}
              disabled={loadingMore}
              accessibilityRole="button"
              accessibilityLabel="Daha fazla üye yükle"
              style={({ pressed }) => [styles.loadMore, pressed && styles.loadMorePressed]}
            >
              <Text style={styles.loadMoreLabel}>
                {loadingMore ? 'Yükleniyor…' : 'Daha fazla göster'}
              </Text>
            </Pressable>
          ) : null}

          <Text style={styles.tally}>
            {items.length} / {counts.total} üye gösteriliyor
          </Text>
        </>
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
  filterChipRow: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.mintLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterChipLabel: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loadMore: {
    alignSelf: 'center',
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMorePressed: {
    backgroundColor: colors.pageBackground,
  },
  loadMoreLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  tally: {
    ...typography.caption,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
});

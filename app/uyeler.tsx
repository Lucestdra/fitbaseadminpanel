import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { MemberTable } from '@/components/members/MemberTable';
import { MemberStatusSummary } from '@/components/members/MemberStatusSummary';
import { NewMemberModal, type NewMemberInput } from '@/components/members/NewMemberModal';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';
import { MemberFilterModal, type MemberFilters } from '@/components/members/MemberFilterModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, spacing, typography, radii } from '@/theme';
import { members as initialMembers, memberKpis, memberStatusCounts } from '@/mock/members';
import { packageTemplates, giftTemplates } from '@/mock/settings';
import { teamMembers } from '@/mock/team';
import { parseDateLabel } from '@/utils/date';
import { isMemberOverdue, isMemberRenewalSoon } from '@/utils/members';
import type { Member, MemberStatus } from '@/types/members';

const trainers = teamMembers.filter((member) => member.role === 'egitmen');
const trainerOptions = trainers.map((trainer) => trainer.name);

const EMPTY_FILTERS: MemberFilters = { packages: [], trainers: [], statuses: [] };

type KpiFilter = MemberStatus | 'new-this-month' | 'renewal-soon' | 'overdue' | null;

const KPI_FILTER_MAP: Record<string, KpiFilter> = {
  'active-members': 'aktif',
  'new-members-month': 'new-this-month',
  'package-ending': 'renewal-soon',
  'overdue-payment': 'overdue',
  'frozen-members': 'donduruldu',
};

const KPI_FILTER_LABELS: Record<Exclude<KpiFilter, null>, string> = {
  aktif: 'Aktif Üyeler',
  'renewal-soon': 'Paket Bitiyor',
  overdue: 'Geciken Ödeme',
  donduruldu: 'Dondurulmuş Üyeler',
  pasif: 'Pasif Üyeler',
  'new-this-month': 'Bu Ay Yeni Üyeler',
};

export default function MembersScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [newMemberModalVisible, setNewMemberModalVisible] = useState(false);
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);
  const [filters, setFilters] = useState<MemberFilters>(EMPTY_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { message, visible, show } = useToast();

  const detailMember = members.find((member) => member.id === detailMemberId) ?? null;
  const packageOptions = useMemo(() => Array.from(new Set(members.map((member) => member.packageName))), [members]);
  const filterCount = filters.packages.length + filters.trainers.length + filters.statuses.length;

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    const now = new Date();
    return members.filter((member) => {
      const matchesQuery =
        !query ||
        member.name.toLocaleLowerCase('tr').includes(query) ||
        member.packageName.toLocaleLowerCase('tr').includes(query);
      if (!matchesQuery) return false;
      if (filters.packages.length > 0 && !filters.packages.includes(member.packageName)) return false;
      if (filters.trainers.length > 0 && !filters.trainers.includes(member.assignedTrainer ?? '')) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(member.status)) return false;
      if (!kpiFilter) return true;
      if (kpiFilter === 'new-this-month') {
        const startDate = member.membershipStartDate ? parseDateLabel(member.membershipStartDate) : null;
        return !!startDate && startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear();
      }
      if (kpiFilter === 'renewal-soon') return isMemberRenewalSoon(member);
      if (kpiFilter === 'overdue') return isMemberOverdue(member);
      return member.status === kpiFilter;
    });
  }, [members, search, kpiFilter, filters]);

  const handleKpiPress = (kpiId: string) => {
    const filter = KPI_FILTER_MAP[kpiId] ?? null;
    setKpiFilter((current) => (current === filter ? null : filter));
  };

  const handleCreateMember = (input: NewMemberInput) => {
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      name: input.name,
      avatarInitials: input.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      packageName: input.packageName ?? 'Paket Seçilmedi',
      sessionsRemaining: input.sessionsTotal,
      sessionsTotal: input.sessionsTotal,
      lastVisit: '—',
      renewalDate: input.membershipEndDate,
      renewalDaysLeft: 30,
      status: 'aktif',
      phone: input.phone,
      email: input.email,
      birthDate: input.birthDate,
      membershipStartDate: input.membershipStartDate,
      membershipEndDate: input.membershipEndDate,
      gifts: input.giftLabel ? [{ id: `gift-${Date.now()}`, label: input.giftLabel, dateLabel: input.membershipStartDate }] : [],
    };
    setMembers((current) => [newMember, ...current]);
    show(`${newMember.name} üye olarak eklendi.`);
  };

  const handleSaveMember = (updated: Member) => {
    setMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)));
    show(`${updated.name} bilgileri güncellendi.`);
  };

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  return (
    <AppShell activeId="members">
      <ListPageHeader
        title="Üyeler"
        subtitle="Aktif üyeleri, paket durumlarını ve yenilemeleri sade bir ekrandan yönet."
        searchPlaceholder="Ara (isim, telefon, e-posta...)"
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={() => setFilterModalVisible(true)}
        filterCount={filterCount}
        primaryActionLabel="Yeni Üye"
        primaryActionIcon="add"
        onPrimaryAction={() => setNewMemberModalVisible(true)}
      />

      <View style={styles.kpiGrid}>
        {memberKpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} onPress={() => handleKpiPress(item.id)} />
          </View>
        ))}
      </View>

      {kpiFilter ? (
        <View style={styles.filterChipRow}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipLabel}>Filtre: {KPI_FILTER_LABELS[kpiFilter]}</Text>
            <Pressable
              onPress={() => setKpiFilter(null)}
              accessibilityRole="button"
              accessibilityLabel="Filtreyi temizle"
              hitSlop={8}
            >
              <AppIcon name="close" size={14} color={colors.primaryDark} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <MemberTable members={filteredMembers} onMemberPress={(member) => setDetailMemberId(member.id)} />

      <MemberStatusSummary items={memberStatusCounts} />

      <MemberFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onChange={setFilters}
        packageOptions={packageOptions}
        trainerOptions={trainerOptions}
      />

      <NewMemberModal
        visible={newMemberModalVisible}
        onClose={() => setNewMemberModalVisible(false)}
        onCreate={handleCreateMember}
        packages={packageTemplates}
        gifts={giftTemplates}
      />

      <MemberDetailModal
        key={detailMember?.id ?? 'none'}
        visible={detailMemberId !== null}
        member={detailMember}
        packages={packageTemplates}
        trainers={trainers}
        onClose={() => setDetailMemberId(null)}
        onSave={handleSaveMember}
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
});

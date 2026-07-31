import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TeamTable } from '@/components/team/TeamTable';
import { NewTeamMemberModal, type NewTeamMemberInput } from '@/components/team/NewTeamMemberModal';
import { TeamMemberDetailModal } from '@/components/team/TeamMemberDetailModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { spacing } from '@/theme';
import { formatDateLabel } from '@/utils/date';
import { teamMembers as initialTeamMembers, teamKpis } from '@/mock/team';
import type { TeamMember } from '@/types/team';

export default function TeamScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [newMemberModalVisible, setNewMemberModalVisible] = useState(false);
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const { message, visible, show } = useToast();

  const detailMember = teamMembers.find((member) => member.id === detailMemberId) ?? null;

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    if (!query) return teamMembers;
    return teamMembers.filter(
      (member) =>
        member.name.toLocaleLowerCase('tr').includes(query) ||
        (member.specialty ?? '').toLocaleLowerCase('tr').includes(query) ||
        member.email.toLocaleLowerCase('tr').includes(query)
    );
  }, [teamMembers, search]);

  const handleCreateMember = (input: NewTeamMemberInput) => {
    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: input.name,
      avatarInitials: input.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      role: input.role,
      specialty: input.specialty || null,
      email: input.email,
      phone: input.phone,
      attendanceRate: null,
      status: 'aktif',
      joinedDate: formatDateLabel(new Date()),
    };
    setTeamMembers((current) => [newMember, ...current]);
    show(`${newMember.name} ekibe eklendi.`);
  };

  const handleSaveMember = (updated: TeamMember) => {
    setTeamMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)));
    show(`${updated.name} bilgileri güncellendi.`);
  };

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  return (
    <AppShell activeId="team">
      <ListPageHeader
        title="Ekip"
        subtitle="Eğitmenlerini ve stüdyo ekibini yönet."
        searchPlaceholder="Ara (isim, uzmanlık, e-posta...)"
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={() => show('Filtreleme seçenekleri yakında eklenecek.')}
        primaryActionLabel="Yeni Ekip Üyesi"
        primaryActionIcon="add"
        onPrimaryAction={() => setNewMemberModalVisible(true)}
      />

      <View style={styles.kpiGrid}>
        {teamKpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      <TeamTable members={filteredMembers} onMemberPress={(member) => setDetailMemberId(member.id)} />

      <NewTeamMemberModal
        visible={newMemberModalVisible}
        onClose={() => setNewMemberModalVisible(false)}
        onCreate={handleCreateMember}
      />

      <TeamMemberDetailModal
        key={detailMember?.id ?? 'none'}
        visible={detailMemberId !== null}
        member={detailMember}
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
});

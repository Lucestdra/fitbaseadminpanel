import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import { usePrograms } from '@/hooks/usePrograms';
import { MemberProgramModal } from '@/components/trainers/MemberProgramModal';
import { useAuth } from '@/context/AuthContext';
import { MAX_WEEKS, type ProgramRosterEntry } from '@/api/programs';
import { formatProgramMonth, shiftProgramMonth } from '@/utils/programs';
import { formatInstantIn } from '@/utils/instants';
import { initialsOf } from '@/utils/name';
import { colors, spacing, typography, radii } from '@/theme';

/** A member with no coach still has to appear somewhere, or the studio cannot notice. */
const UNASSIGNED = 'unassigned';

/**
 * Oversight: who has written this month's programmes, and who has not.
 *
 * <b>The same endpoint the coach's own screen reads.</b> A manager holds `programs.read` at `All`
 * scope, so the roster comes back as the whole studio and this groups it by coach. There is no
 * separate oversight query and no view joining `programs` to `members` — one query answering both
 * questions cannot disagree with itself (ADR-0064).
 *
 * The panel filtered `member.assignedTrainer === trainer.name`, a display-name comparison in the
 * browser against a free-text `responsibles` catalog, and its delivery log was an in-memory array
 * that emptied on reload.
 */
export default function TrainersScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { timeZoneId, permissions } = useAuth();
  const { message, visible, show } = useToast();

  const [month, setMonth] = useState<{ year: number; month: number } | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProgramRosterEntry | null>(null);

  const roster = usePrograms(month);
  const { roster: staff } = useStaffRoster();

  const canManage = permissions['programs.manage'] !== undefined;
  const monthLabel = roster.month === null ? '' : formatProgramMonth(roster.month);

  /**
   * The coaches with somebody assigned to them, and how their month stands.
   *
   * Derived from the roster rather than from the staff list, because a coach with no assigned
   * members has nothing to show here and a member whose coach has left still has to appear.
   */
  const coaches = useMemo(() => {
    const groups = new Map<string, { name: string; members: ProgramRosterEntry[] }>();

    for (const item of roster.items) {
      const key = item.primaryCoachStaffMemberId ?? UNASSIGNED;

      if (!groups.has(key)) {
        const found = staff.find((person) => person.id === key);

        groups.set(key, {
          name:
            key === UNASSIGNED
              ? 'Eğitmen atanmamış'
              : found
                ? found.status === 'Inactive'
                  ? `${found.fullName} (ayrıldı)`
                  : found.fullName
                : 'Bilinmeyen eğitmen',
          members: [],
        });
      }

      groups.get(key)!.members.push(item);
    }

    return [...groups.entries()]
      .map(([id, group]) => ({
        id,
        name: group.name,
        members: group.members,
        written: group.members.filter((member) => member.weeksWritten > 0).length,
        delivered: group.members.filter((member) => member.latestDelivery !== null).length,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, 'tr'));
  }, [roster.items, staff]);

  const selected =
    coaches.find((coach) => coach.id === selectedCoachId) ?? coaches[0] ?? null;

  const step = (delta: number) =>
    setMonth((current) =>
      shiftProgramMonth(current ?? roster.month ?? { year: 2026, month: 1 }, delta),
    );

  const trainerList = (
    <Card style={styles.trainerCard}>
      <SectionHeader title="Eğitmenler" icon="body-outline" />
      <View style={styles.trainerList}>
        {coaches.length === 0 ? (
          <Text style={styles.emptyText}>Stüdyoda aktif üye yok.</Text>
        ) : (
          coaches.map((coach) => {
            const isActive = coach.id === selected?.id;

            return (
              <Pressable
                key={coach.id}
                onPress={() => setSelectedCoachId(coach.id)}
                accessibilityRole="button"
                accessibilityLabel={`${coach.name} seç`}
                style={({ pressed }) => [
                  styles.trainerRow,
                  isActive && styles.trainerRowActive,
                  pressed && styles.trainerRowPressed,
                ]}
              >
                <Avatar initials={initialsOf(coach.name)} size={36} />
                <View style={styles.trainerTextGroup}>
                  <Text style={styles.trainerName} numberOfLines={1}>
                    {coach.name}
                  </Text>

                  {/* The number the panel could not produce: how much of the month is done. */}
                  <Text style={styles.trainerSpecialty} numberOfLines={1}>
                    {coach.written}/{coach.members.length} program · {coach.delivered} gönderildi
                  </Text>
                </View>
                <Badge label={`${coach.members.length} üye`} tone={isActive ? 'mint' : 'neutral'} />
              </Pressable>
            );
          })
        )}
      </View>
    </Card>
  );

  const memberList = (
    <Card style={styles.memberCard}>
      <SectionHeader
        title={selected ? `${selected.name} · Atanan Üyeler` : 'Atanan Üyeler'}
        icon="people-outline"
      />

      <View style={styles.monthRow}>
        <Pressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel="Önceki ay"
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <AppIcon name="chevron-back-outline" size={16} color={colors.textPrimary} />
        </Pressable>

        <Text style={styles.monthLabel}>Program ayı: {monthLabel || '—'}</Text>
        {roster.isCurrentMonth ? <Badge label="Bu ay" tone="mint" /> : null}

        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel="Sonraki ay"
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <AppIcon name="chevron-forward-outline" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      {roster.status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : roster.status === 'error' ? (
        <Text style={styles.emptyText}>Bilgiler alınamadı. Sayfayı yenile.</Text>
      ) : !selected || selected.members.length === 0 ? (
        <Text style={styles.emptyText}>Bu eğitmene atanmış üye yok.</Text>
      ) : (
        <View style={styles.memberList}>
          {selected.members.map((member) => (
            <View key={member.memberId} style={styles.memberRow}>
              <Avatar initials={initialsOf(member.memberName)} size={36} />
              <View style={styles.memberTextGroup}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.memberName}
                </Text>

                <Text style={styles.memberPackage} numberOfLines={1}>
                  {member.latestDelivery === null
                    ? 'Gönderilmedi'
                    : `Gönderildi · ${formatInstantIn(member.latestDelivery.deliveredAt, timeZoneId)}` +
                      (member.latestDelivery.evidence === 'SelfReported'
                        ? ' · kendisi bildirdi'
                        : '')}
                </Text>
              </View>

              {member.weeksWritten > 0 ? (
                <Badge label={`${member.weeksWritten}/${MAX_WEEKS} hafta`} tone="mint" />
              ) : (
                <Badge label="Program Yok" tone="warning" />
              )}

              {member.isStaleSinceDelivery ? (
                <Badge label="Sonradan düzenlendi" tone="warning" />
              ) : null}

              {canManage ? (
                <Pressable
                  onPress={() => setEditing(member)}
                  accessibilityRole="button"
                  accessibilityLabel={`${member.memberName} için program ${
                    member.weeksWritten > 0 ? 'düzenle' : 'oluştur'
                  }`}
                  style={({ pressed }) => [
                    styles.programButton,
                    pressed && styles.programButtonPressed,
                  ]}
                >
                  <AppIcon
                    name={member.weeksWritten > 0 ? 'create-outline' : 'add-circle-outline'}
                    size={16}
                    color={colors.primaryDark}
                  />
                  <Text style={styles.programButtonLabel}>
                    {member.weeksWritten > 0 ? 'Düzenle' : 'Program Oluştur'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <AppShell activeId="trainers">
      <View style={styles.header}>
        <Text style={styles.title}>Eğitmenler</Text>
        <Text style={styles.subtitle}>
          Hangi eğitmenin hangi üye için {monthLabel} programını yazdığını ve gönderdiğini gör.
        </Text>
      </View>

      {isMobile || isTablet ? (
        <View style={styles.stack}>
          {trainerList}
          {memberList}
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.sideCol}>{trainerList}</View>
          <View style={styles.mainCol}>{memberList}</View>
        </View>
      )}

      <MemberProgramModal
        key={editing?.memberId ?? 'none'}
        visible={editing !== null}
        memberId={editing?.memberId ?? null}
        memberName={editing?.memberName ?? ''}
        month={roster.month}
        onClose={() => setEditing(null)}
        onSaved={(text) => {
          show(text);
          roster.reload();
        }}
        onError={show}
      />

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.pageTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.pageSubtitle,
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
  sideCol: {
    flex: 32,
  },
  mainCol: {
    flex: 68,
    gap: spacing.xxl,
  },
  trainerCard: {
    gap: spacing.lg,
  },
  trainerList: {
    gap: spacing.sm,
  },
  trainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trainerRowActive: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  trainerRowPressed: {
    backgroundColor: colors.pageBackground,
  },
  trainerTextGroup: {
    flex: 1,
    gap: 2,
  },
  trainerName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  trainerSpecialty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  memberCard: {
    gap: spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -spacing.sm,
    flexWrap: 'wrap',
  },
  monthLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepButton: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  loading: {
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  memberList: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  memberTextGroup: {
    flex: 1,
    gap: 2,
    minWidth: 120,
  },
  memberName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  memberPackage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.mintLight,
  },
  programButtonPressed: {
    backgroundColor: '#DFF7EC',
  },
  programButtonLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

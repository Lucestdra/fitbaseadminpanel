import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { MemberProgramModal } from '@/components/trainers/MemberProgramModal';
import { usePrograms } from '@/context/ProgramsContext';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS } from '@/utils/date';
import { teamMembers } from '@/mock/team';
import { members } from '@/mock/members';
import type { MemberProgram } from '@/types/programs';
import type { Member } from '@/types/members';

const trainers = teamMembers.filter((member) => member.role === 'egitmen');

function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${TURKISH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function TrainersScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(trainers[0]?.id ?? null);
  const [programModalMember, setProgramModalMember] = useState<Member | null>(null);
  const { saveProgram, findProgram: lookupProgram, deliveries } = usePrograms();
  const { message, visible, show } = useToast();

  const currentMonth = getCurrentMonthLabel();
  const selectedTrainer = trainers.find((trainer) => trainer.id === selectedTrainerId) ?? null;
  const assignedMembers = selectedTrainer ? members.filter((member) => member.assignedTrainer === selectedTrainer.name) : [];

  const handleSaveProgram = (program: MemberProgram) => {
    saveProgram(program);
    const member = members.find((item) => item.id === program.memberId);
    show(`${member?.name ?? 'Üye'} için ${program.month} programı kaydedildi.`);
  };

  const findProgram = (memberId: string) => lookupProgram(memberId, currentMonth);

  const trainerDeliveries = selectedTrainer
    ? [...deliveries].reverse().filter((item) => item.trainerName === selectedTrainer.name)
    : [];

  const trainerList = (
    <Card style={styles.trainerCard}>
      <SectionHeader title="Eğitmenler" icon="body-outline" />
      <View style={styles.trainerList}>
        {trainers.map((trainer) => {
          const isActive = trainer.id === selectedTrainerId;
          const assignedCount = members.filter((member) => member.assignedTrainer === trainer.name).length;
          return (
            <Pressable
              key={trainer.id}
              onPress={() => setSelectedTrainerId(trainer.id)}
              accessibilityRole="button"
              accessibilityLabel={`${trainer.name} seç`}
              style={({ pressed }) => [styles.trainerRow, isActive && styles.trainerRowActive, pressed && styles.trainerRowPressed]}
            >
              <Avatar initials={trainer.avatarInitials} size={36} />
              <View style={styles.trainerTextGroup}>
                <Text style={styles.trainerName} numberOfLines={1}>{trainer.name}</Text>
                <Text style={styles.trainerSpecialty} numberOfLines={1}>{trainer.specialty ?? 'Eğitmen'}</Text>
              </View>
              <Badge label={`${assignedCount} üye`} tone={isActive ? 'mint' : 'neutral'} />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );

  const memberList = (
    <Card style={styles.memberCard}>
      <SectionHeader
        title={selectedTrainer ? `${selectedTrainer.name} · Atanan Üyeler` : 'Atanan Üyeler'}
        icon="people-outline"
      />
      <Text style={styles.monthLabel}>Program ayı: {currentMonth}</Text>

      {assignedMembers.length === 0 ? (
        <Text style={styles.emptyText}>Bu eğitmene atanmış üye yok.</Text>
      ) : (
        <View style={styles.memberList}>
          {assignedMembers.map((member) => {
            const program = findProgram(member.id);
            return (
              <View key={member.id} style={styles.memberRow}>
                <Avatar initials={member.avatarInitials} size={36} />
                <View style={styles.memberTextGroup}>
                  <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                  <Text style={styles.memberPackage} numberOfLines={1}>{member.packageName}</Text>
                </View>
                {program ? (
                  <Badge label="Program Hazır" tone="mint" />
                ) : (
                  <Badge label="Program Yok" tone="warning" />
                )}
                <Pressable
                  onPress={() => setProgramModalMember(member)}
                  accessibilityRole="button"
                  accessibilityLabel={`${member.name} için program ${program ? 'düzenle' : 'oluştur'}`}
                  style={({ pressed }) => [styles.programButton, pressed && styles.programButtonPressed]}
                >
                  <AppIcon name={program ? 'create-outline' : 'add-circle-outline'} size={16} color={colors.primaryDark} />
                  <Text style={styles.programButtonLabel}>{program ? 'Düzenle' : 'Program Oluştur'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );

  const deliveryLog = (
    <Card style={styles.memberCard}>
      <SectionHeader
        title={selectedTrainer ? `${selectedTrainer.name} · Program Gönderimleri` : 'Program Gönderimleri'}
        icon="paper-plane-outline"
      />
      {trainerDeliveries.length === 0 ? (
        <Text style={styles.emptyText}>Bu eğitmen henüz WhatsApp ile program göndermedi.</Text>
      ) : (
        <View style={styles.memberList}>
          {trainerDeliveries.map((delivery) => (
            <View key={delivery.id} style={styles.deliveryRow}>
              <View style={styles.deliveryIcon}>
                <AppIcon name="logo-whatsapp" size={15} color={colors.primaryDark} />
              </View>
              <View style={styles.memberTextGroup}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {delivery.memberName}
                </Text>
                <Text style={styles.memberPackage} numberOfLines={1}>
                  {delivery.trainerName} · {delivery.month} programını gönderdi
                </Text>
              </View>
              <Text style={styles.deliveryDate}>{delivery.sentAtLabel}</Text>
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
        <Text style={styles.subtitle}>Eğitmenlerin kendilerine atanan üyeler için aylık antrenman programı oluşturmasını sağla.</Text>
      </View>

      {isMobile || isTablet ? (
        <View style={styles.stack}>
          {trainerList}
          {memberList}
          {deliveryLog}
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.sideCol}>{trainerList}</View>
          <View style={styles.mainCol}>
            {memberList}
            {deliveryLog}
          </View>
        </View>
      )}

      <MemberProgramModal
        key={programModalMember?.id ?? 'none'}
        visible={programModalMember !== null}
        member={programModalMember}
        month={currentMonth}
        existingProgram={programModalMember ? findProgram(programModalMember.id) : null}
        onClose={() => setProgramModalMember(null)}
        onSave={handleSaveProgram}
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
  monthLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
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
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deliveryIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryDate: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
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

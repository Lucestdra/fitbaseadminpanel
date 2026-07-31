import { useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { MemberProgramModal } from '@/components/trainers/MemberProgramModal';
import { useAuth } from '@/context/AuthContext';
import { usePrograms } from '@/context/ProgramsContext';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS, formatDateTimeLabel } from '@/utils/date';
import { buildProgramMessage, buildWhatsAppUrl } from '@/utils/programs';
import { members } from '@/mock/members';
import type { Member } from '@/types/members';
import type { MemberProgram } from '@/types/programs';

function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${TURKISH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function TrainerProgramScreen() {
  const { isMobile } = useResponsiveLayout();
  const { user } = useAuth();
  const { saveProgram, findProgram, recordDelivery, findLatestDelivery } = usePrograms();
  const [programModalMember, setProgramModalMember] = useState<Member | null>(null);
  const [pendingSendMemberId, setPendingSendMemberId] = useState<string | null>(null);
  const { message, visible, show } = useToast();

  const currentMonth = getCurrentMonthLabel();
  const trainerName = user?.name ?? '';
  const assignedMembers = members.filter((member) => member.assignedTrainer === trainerName);

  const handleSaveProgram = (program: MemberProgram) => {
    saveProgram(program);
    const member = members.find((item) => item.id === program.memberId);
    show(`${member?.name ?? 'Üye'} için ${program.month} programı kaydedildi.`);
  };

  const handleWhatsAppSend = (member: Member) => {
    const program = findProgram(member.id, currentMonth);
    if (!program) {
      show('Önce bu üye için program yazman gerekiyor.');
      return;
    }
    if (!member.phone) {
      show(`${member.name} için kayıtlı telefon numarası yok.`);
      return;
    }
    const text = buildProgramMessage(member.name, currentMonth, program.entries);
    setPendingSendMemberId(member.id);
    Linking.openURL(buildWhatsAppUrl(member.phone, text)).catch(() =>
      show('WhatsApp açılamadı. Numarayı kontrol et.')
    );
  };

  const handleConfirmSent = (member: Member) => {
    recordDelivery({
      memberId: member.id,
      memberName: member.name,
      trainerName,
      month: currentMonth,
      sentAtLabel: formatDateTimeLabel(new Date()),
      channel: 'whatsapp',
    });
    setPendingSendMemberId(null);
    show(`${member.name} için program gönderildi olarak işaretlendi.`);
  };

  return (
    <AppShell activeId="program">
      <View style={styles.header}>
        <Text style={styles.title}>Program</Text>
        <Text style={styles.subtitle}>
          Sana atanan üyelerin {currentMonth} programlarını yaz ve WhatsApp ile gönder.
        </Text>
      </View>

      {assignedMembers.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Henüz sana atanmış bir üye yok.</Text>
        </Card>
      ) : (
        assignedMembers.map((member) => {
          const program = findProgram(member.id, currentMonth);
          const delivery = findLatestDelivery(member.id, currentMonth);
          const filledWeeks = program ? program.entries.filter((entry) => entry.plan.trim().length > 0).length : 0;
          const isPending = pendingSendMemberId === member.id;
          const canSend = filledWeeks > 0 && Boolean(member.phone);

          return (
            <Card key={member.id} style={styles.memberCard}>
              <View style={[styles.memberRow, isMobile && styles.memberRowMobile]}>
                <View style={styles.memberInfo}>
                  <Avatar initials={member.avatarInitials} size={40} />
                  <View style={styles.memberTextGroup}>
                    <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                    <Text style={styles.memberMeta} numberOfLines={1}>
                      {member.packageName}
                      {member.phone ? ` · ${member.phone}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusGroup}>
                  {program ? (
                    <Badge label={`${filledWeeks}/4 hafta yazıldı`} tone="mint" />
                  ) : (
                    <Badge label="Program yok" tone="neutral" />
                  )}
                  {delivery ? <Badge label={`Gönderildi · ${delivery.sentAtLabel}`} tone="info" /> : null}
                </View>

                <View style={styles.actionsGroup}>
                  <Pressable
                    onPress={() => setProgramModalMember(member)}
                    accessibilityRole="button"
                    accessibilityLabel={`${member.name} programını düzenle`}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                  >
                    <AppIcon name="create-outline" size={15} color={colors.textPrimary} />
                    <Text style={styles.secondaryLabel}>{program ? 'Programı Düzenle' : 'Program Yaz'}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleWhatsAppSend(member)}
                    disabled={!canSend}
                    accessibilityRole="button"
                    accessibilityLabel={`${member.name} programını WhatsApp ile gönder`}
                    style={({ pressed }) => [
                      styles.whatsappButton,
                      !canSend && styles.whatsappButtonDisabled,
                      pressed && canSend && styles.whatsappButtonPressed,
                    ]}
                  >
                    <AppIcon name="logo-whatsapp" size={15} color={colors.white} />
                    <Text style={styles.whatsappLabel}>WhatsApp ile Gönder</Text>
                  </Pressable>
                </View>
              </View>

              {isPending ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmText}>
                    WhatsApp açıldı. Mesajı gönderdiysen aşağıdan işaretle; bu kayıt yöneticiye düşer.
                  </Text>
                  <View style={styles.confirmActions}>
                    <Pressable
                      onPress={() => setPendingSendMemberId(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Vazgeç"
                      hitSlop={8}
                    >
                      <Text style={styles.cancelLink}>Vazgeç</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleConfirmSent(member)}
                      accessibilityRole="button"
                      accessibilityLabel={`${member.name} için gönderildi olarak işaretle`}
                      style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
                    >
                      <AppIcon name="checkmark-done-outline" size={15} color={colors.white} />
                      <Text style={styles.confirmButtonLabel}>Gönderildi Olarak İşaretle</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })
      )}

      <MemberProgramModal
        key={programModalMember?.id ?? 'none'}
        visible={programModalMember !== null}
        member={programModalMember}
        month={currentMonth}
        existingProgram={programModalMember ? findProgram(programModalMember.id, currentMonth) : null}
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
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  memberCard: {
    gap: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  memberRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 180,
  },
  memberTextGroup: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  memberMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  secondaryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primaryDark,
  },
  whatsappButtonPressed: {
    backgroundColor: colors.primary,
  },
  whatsappButtonDisabled: {
    backgroundColor: colors.border,
  },
  whatsappLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
  },
  confirmRow: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  confirmText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  cancelLink: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  confirmButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  confirmButtonLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
  },
});

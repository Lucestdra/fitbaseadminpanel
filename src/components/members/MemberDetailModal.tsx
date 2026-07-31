import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { formatDateLabel, parseDateLabel, addDays } from '@/utils/date';
import type { Member, MemberStatus } from '@/types/members';
import type { PackageTemplate } from '@/types/settings';
import type { TeamMember } from '@/types/team';

interface MemberDetailModalProps {
  visible: boolean;
  member: Member | null;
  packages: PackageTemplate[];
  trainers: TeamMember[];
  onClose: () => void;
  onSave: (member: Member) => void;
}

const STATUS_OPTIONS: { id: MemberStatus; label: string }[] = [
  { id: 'aktif', label: 'Aktif' },
  { id: 'donduruldu', label: 'Donduruldu' },
  { id: 'pasif', label: 'Pasif' },
];

const FREEZE_WEEK_OPTIONS = [1, 2, 4, 8];

type DropdownField = 'package' | 'status' | 'trainer' | null;

export function MemberDetailModal({ visible, member, packages, trainers, onClose, onSave }: MemberDetailModalProps) {
  const [draft, setDraft] = useState<Member | null>(member);
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);
  const [freezePanelOpen, setFreezePanelOpen] = useState(false);
  const [freezeWeeks, setFreezeWeeks] = useState(2);
  const [freezeConfirmVisible, setFreezeConfirmVisible] = useState(false);

  if (!draft) return null;

  const handleClose = () => {
    setOpenDropdown(null);
    setFreezePanelOpen(false);
    setFreezeConfirmVisible(false);
    onClose();
  };

  const handleSave = () => {
    onSave(draft);
    handleClose();
  };

  const previewRenewalDate = formatDateLabel(addDays(parseDateLabel(draft.renewalDate) ?? new Date(), freezeWeeks * 7));

  const handleConfirmFreeze = () => {
    const currentRenewal = parseDateLabel(draft.renewalDate) ?? new Date();
    const newRenewal = addDays(currentRenewal, freezeWeeks * 7);
    const currentEnd = draft.membershipEndDate ? parseDateLabel(draft.membershipEndDate) : null;
    const newEnd = currentEnd ? addDays(currentEnd, freezeWeeks * 7) : undefined;

    const frozenMember: Member = {
      ...draft,
      status: 'donduruldu',
      renewalDate: formatDateLabel(newRenewal),
      renewalDaysLeft: draft.renewalDaysLeft + freezeWeeks * 7,
      membershipEndDate: newEnd ? formatDateLabel(newEnd) : draft.membershipEndDate,
    };
    onSave(frozenMember);
    handleClose();
  };

  const handleUnfreeze = () => {
    onSave({ ...draft, status: 'aktif' });
    handleClose();
  };

  const selectedPackage = packages.find((pkg) => pkg.name === draft.packageName) ?? null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Avatar initials={draft.avatarInitials} size={40} />
              <Text style={styles.title} numberOfLines={1}>{draft.name}</Text>
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Ad Soyad</Text>
            <TextInput
              value={draft.name}
              onChangeText={(value) => setDraft({ ...draft, name: value })}
              style={styles.input}
              accessibilityLabel="Ad Soyad"
            />

            <Text style={styles.fieldLabel}>Cep Telefonu</Text>
            <TextInput
              value={draft.phone ?? ''}
              onChangeText={(value) => setDraft({ ...draft, phone: value })}
              placeholder="+90 5xx xxx xx xx"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              style={styles.input}
              accessibilityLabel="Cep Telefonu"
            />

            <Text style={styles.fieldLabel}>E-posta</Text>
            <TextInput
              value={draft.email ?? ''}
              onChangeText={(value) => setDraft({ ...draft, email: value })}
              placeholder="ornek@eposta.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="E-posta"
            />

            <Text style={styles.fieldLabel}>Paket</Text>
            <DropdownSelect
              placeholder="Paket seç"
              options={packages.map((pkg) => ({ id: pkg.name, label: pkg.name, meta: pkg.price }))}
              selectedId={selectedPackage?.name ?? null}
              onSelect={(id) => {
                setDraft({ ...draft, packageName: id ?? draft.packageName });
                setOpenDropdown(null);
              }}
              open={openDropdown === 'package'}
              onToggle={() => setOpenDropdown((current) => (current === 'package' ? null : 'package'))}
            />

            <Text style={styles.fieldLabel}>Atanan Eğitmen</Text>
            <DropdownSelect
              placeholder="Eğitmen seç"
              options={trainers.map((trainer) => ({ id: trainer.name, label: trainer.name, meta: trainer.specialty ?? undefined }))}
              selectedId={draft.assignedTrainer ?? null}
              onSelect={(id) => {
                setDraft({ ...draft, assignedTrainer: id ?? undefined });
                setOpenDropdown(null);
              }}
              open={openDropdown === 'trainer'}
              onToggle={() => setOpenDropdown((current) => (current === 'trainer' ? null : 'trainer'))}
              clearLabel="Eğitmen Atanmadı"
            />

            <View style={styles.dateRow}>
              <View style={styles.dateRowItem}>
                <Text style={styles.fieldLabel}>Kalan Ders</Text>
                <TextInput
                  value={draft.sessionsRemaining === null ? '' : String(draft.sessionsRemaining)}
                  onChangeText={(value) => {
                    const parsed = parseInt(value, 10);
                    setDraft({ ...draft, sessionsRemaining: Number.isNaN(parsed) ? null : parsed });
                  }}
                  placeholder="Sınırsız"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  style={styles.input}
                  accessibilityLabel="Kalan ders"
                />
              </View>
              <View style={styles.dateRowItem}>
                <Text style={styles.fieldLabel}>Toplam Ders</Text>
                <TextInput
                  value={draft.sessionsTotal === null ? '' : String(draft.sessionsTotal)}
                  onChangeText={(value) => {
                    const parsed = parseInt(value, 10);
                    setDraft({ ...draft, sessionsTotal: Number.isNaN(parsed) ? null : parsed });
                  }}
                  placeholder="Sınırsız"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  style={styles.input}
                  accessibilityLabel="Toplam ders"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Yenileme Tarihi</Text>
            <TextInput
              value={draft.renewalDate}
              onChangeText={(value) => setDraft({ ...draft, renewalDate: value })}
              style={styles.input}
              accessibilityLabel="Yenileme tarihi"
            />

            <Text style={styles.fieldLabel}>Durum</Text>
            <DropdownSelect
              placeholder="Durum seç"
              options={STATUS_OPTIONS.map((option) => ({ id: option.id, label: option.label }))}
              selectedId={draft.status}
              onSelect={(id) => {
                setDraft({ ...draft, status: (id as MemberStatus) ?? draft.status });
                setOpenDropdown(null);
              }}
              open={openDropdown === 'status'}
              onToggle={() => setOpenDropdown((current) => (current === 'status' ? null : 'status'))}
            />

            {draft.status !== 'donduruldu' ? (
              <>
                <Pressable
                  onPress={() => setFreezePanelOpen((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel="Üyeliği dondur"
                  style={({ pressed }) => [styles.freezeToggle, pressed && styles.freezeTogglePressed]}
                >
                  <AppIcon name="pause-circle-outline" size={16} color={colors.textPrimary} />
                  <Text style={styles.freezeToggleLabel}>Üyeliği Dondur</Text>
                </Pressable>

                {freezePanelOpen ? (
                  <View style={styles.freezePanel}>
                    <Text style={styles.fieldLabel}>Dondurma Süresi</Text>
                    <View style={styles.chipRow}>
                      {FREEZE_WEEK_OPTIONS.map((weeks) => {
                        const active = weeks === freezeWeeks;
                        return (
                          <Pressable
                            key={weeks}
                            onPress={() => setFreezeWeeks(weeks)}
                            accessibilityRole="button"
                            accessibilityLabel={`${weeks} hafta`}
                            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
                          >
                            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{weeks} Hafta</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Pressable
                      onPress={() => setFreezeConfirmVisible(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Dondurmayı onayla"
                      style={({ pressed }) => [styles.freezeConfirmButton, pressed && styles.freezeConfirmButtonPressed]}
                    >
                      <Text style={styles.freezeConfirmLabel}>Dondurmayı Onayla ({freezeWeeks} Hafta)</Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            ) : (
              <Pressable
                onPress={handleUnfreeze}
                accessibilityRole="button"
                accessibilityLabel="Dondurmayı kaldır"
                style={({ pressed }) => [styles.freezeToggle, pressed && styles.freezeTogglePressed]}
              >
                <AppIcon name="play-circle-outline" size={16} color={colors.primaryDark} />
                <Text style={[styles.freezeToggleLabel, { color: colors.primaryDark }]}>Dondurmayı Kaldır</Text>
              </Pressable>
            )}

            {draft.gifts && draft.gifts.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Hediyeler</Text>
                {draft.gifts.map((gift) => (
                  <View key={gift.id} style={styles.giftRow}>
                    <AppIcon name="gift-outline" size={14} color={colors.primaryDark} />
                    <Text style={styles.giftText}>{gift.label}</Text>
                    <Text style={styles.giftDate}>{gift.dateLabel}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Değişiklikleri kaydet"
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          >
            <Text style={styles.submitLabel}>Kaydet</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={freezeConfirmVisible} transparent animationType="fade" onRequestClose={() => setFreezeConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.overlayDismiss}
            onPress={() => setFreezeConfirmVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          />
          <View style={styles.confirmPanel}>
            <View style={styles.confirmIconWrap}>
              <AppIcon name="pause-circle-outline" size={22} color={colors.warning} />
            </View>
            <Text style={styles.confirmTitle}>Üyeliği Dondur</Text>
            <Text style={styles.confirmBody}>
              {draft.name} adlı üyenin üyeliği {freezeWeeks} hafta boyunca dondurulacak.
            </Text>
            <Text style={styles.confirmBody}>
              Dondurma süresi bittiğinde bu {freezeWeeks} hafta üyelik süresine otomatik olarak eklenir. Yeni yenileme tarihi:{' '}
              <Text style={styles.confirmBodyStrong}>{previewRenewalDate}</Text>.
            </Text>
            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setFreezeConfirmVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Vazgeç"
                style={({ pressed }) => [styles.confirmCancelButton, pressed && styles.confirmCancelButtonPressed]}
              >
                <Text style={styles.confirmCancelLabel}>Vazgeç</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmFreeze}
                accessibilityRole="button"
                accessibilityLabel="Dondur"
                style={({ pressed }) => [styles.confirmSubmitButton, pressed && styles.confirmSubmitButtonPressed]}
              >
                <Text style={styles.confirmSubmitLabel}>Dondur</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  confirmOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPanel: {
    width: 380,
    maxWidth: '90%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  confirmIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  confirmTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  confirmBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  confirmBodyStrong: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  confirmCancelLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  confirmSubmitButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitButtonPressed: {
    opacity: 0.85,
  },
  confirmSubmitLabel: {
    ...typography.button,
    color: colors.white,
  },
  panel: {
    width: 440,
    maxWidth: '90%',
    maxHeight: '88%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  body: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateRowItem: {
    flex: 1,
  },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  giftText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  giftDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  freezeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  freezeTogglePressed: {
    opacity: 0.7,
  },
  freezeToggleLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  freezePanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: {
    backgroundColor: colors.pageBackground,
  },
  chipActive: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  freezeConfirmButton: {
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeConfirmButtonPressed: {
    opacity: 0.85,
  },
  freezeConfirmLabel: {
    ...typography.button,
    color: colors.white,
  },
  submitButton: {
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});

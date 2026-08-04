import { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { SearchInput } from '@/components/ui/SearchInput';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { colors, spacing, typography, radii } from '@/theme';
import { formatDateLabel } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { formatDayLabel } from '@/utils/calendar';
import { useMemberList } from '@/hooks/useMemberList';
import * as financeApi from '@/api/finance';

interface CreateChargeModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
  onError: (message: string) => void;
}

const INSTALMENT_COUNTS = [1, 2, 3, 4, 6, 8, 12];

/** `YYYY-MM-DD` in local terms, without the UTC round-trip that shifts the day. */
function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Adds a month to a date, clamped to the month's last day.
 *
 * 31 January plus a month is 28 February, not 3 March. `Date` rolls over silently, and a studio
 * that sold a plan on the 31st would find its second instalment falling on the 3rd of the following
 * month and its third on the 3rd after that — a schedule nobody agreed to.
 */
function addMonths(isoDate: string, months: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));

  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  const clamped = String(Math.min(day, lastDay)).padStart(2, '0');
  const targetMonth = String(target.getUTCMonth() + 1).padStart(2, '0');

  return `${target.getUTCFullYear()}-${targetMonth}-${clamped}`;
}

/**
 * A sale, and how it will be paid for.
 *
 * <b>This is the screen the panel is missing entirely.</b> It can record that money arrived and it
 * cannot record that money is owed — which is why its "Bekleyen Ödemeler" tile is a hardcoded
 * constant. Without something to raise a charge, a receivables list is permanently empty and the
 * whole model is unreachable from the UI.
 *
 * <b>No total is sent.</b> The amount typed here is split into instalments and the plan's total is
 * their sum; a second copy of the figure would diverge from the parts the first time somebody
 * edited one. The split is shown before saving, because "₺4.500 üç taksit" hides a remainder — and
 * a studio should see which instalment carries the extra kuruş rather than discover it later.
 */
export function CreateChargeModal({
  visible,
  onClose,
  onCreated,
  onError,
}: CreateChargeModalProps) {
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [total, setTotal] = useState('');
  const [count, setCount] = useState(1);
  const [firstDue, setFirstDue] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const { items: members, status: memberStatus } = useMemberList({
    search: search.trim() || undefined,
    limit: 20,
  });

  // Adjusted during render rather than in an effect, so the form is never briefly showing the
  // previous sale's amount under a fresh title.
  const [seeded, setSeeded] = useState(false);

  if (visible !== seeded) {
    setSeeded(visible);

    if (visible) {
      setSearch('');
      setMemberId(null);
      setMemberName(null);
      setDescription('');
      setTotal('');
      setCount(1);
      setFirstDue(new Date());
    }
  }

  const parsedTotal = Number(total.replace(',', '.'));

  const installments = useMemo(() => {
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) return [];

    const start = isoDay(firstDue);

    // Rounded to the kuruş, with the remainder on the first instalment. Splitting ₺1.000 three ways
    // gives 333,34 + 333,33 + 333,33 — the parts sum to the whole exactly, which is the property
    // the plan's total depends on. Putting the extra on the *first* one means the studio collects
    // it soonest, and it is the instalment somebody is most likely to be looking at.
    const each = Math.floor((parsedTotal * 100) / count) / 100;
    const remainder = Math.round((parsedTotal - each * count) * 100) / 100;

    return Array.from({ length: count }, (_, index) => ({
      amount: index === 0 ? Math.round((each + remainder) * 100) / 100 : each,
      dueOn: addMonths(start, index),
    }));
  }, [parsedTotal, count, firstDue]);

  const canSubmit =
    memberId !== null && description.trim().length > 0 && installments.length > 0 && !saving;

  const submit = () => {
    if (!canSubmit || memberId === null) return;

    setSaving(true);

    void (async () => {
      try {
        const plan = await financeApi.createPaymentPlan({
          memberId,
          membershipId: null,
          description: description.trim(),
          discountAmount: null,
          currency: null,
          installments,
        });

        onCreated(
          `${memberName ?? 'Üye'} için ${formatMoney(plan.totalAmount, plan.currency)} tutarında ` +
            `${plan.installments.length} taksit oluşturuldu.`,
        );
        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Plan oluşturulamadı.');
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Borç Oluştur</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Üye</Text>

            {memberId === null ? (
              <>
                <SearchInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Üye ara (ad, telefon...)"
                />
                <View style={styles.memberList}>
                  {memberStatus === 'loading' ? (
                    <ActivityIndicator style={styles.loading} color={colors.primary} />
                  ) : members.length === 0 ? (
                    <Text style={styles.empty}>Eşleşen üye yok.</Text>
                  ) : (
                    members.map((member) => (
                      <Pressable
                        key={member.id}
                        onPress={() => {
                          setMemberId(member.id);
                          setMemberName(member.fullName);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${member.fullName} seç`}
                        style={({ pressed }) => [styles.memberRow, pressed && styles.memberPressed]}
                      >
                        <Text style={styles.memberName}>{member.fullName}</Text>
                        <Text style={styles.memberMeta}>{member.phoneNumber ?? '—'}</Text>
                      </Pressable>
                    ))
                  )}
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => {
                  setMemberId(null);
                  setMemberName(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Üyeyi değiştir"
                style={({ pressed }) => [styles.selectedMember, pressed && styles.memberPressed]}
              >
                <Text style={styles.memberName}>{memberName ?? 'Seçili üye'}</Text>
                <Text style={styles.memberMeta}>Değiştir</Text>
              </Pressable>
            )}

            <Text style={styles.fieldLabel}>Açıklama</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Gold Paket Yenileme"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Açıklama"
            />

            {/* Snapshotted at sale, like a membership's package name (ADR-0035). Renaming the
                package later must not rewrite what this member agreed to. */}
            <Text style={styles.hint}>Üyenin göreceği açıklama. Sonradan değişmez.</Text>

            <Text style={styles.fieldLabel}>Toplam Tutar (₺)</Text>
            <TextInput
              value={total}
              onChangeText={setTotal}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="Toplam tutar"
            />

            <Text style={styles.fieldLabel}>Taksit Sayısı</Text>
            <View style={styles.countRow}>
              {INSTALMENT_COUNTS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setCount(option)}
                  accessibilityRole="button"
                  accessibilityLabel={`${option} taksit`}
                  style={[styles.countChip, count === option && styles.countChipActive]}
                >
                  <Text style={[styles.countLabel, count === option && styles.countLabelActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>İlk Vade</Text>
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="İlk vade tarihi seç"
              style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
            >
              <Text style={styles.dateFieldText}>{formatDateLabel(firstDue)}</Text>
              <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Shown before saving. "₺4.500, üç taksit" hides a remainder, and a studio should see
                which instalment carries the extra kuruş rather than find it on a receipt. */}
            {installments.length > 0 ? (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Oluşacak taksitler</Text>
                {installments.map((entry, index) => (
                  <View key={entry.dueOn} style={styles.previewRow}>
                    <Text style={styles.previewLabel}>
                      {index + 1}. taksit · {formatDayLabel(entry.dueOn)}
                    </Text>
                    <Text style={styles.previewAmount}>{formatMoney(entry.amount, 'TRY')}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Borcu oluştur"
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>{saving ? 'Oluşturuluyor...' : 'Oluştur'}</Text>
          </Pressable>
        </View>
      </View>

      <SingleDatePickerModal
        visible={datePickerVisible}
        title="İlk Vade Tarihi"
        initialDate={firstDue}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(picked) => {
          setFirstDue(picked);
          setDatePickerVisible(false);
        }}
      />
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
  panel: {
    width: 440,
    maxWidth: '90%',
    maxHeight: '85%',
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
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  memberList: {
    maxHeight: 180,
    marginTop: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberPressed: {
    backgroundColor: colors.pageBackground,
  },
  selectedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  memberName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  memberMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    padding: spacing.lg,
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countChip: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  countLabel: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  countLabelActive: {
    color: colors.white,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  dateFieldPressed: {
    backgroundColor: colors.cardBackground,
  },
  dateFieldText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  previewBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
    gap: spacing.xs,
  },
  previewTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewAmount: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  submitButton: {
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});

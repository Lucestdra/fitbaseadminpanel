import { useEffect, useState } from 'react';
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
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { colors, spacing, typography, radii } from '@/theme';
import { formatDateLabel } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { formatDayLabel } from '@/utils/calendar';
import { useMemberList } from '@/hooks/useMemberList';
import { PAYMENT_METHOD_LABELS } from '@/api/enums';
import * as financeApi from '@/api/finance';
import type { PaymentMethod, ReceivableItem } from '@/api/finance';

interface RecordPaymentModalProps {
  visible: boolean;
  /** Pre-selects a member, when the studio arrived here from a receivable row. */
  initialMemberId?: string | null;
  initialMemberName?: string | null;
  onClose: () => void;
  onRecorded: (message: string) => void;
  onError: (message: string) => void;
}

const METHOD_OPTIONS: NonNullable<PaymentMethod>[] = ['CreditCard', 'Cash', 'BankTransfer', 'Other'];

/**
 * Money that arrived.
 *
 * <b>The amount is a number.</b> The panel held it as a display string and parsed it back with
 * `price.replace(/[^0-9]/g, '')`, which reads ₺2.400,50 as 240050 — off by a factor of a hundred,
 * silently, in the direction that makes a studio think it had a good month. That regex is gone and
 * nothing here ever reads a formatted string.
 *
 * <b>The allocation is the server's decision.</b> This screen shows what the member owes so the
 * person taking the money can see it; it does not decide what the payment settles. Oldest debt
 * first is the rule, applied server-side under a row lock, because the balance can move between
 * this list rendering and the button being pressed.
 *
 * An overpayment is accepted rather than refused. The money arrived; where it goes is a separate
 * question, and refusing the record would leave the studio holding cash the system says it never
 * received.
 */
export function RecordPaymentModal({
  visible,
  initialMemberId,
  initialMemberName,
  onClose,
  onRecorded,
  onError,
}: RecordPaymentModalProps) {
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState<string | null>(initialMemberId ?? null);
  const [memberName, setMemberName] = useState<string | null>(initialMemberName ?? null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<NonNullable<PaymentMethod>>('CreditCard');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [owed, setOwed] = useState<ReceivableItem[]>([]);
  const [owedStatus, setOwedStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

  // The picker's own list, separate from the debt lookup below.
  const { items: members, status: memberStatus } = useMemberList({
    search: search.trim() || undefined,
    limit: 20,
  });

  // Adjusted during render rather than in an effect. A form that resets in `useEffect` renders
  // once with the previous member's balance still on screen before the reset lands — which, on a
  // screen about money, means somebody can see the wrong person's debt for a frame. React's own
  // guidance is to derive it: https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const seed = visible ? (initialMemberId ?? 'none') : null;
  const [seeded, setSeeded] = useState<string | null>(null);

  if (seed !== seeded) {
    setSeeded(seed);
    setMemberId(initialMemberId ?? null);
    setMemberName(initialMemberName ?? null);
    setSearch('');
    setAmount('');
    setReference('');
    setNote('');
    setPaidAt(new Date());
    setMethodOpen(false);
    setOwed([]);
    setOwedStatus(visible && initialMemberId ? 'loading' : 'idle');
  }

  useEffect(() => {
    if (!visible || memberId === null) return;

    let cancelled = false;

    void (async () => {
      try {
        const next = await financeApi.listReceivables({ memberId, limit: 20 });
        if (cancelled) return;

        setOwed(next.items);
        setOwedStatus('ready');

        // Prefilled with the whole balance, which is what somebody clearing an account types
        // anyway — and editable, because a part payment is the case this model exists to express.
        setAmount(next.totalOutstanding > 0 ? String(next.totalOutstanding) : '');
      } catch {
        if (cancelled) return;

        // Not an error state. The debt list is context, not the transaction — a payment can still
        // be recorded without it, and blocking on it would stop somebody taking cash at the desk.
        setOwed([]);
        setOwedStatus('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, memberId]);

  const parsedAmount = Number(amount.replace(',', '.'));
  const canSubmit =
    memberId !== null && Number.isFinite(parsedAmount) && parsedAmount > 0 && !saving;

  const outstanding = owed.reduce((total, item) => total + item.outstandingAmount, 0);
  const overpaying = owedStatus === 'ready' && parsedAmount > outstanding && parsedAmount > 0;

  const submit = () => {
    if (!canSubmit || memberId === null) return;

    setSaving(true);

    void (async () => {
      try {
        const receipt = await financeApi.recordPayment({
          memberId,
          amount: parsedAmount,
          currency: null,
          method,
          paidAt: paidAt.toISOString(),
          reference: reference.trim() || null,
          note: note.trim() || null,

          // Null: the server settles the oldest debt first. An explicit list belongs to the case
          // that rule gets wrong, and this form is the ordinary case.
          allocations: null,
        });

        const credit =
          receipt.unallocatedAmount > 0
            ? ` ${formatMoney(receipt.unallocatedAmount, 'TRY')} alacak olarak bekliyor.`
            : '';

        onRecorded(`${memberName ?? 'Üye'} için ödeme kaydedildi.${credit}`);
        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Ödeme kaydedilemedi.');
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
            <Text style={styles.title}>Ödeme Kaydet</Text>
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

                          // Set here rather than in the effect below: an event handler is where a
                          // state change belongs, and it means the balance box shows a spinner from
                          // the moment somebody picks rather than showing nothing until the
                          // request starts.
                          setOwed([]);
                          setOwedStatus('loading');
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
                  setOwed([]);
                  setOwedStatus('idle');
                }}
                accessibilityRole="button"
                accessibilityLabel="Üyeyi değiştir"
                style={({ pressed }) => [styles.selectedMember, pressed && styles.memberPressed]}
              >
                <Text style={styles.memberName}>{memberName ?? 'Seçili üye'}</Text>
                <Text style={styles.memberMeta}>Değiştir</Text>
              </Pressable>
            )}

            {/* What they owe, so the person taking the money can see it. Not a decision this screen
                makes — the allocation happens server-side, against the balance as it is when the
                button is pressed rather than as it was when this rendered. */}
            {memberId !== null && owedStatus !== 'idle' ? (
              <View style={styles.owedBox}>
                {owedStatus === 'loading' ? (
                  <ActivityIndicator color={colors.primary} />
                ) : owed.length === 0 ? (
                  <Text style={styles.owedEmpty}>
                    Bu üyenin bekleyen borcu yok. Kaydedilen tutar alacak olarak durur ve bir
                    sonraki taksite sayılır.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.owedTitle}>
                      Bekleyen borç: {formatMoney(outstanding, 'TRY')}
                    </Text>
                    {owed.slice(0, 4).map((item) => (
                      <View key={item.installmentId} style={styles.owedRow}>
                        <Text style={styles.owedLabel} numberOfLines={1}>
                          {item.description} · {item.sequence}. taksit
                        </Text>
                        <Text style={[styles.owedAmount, item.isOverdue && styles.owedLate]}>
                          {formatMoney(item.outstandingAmount, item.currency)} ·{' '}
                          {formatDayLabel(item.dueOn)}
                        </Text>
                      </View>
                    ))}
                    {owed.length > 4 ? (
                      <Text style={styles.owedMore}>+{owed.length - 4} taksit daha</Text>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Tutar (₺)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="Tutar"
            />

            {overpaying ? (
              <Text style={styles.overpayNotice}>
                Borcundan {formatMoney(parsedAmount - outstanding, 'TRY')} fazla. Fazlası alacak
                olarak kaydedilir.
              </Text>
            ) : null}

            <Text style={styles.fieldLabel}>Ödeme Yöntemi</Text>
            <DropdownSelect
              placeholder="Yöntem seç"
              options={METHOD_OPTIONS.map((option) => ({
                id: option,
                label: PAYMENT_METHOD_LABELS[option],
              }))}
              selectedId={method}
              onSelect={(id) => {
                setMethod((id as NonNullable<PaymentMethod>) ?? 'CreditCard');
                setMethodOpen(false);
              }}
              open={methodOpen}
              onToggle={() => setMethodOpen((current) => !current)}
            />

            <Text style={styles.fieldLabel}>Tarih</Text>
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Ödeme tarihi seç"
              style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
            >
              <Text style={styles.dateFieldText}>{formatDateLabel(paidAt)}</Text>
              <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Distinct from when this was typed. A studio recording Friday's cash on Monday means
                both are true, and only one of them is the revenue date. */}
            <Text style={styles.hint}>Paranın geldiği tarih. Ciro bu tarihe göre sayılır.</Text>

            <Text style={styles.fieldLabel}>Referans</Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Havale açıklaması, dekont no..."
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Referans"
            />

            <Text style={styles.fieldLabel}>Not</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="İsteğe bağlı"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Not"
            />
          </ScrollView>

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Ödemeyi kaydet"
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
          </Pressable>
        </View>
      </View>

      <SingleDatePickerModal
        visible={datePickerVisible}
        title="Ödeme Tarihi Seç"
        initialDate={paidAt}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(picked) => {
          setPaidAt(picked);
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
    maxHeight: 200,
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
  owedBox: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
    gap: spacing.xs,
  },
  owedTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  owedEmpty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  owedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  owedLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  owedAmount: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  owedLate: {
    color: colors.critical,
  },
  owedMore: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overpayNotice: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
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

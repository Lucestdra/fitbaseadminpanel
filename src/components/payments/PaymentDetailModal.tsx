import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { formatMoney } from '@/utils/money';
import { formatDayLabel } from '@/utils/calendar';
import { localDayOf } from '@/utils/instants';
import { initialsOf } from '@/utils/name';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  REFUND_REASON_LABELS,
} from '@/api/enums';
import * as financeApi from '@/api/finance';
import type { PaymentListItem, RefundReason } from '@/api/finance';

interface PaymentDetailModalProps {
  visible: boolean;
  payment: PaymentListItem | null;
  timeZoneId: string;
  /** Refunding is its own permission — recording money and giving it back are different authorities. */
  canRefund: boolean;
  canManage: boolean;
  onClose: () => void;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}

const REFUND_REASONS: NonNullable<RefundReason>[] = [
  'MemberRequest',
  'StudioCancellation',
  'BillingError',
  'Other',
];

type Pending = 'void' | 'refund' | null;

/**
 * One payment, and the two things that can be done to it.
 *
 * <b>Nothing here edits the payment.</b> The panel's version was a form: status, method, amount and
 * date were all editable dropdowns, so correcting last month's mistake silently rewrote last
 * month's revenue and nothing afterwards could tell. A payment is a record of what happened.
 *
 * The two actions are deliberately not the same thing (ADR-0034). <b>Voiding</b> says the payment
 * never happened — a row typed twice — so what it settled becomes owed again. <b>Refunding</b> says
 * it happened and was given back, so the collection stays in the month it occurred and the refund
 * lands in its own. Collapsing them makes last month's revenue depend on which word somebody chose
 * this month.
 */
export function PaymentDetailModal({
  visible,
  payment,
  timeZoneId,
  canRefund,
  canManage,
  onClose,
  onChanged,
  onError,
}: PaymentDetailModalProps) {
  const [pending, setPending] = useState<Pending>(null);
  const [voidReason, setVoidReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState<NonNullable<RefundReason>>('MemberRequest');
  const [refundNote, setRefundNote] = useState('');
  const [reasonOpen, setReasonOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Adjusted during render rather than in an effect. The refund box is prefilled with what is
  // left to refund, and an effect would render it once carrying the *previous* payment's figure —
  // which somebody could press before the correction arrived.
  const seed = visible ? (payment?.id ?? 'none') : null;
  const [seeded, setSeeded] = useState<string | null>(null);

  if (seed !== seeded) {
    setSeeded(seed);
    setPending(null);
    setVoidReason('');
    setRefundNote('');
    setReasonOpen(false);
    setRefundReason('MemberRequest');
    setRefundAmount(payment ? String(payment.amount - payment.refundedAmount) : '');
  }

  if (!payment) return null;

  const name = payment.memberName ?? 'Bilinmeyen üye';
  const refundable = payment.amount - payment.refundedAmount;
  const parsedRefund = Number(refundAmount.replace(',', '.'));

  const runVoid = () => {
    setBusy(true);

    void (async () => {
      try {
        await financeApi.voidPayment(payment.id, voidReason.trim() || null);
        onChanged(`${name} için ödeme geri alındı. Ödediği taksit yeniden borç olarak göründü.`);
        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Ödeme geri alınamadı.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const runRefund = () => {
    setBusy(true);

    void (async () => {
      try {
        await financeApi.refundPayment(payment.id, {
          amount: parsedRefund,
          reason: refundReason,
          note: refundNote.trim() || null,
        });
        onChanged(`${name} için ${formatMoney(parsedRefund, payment.currency)} iade edildi.`);
        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'İade kaydedilemedi.');
      } finally {
        setBusy(false);
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
            <View style={styles.headerRow}>
              <Avatar initials={initialsOf(name)} size={40} />
              <View style={styles.headerTextGroup}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.description} numberOfLines={1}>
                  {payment.description ?? 'Bir plana bağlı değil'}
                </Text>
              </View>
              <Badge
                label={PAYMENT_STATUS_LABELS[payment.status]}
                tone={PAYMENT_STATUS_TONES[payment.status]}
              />
            </View>
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
            <View style={styles.factRow}>
              <Text style={styles.factLabel}>Tutar</Text>
              <Text style={styles.factValue}>
                {formatMoney(payment.amount, payment.currency)}
              </Text>
            </View>
            <View style={styles.factRow}>
              <Text style={styles.factLabel}>Yöntem</Text>
              <Text style={styles.factValue}>{PAYMENT_METHOD_LABELS[payment.method]}</Text>
            </View>
            <View style={styles.factRow}>
              <Text style={styles.factLabel}>Tarih</Text>
              <Text style={styles.factValue}>
                {formatDayLabel(localDayOf(payment.paidAt, timeZoneId))}
              </Text>
            </View>
            {payment.reference ? (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Referans</Text>
                <Text style={styles.factValue} numberOfLines={2}>
                  {payment.reference}
                </Text>
              </View>
            ) : null}
            {payment.refundedAmount > 0 ? (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>İade Edilen</Text>
                <Text style={[styles.factValue, styles.refund]}>
                  −{formatMoney(payment.refundedAmount, payment.currency)}
                </Text>
              </View>
            ) : null}

            {pending === 'void' ? (
              <View style={styles.actionBox}>
                <Text style={styles.actionTitle}>Ödemeyi geri al</Text>
                <Text style={styles.actionBody}>
                  Bu ödeme hiç yapılmamış sayılır. Kapattığı taksit yeniden borç olarak görünür. Para
                  üyeye geri veriliyorsa bunun yerine iade kullan.
                </Text>
                <TextInput
                  value={voidReason}
                  onChangeText={setVoidReason}
                  placeholder="Sebep (iki kere girildi...)"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  accessibilityLabel="Geri alma sebebi"
                />
                <Pressable
                  onPress={runVoid}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Geri almayı onayla"
                  style={({ pressed }) => [
                    styles.dangerButton,
                    busy && styles.buttonDisabled,
                    pressed && !busy && styles.dangerPressed,
                  ]}
                >
                  <Text style={styles.dangerLabel}>
                    {busy ? 'İşleniyor...' : 'Geri almayı onayla'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {pending === 'refund' ? (
              <View style={styles.actionBox}>
                <Text style={styles.actionTitle}>İade et</Text>
                <Text style={styles.actionBody}>
                  Tahsilat kendi ayında kalır, iade bugünün ayına yazılır. En fazla{' '}
                  {formatMoney(refundable, payment.currency)} iade edilebilir.
                </Text>

                <TextInput
                  value={refundAmount}
                  onChangeText={setRefundAmount}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  accessibilityLabel="İade tutarı"
                />

                <DropdownSelect
                  placeholder="İade sebebi"
                  options={REFUND_REASONS.map((reason) => ({
                    id: reason,
                    label: REFUND_REASON_LABELS[reason],
                  }))}
                  selectedId={refundReason}
                  onSelect={(id) => {
                    setRefundReason((id as NonNullable<RefundReason>) ?? 'MemberRequest');
                    setReasonOpen(false);
                  }}
                  open={reasonOpen}
                  onToggle={() => setReasonOpen((current) => !current)}
                />

                <TextInput
                  value={refundNote}
                  onChangeText={setRefundNote}
                  placeholder="Not (isteğe bağlı)"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  accessibilityLabel="İade notu"
                />

                <Pressable
                  onPress={runRefund}
                  disabled={busy || !(parsedRefund > 0 && parsedRefund <= refundable)}
                  accessibilityRole="button"
                  accessibilityLabel="İadeyi onayla"
                  style={({ pressed }) => [
                    styles.dangerButton,
                    (busy || !(parsedRefund > 0 && parsedRefund <= refundable)) &&
                      styles.buttonDisabled,
                    pressed && !busy && styles.dangerPressed,
                  ]}
                >
                  <Text style={styles.dangerLabel}>{busy ? 'İşleniyor...' : 'İadeyi onayla'}</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>

          {/* Both hidden once the payment is withdrawn: there is nothing left to withdraw, and a
              payment that never happened cannot be given back. */}
          {payment.status === 'Voided' ? (
            <Text style={styles.voidedNotice}>Bu ödeme geri alındı.</Text>
          ) : (
            <View style={styles.actions}>
              {canManage ? (
                <Pressable
                  onPress={() => setPending((current) => (current === 'void' ? null : 'void'))}
                  accessibilityRole="button"
                  accessibilityLabel="Ödemeyi geri al"
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
                >
                  <Text style={styles.secondaryLabel}>Geri Al</Text>
                </Pressable>
              ) : null}

              {canRefund && refundable > 0 ? (
                <Pressable
                  onPress={() => setPending((current) => (current === 'refund' ? null : 'refund'))}
                  accessibilityRole="button"
                  accessibilityLabel="İade et"
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
                >
                  <Text style={styles.primaryLabel}>İade Et</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
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
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  factLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  factValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  refund: {
    color: colors.critical,
  },
  actionBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
    gap: spacing.md,
  },
  actionTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  actionBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    outlineStyle: 'none' as never,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  secondaryButton: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    backgroundColor: colors.pageBackground,
  },
  secondaryLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  primaryButton: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryLabel: {
    ...typography.captionStrong,
    color: colors.white,
  },
  dangerButton: {
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerPressed: {
    opacity: 0.85,
  },
  dangerLabel: {
    ...typography.button,
    color: colors.white,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  voidedNotice: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

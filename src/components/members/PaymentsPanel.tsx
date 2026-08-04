import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import * as financeApi from '@/api/finance';
import {
  INSTALLMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from '@/api/enums';
import { formatMoney } from '@/utils/money';
import { formatDayLabel } from '@/utils/calendar';
import { localDayOf } from '@/utils/instants';
import { colors, spacing, typography, radii } from '@/theme';
import type { MemberFinance } from '@/api/finance';

interface PaymentsPanelProps {
  memberId: string;
  /** The studio's zone. A payment taken at 23:40 belongs to the day the studio was open. */
  timeZoneId: string;
}

/**
 * What this member bought, paid and still owes.
 *
 * <b>The fifth tab, left out of Phase 2.2 on purpose.</b> The plan lists it and the finance module
 * did not exist yet; a tab opening onto "yakında" would have looked like a broken feature rather
 * than an unbuilt one.
 *
 * Three numbers at the top and none of them computed here. Outstanding, overdue and the credit the
 * member is holding all come from the server, from the same expression the payments screen and its
 * counters use (ADR-0033) — so a member's drawer and the receivables list cannot disagree about
 * what they owe.
 *
 * <b>The credit line is the one worth having.</b> A member who has overpaid and one who owes
 * nothing look identical without it, and the difference is discovered when they ask why they were
 * charged again.
 */
export function PaymentsPanel({ memberId, timeZoneId }: PaymentsPanelProps) {
  const [finance, setFinance] = useState<MemberFinance | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const generation = useRef(0);

  useEffect(() => {
    // Wrapped rather than a direct call, so no state is set before an await — a cascading render
    // on open is what makes a drawer feel like it stutters.
    void (async () => {
      const current = ++generation.current;

      try {
        const next = await financeApi.getMemberFinance(memberId);

        if (generation.current !== current) return;

        setFinance(next);
        setStatus('ready');
      } catch {
        if (generation.current !== current) return;
        setStatus('error');
      }
    })();
  }, [memberId]);

  if (status === 'loading') {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  }

  if (status === 'error' || finance === null) {
    return <Text style={styles.stateText}>Ödeme bilgileri alınamadı.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Bekleyen Borç</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(finance.totalOutstanding, 'TRY')}
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Gecikmiş</Text>
          <Text style={[styles.summaryValue, finance.totalOverdue > 0 && styles.overdue]}>
            {formatMoney(finance.totalOverdue, 'TRY')}
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Alacağı</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(finance.unallocatedCredit, 'TRY')}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Planlar</Text>

      {finance.plans.length === 0 ? (
        <Text style={styles.stateText}>Bu üyeye açılmış bir ödeme planı yok.</Text>
      ) : (
        finance.plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle} numberOfLines={1}>
                {plan.description}
              </Text>
              <Text style={styles.planTotal}>{formatMoney(plan.totalAmount, plan.currency)}</Text>
            </View>

            {plan.discountAmount > 0 ? (
              <Text style={styles.planMeta}>
                {formatMoney(plan.discountAmount, plan.currency)} indirim uygulandı
              </Text>
            ) : null}

            {plan.installments.map((installment) => (
              <View key={installment.installmentId} style={styles.installmentRow}>
                <View style={styles.installmentInfo}>
                  <Text style={styles.installmentLabel}>
                    {installment.sequence}. taksit · {formatDayLabel(installment.dueOn)}
                  </Text>

                  {/* The status is what separates a settled instalment from a written-off one.
                      Both show ₺0 outstanding, and they are not the same thing — one was paid and
                      the other was a discount the studio decided to give. */}
                  <Text
                    style={[styles.installmentStatus, installment.isOverdue && styles.overdue]}
                  >
                    {installment.isOverdue
                      ? `${installment.daysOverdue} gün gecikti`
                      : INSTALLMENT_STATUS_LABELS[installment.status]}
                  </Text>
                </View>

                <View style={styles.installmentAmounts}>
                  <Text style={styles.installmentAmount}>
                    {formatMoney(installment.amount, installment.currency)}
                  </Text>

                  {/* Only when it differs. A part-paid instalment is the case the panel's single
                      amount column could not express at all. */}
                  {installment.outstandingAmount > 0 &&
                  installment.outstandingAmount !== installment.amount ? (
                    <Text style={styles.installmentRemaining}>
                      {formatMoney(installment.outstandingAmount, installment.currency)} kaldı
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}

            <View style={styles.planFooter}>
              <Text style={styles.planMeta}>Kalan</Text>
              <Text style={styles.planOutstanding}>
                {formatMoney(plan.outstandingAmount, plan.currency)}
              </Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Ödemeler</Text>

      {finance.payments.length === 0 ? (
        <Text style={styles.stateText}>Henüz ödeme kaydı yok.</Text>
      ) : (
        finance.payments.map((payment) => (
          <View key={payment.id} style={styles.paymentRow}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentDescription} numberOfLines={1}>
                {payment.description ?? 'Bir plana bağlı değil'}
              </Text>
              <Text style={styles.paymentMeta}>
                {PAYMENT_METHOD_LABELS[payment.method]} ·{' '}
                {formatDayLabel(localDayOf(payment.paidAt, timeZoneId))}
              </Text>
            </View>

            <View style={styles.paymentAmounts}>
              <Text style={styles.paymentAmount}>
                {formatMoney(payment.amount, payment.currency)}
              </Text>
              {payment.refundedAmount > 0 ? (
                <Text style={styles.refund}>
                  −{formatMoney(payment.refundedAmount, payment.currency)} iade
                </Text>
              ) : null}
            </View>

            <Badge
              label={PAYMENT_STATUS_LABELS[payment.status]}
              tone={PAYMENT_STATUS_TONES[payment.status]}
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  loading: {
    paddingVertical: spacing.xxl,
  },
  stateText: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryBox: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  overdue: {
    color: colors.critical,
  },
  sectionTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  planTotal: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  planMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  installmentInfo: {
    flex: 1,
    gap: 2,
  },
  installmentLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  installmentStatus: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  installmentAmounts: {
    alignItems: 'flex-end',
  },
  installmentAmount: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  installmentRemaining: {
    ...typography.caption,
    color: colors.warning,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  planOutstanding: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentDescription: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  paymentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  paymentAmounts: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  refund: {
    ...typography.caption,
    color: colors.critical,
  },
});

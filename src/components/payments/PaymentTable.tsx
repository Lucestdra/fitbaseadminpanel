import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '@/api/enums';
import { formatMoney } from '@/utils/money';
import { formatDayLabel } from '@/utils/calendar';
import { localDayOf } from '@/utils/instants';
import { initialsOf } from '@/utils/name';
import type { PaymentListItem } from '@/api/finance';

interface PaymentTableProps {
  payments: PaymentListItem[];
  /** The studio's zone. A payment taken at 23:40 belongs to the day the studio was open. */
  timeZoneId: string;
  onPaymentPress: (payment: PaymentListItem) => void;
}

/**
 * What arrived, and what went back out.
 *
 * <b>There is no "gecikti" row here any more</b>, and its absence is the point. The panel had it as
 * a payment status, which made lateness a property of a payment — but a payment that arrived is
 * never late. What was late is money the studio was waiting for, and that lives on the receivables
 * tab (ADR-0033).
 */
export function PaymentTable({ payments, timeZoneId, onPaymentPress }: PaymentTableProps) {
  const { isMobile } = useResponsiveLayout();

  // A member whose name could not be resolved is marked rather than left blank. Blank reads as a
  // payment from nobody, which is not a thing that can happen.
  const nameOf = (payment: PaymentListItem) => payment.memberName ?? 'Bilinmeyen üye';

  const dayOf = (instant: string) => formatDayLabel(localDayOf(instant, timeZoneId));

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {payments.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPaymentPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`${nameOf(item)} ödeme detayı`}
          >
            <Card style={styles.mobileCard}>
              <View style={styles.mobileHeaderRow}>
                <Avatar initials={initialsOf(nameOf(item))} />
                <View style={styles.mobileNameGroup}>
                  <Text style={styles.name} numberOfLines={1}>
                    {nameOf(item)}
                  </Text>
                  <Text style={styles.description} numberOfLines={1}>
                    {item.description ?? 'Bir plana bağlı değil'}
                  </Text>
                </View>
                <Badge
                  label={PAYMENT_STATUS_LABELS[item.status]}
                  tone={PAYMENT_STATUS_TONES[item.status]}
                />
              </View>
              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Tutar</Text>
                <Text style={styles.mobileMetaValue}>{formatMoney(item.amount, item.currency)}</Text>
              </View>
              {item.refundedAmount > 0 ? (
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>İade Edilen</Text>
                  <Text style={[styles.mobileMetaValue, styles.refund]}>
                    −{formatMoney(item.refundedAmount, item.currency)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Yöntem</Text>
                <Text style={styles.mobileMetaValue}>{PAYMENT_METHOD_LABELS[item.method]}</Text>
              </View>
              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Tarih</Text>
                <Text style={styles.mobileMetaValue}>{dayOf(item.paidAt)}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <Card style={styles.card} noPadding>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, columnStyles.member]}>Üye</Text>
        <Text style={[styles.headerLabel, columnStyles.description]}>Açıklama</Text>
        <Text style={[styles.headerLabel, columnStyles.amount]}>Tutar</Text>
        <Text style={[styles.headerLabel, columnStyles.method]}>Yöntem</Text>
        <Text style={[styles.headerLabel, columnStyles.date]}>Tarih</Text>
        <Text style={[styles.headerLabel, columnStyles.status]}>Durum</Text>
      </View>

      {payments.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={() => onPaymentPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${nameOf(item)} ödeme detayı`}
          style={({ pressed }) => [
            styles.row,
            index === payments.length - 1 && styles.rowLast,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={[styles.memberCell, columnStyles.member]}>
            <Avatar initials={initialsOf(nameOf(item))} size={32} />
            <Text style={styles.name} numberOfLines={1}>
              {nameOf(item)}
            </Text>
          </View>
          <Text style={[styles.cellText, columnStyles.description]} numberOfLines={1}>
            {item.description ?? 'Bir plana bağlı değil'}
          </Text>
          <View style={columnStyles.amount}>
            <Text style={[styles.cellText, styles.amount]}>
              {formatMoney(item.amount, item.currency)}
            </Text>

            {/* On the row rather than only in the detail. A collection that was partly given back
                is a different number from the one beside it, and somebody reconciling a day's
                takings needs to see that without opening anything. */}
            {item.refundedAmount > 0 ? (
              <Text style={styles.refund}>
                −{formatMoney(item.refundedAmount, item.currency)} iade
              </Text>
            ) : null}
          </View>
          <Text style={[styles.cellText, columnStyles.method]} numberOfLines={1}>
            {PAYMENT_METHOD_LABELS[item.method]}
          </Text>
          <Text style={[styles.cellText, columnStyles.date]} numberOfLines={1}>
            {dayOf(item.paidAt)}
          </Text>
          <View style={columnStyles.status}>
            <Badge
              label={PAYMENT_STATUS_LABELS[item.status]}
              tone={PAYMENT_STATUS_TONES[item.status]}
            />
          </View>
        </Pressable>
      ))}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  member: { flex: 1.7 },
  description: { flex: 1.8 },
  amount: { flex: 1.1 },
  method: { flex: 1.2 },
  date: { flex: 1.3 },
  status: { flex: 1.2 },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 64,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.pageBackground,
  },
  memberCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cellText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  amount: {
    ...typography.bodyStrong,
  },
  refund: {
    ...typography.caption,
    color: colors.critical,
  },
  mobileList: {
    gap: spacing.md,
  },
  mobileCard: {
    gap: spacing.sm,
  },
  mobileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mobileNameGroup: {
    flex: 1,
    gap: 2,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mobileMetaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mobileMetaValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
});

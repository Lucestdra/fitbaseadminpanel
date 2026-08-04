import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatMoney } from '@/utils/money';
import { formatDayLabel } from '@/utils/calendar';
import { initialsOf } from '@/utils/name';
import type { ReceivableItem } from '@/api/finance';

interface ReceivablesTableProps {
  items: ReceivableItem[];
  /** The grace period the server used. Rendered so the screen never states its own. */
  graceDays: number;
  onCollect: (item: ReceivableItem) => void;
}

/**
 * What the studio is owed.
 *
 * <b>A screen the panel does not have at all.</b> Its payments list conflated money that arrived
 * with money that had not — `bekliyor` was a payment row for a payment that never happened — so
 * "who owes us what" was answerable only by reading the list and doing the subtraction by eye. The
 * outstanding tile above it was a hardcoded ₺67.850.
 *
 * <b>Nothing here decides whether a row is late.</b> `isOverdue` and `daysOverdue` arrive computed
 * from the studio's own today and its own grace period (ADR-0033). A client that did the comparison
 * would do it against the device clock, which is in whichever zone the laptop happens to be — and
 * would disagree with the counter above it the moment the two rounded differently.
 */
export function ReceivablesTable({ items, graceDays, onCollect }: ReceivablesTableProps) {
  const { isMobile } = useResponsiveLayout();

  const nameOf = (item: ReceivableItem) => item.memberName ?? 'Bilinmeyen üye';

  const lateness = (item: ReceivableItem) =>
    item.isOverdue ? `${item.daysOverdue} gün gecikti` : `Vadesi ${formatDayLabel(item.dueOn)}`;

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {items.map((item) => (
          <Card key={item.installmentId} style={styles.mobileCard}>
            <View style={styles.mobileHeaderRow}>
              <Avatar initials={initialsOf(nameOf(item))} />
              <View style={styles.mobileNameGroup}>
                <Text style={styles.name} numberOfLines={1}>
                  {nameOf(item)}
                </Text>
                <Text style={styles.description} numberOfLines={1}>
                  {item.description} · {item.sequence}. taksit
                </Text>
              </View>
              {item.isOverdue ? <Badge label="Gecikti" tone="critical" /> : null}
            </View>

            <View style={styles.mobileMetaRow}>
              <Text style={styles.mobileMetaLabel}>Kalan</Text>
              <Text style={styles.mobileMetaValue}>
                {formatMoney(item.outstandingAmount, item.currency)}
              </Text>
            </View>

            {/* Only when they differ. Showing "₺2.400 taksitin ₺2.400'i" on every full instalment
                is noise; showing it on a part-paid one is the whole reason the column exists. */}
            {item.outstandingAmount !== item.amount ? (
              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Taksit tutarı</Text>
                <Text style={styles.mobileMetaValue}>
                  {formatMoney(item.amount, item.currency)}
                </Text>
              </View>
            ) : null}

            <View style={styles.mobileMetaRow}>
              <Text style={styles.mobileMetaLabel}>Vade</Text>
              <Text style={[styles.mobileMetaValue, item.isOverdue && styles.overdue]}>
                {lateness(item)}
              </Text>
            </View>

            <Pressable
              onPress={() => onCollect(item)}
              accessibilityRole="button"
              accessibilityLabel={`${nameOf(item)} için ödeme al`}
              style={({ pressed }) => [styles.collectButton, pressed && styles.collectPressed]}
            >
              <Text style={styles.collectLabel}>Ödeme Al</Text>
            </Pressable>
          </Card>
        ))}
      </View>
    );
  }

  return (
    <Card style={styles.card} noPadding>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, columnStyles.member]}>Üye</Text>
        <Text style={[styles.headerLabel, columnStyles.description]}>Ne için</Text>
        <Text style={[styles.headerLabel, columnStyles.amount]}>Kalan</Text>
        <Text style={[styles.headerLabel, columnStyles.due]}>Vade</Text>
        <View style={columnStyles.action} />
      </View>

      {items.map((item, index) => (
        <View
          key={item.installmentId}
          style={[styles.row, index === items.length - 1 && styles.rowLast]}
        >
          <View style={[styles.memberCell, columnStyles.member]}>
            <Avatar initials={initialsOf(nameOf(item))} size={32} />
            <Text style={styles.name} numberOfLines={1}>
              {nameOf(item)}
            </Text>
          </View>

          <View style={columnStyles.description}>
            <Text style={styles.cellText} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={styles.description}>{item.sequence}. taksit</Text>
          </View>

          <View style={columnStyles.amount}>
            <Text style={[styles.cellText, styles.amount]}>
              {formatMoney(item.outstandingAmount, item.currency)}
            </Text>
            {item.outstandingAmount !== item.amount ? (
              <Text style={styles.description}>
                {formatMoney(item.amount, item.currency)} taksitin kalanı
              </Text>
            ) : null}
          </View>

          <View style={columnStyles.due}>
            <Text style={[styles.cellText, item.isOverdue && styles.overdue]}>
              {formatDayLabel(item.dueOn)}
            </Text>
            {item.isOverdue ? (
              <Text style={styles.overdueCaption}>{item.daysOverdue} gün gecikti</Text>
            ) : null}
          </View>

          <View style={columnStyles.action}>
            <Pressable
              onPress={() => onCollect(item)}
              accessibilityRole="button"
              accessibilityLabel={`${nameOf(item)} için ödeme al`}
              style={({ pressed }) => [styles.collectButton, pressed && styles.collectPressed]}
            >
              <Text style={styles.collectLabel}>Ödeme Al</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {/* The studio's own policy, stated by the server rather than assumed here. The panel's
          summary card said "Geciken (7 gün+)" as a literal string beside a number computed some
          other way entirely. */}
      <Text style={styles.footnote}>
        Vadesinden {graceDays} gün sonrası gecikmiş sayılır. Bu süreyi Ayarlar&apos;dan
        değiştirebilirsin.
      </Text>
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  member: { flex: 1.7 },
  description: { flex: 1.8 },
  amount: { flex: 1.2 },
  due: { flex: 1.3 },
  action: { width: 120, alignItems: 'flex-end' },
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
  overdue: {
    color: colors.critical,
  },
  overdueCaption: {
    ...typography.caption,
    color: colors.critical,
  },
  collectButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  collectPressed: {
    backgroundColor: colors.primaryDark,
  },
  collectLabel: {
    ...typography.captionStrong,
    color: colors.white,
  },
  footnote: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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

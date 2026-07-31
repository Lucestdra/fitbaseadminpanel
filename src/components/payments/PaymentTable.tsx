import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PAYMENT_METHOD_LABEL } from '@/types/payments';
import type { Payment, PaymentStatus } from '@/types/payments';

interface PaymentTableProps {
  payments: Payment[];
  onPaymentPress: (payment: Payment) => void;
}

const STATUS_META: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  'tahsil-edildi': { label: 'Tahsil Edildi', tone: 'mint' },
  bekliyor: { label: 'Bekliyor', tone: 'warning' },
  gecikti: { label: 'Gecikti', tone: 'critical' },
};

function formatCurrency(value: number) {
  return `₺${value.toLocaleString('tr-TR')}`;
}

export function PaymentTable({ payments, onPaymentPress }: PaymentTableProps) {
  const { isMobile } = useResponsiveLayout();

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {payments.map((item) => {
          const status = STATUS_META[item.status];
          return (
            <Pressable
              key={item.id}
              onPress={() => onPaymentPress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.memberName} ödeme detayı`}
            >
              <Card style={styles.mobileCard}>
                <View style={styles.mobileHeaderRow}>
                  <Avatar initials={item.avatarInitials} />
                  <View style={styles.mobileNameGroup}>
                    <Text style={styles.name} numberOfLines={1}>{item.memberName}</Text>
                    <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                  </View>
                  <Badge label={status.label} tone={status.tone} />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Tutar</Text>
                  <Text style={styles.mobileMetaValue}>{formatCurrency(item.amount)}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Yöntem</Text>
                  <Text style={styles.mobileMetaValue}>{PAYMENT_METHOD_LABEL[item.method]}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Tarih</Text>
                  <Text style={styles.mobileMetaValue}>{item.date}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
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
        <View style={columnStyles.menu} />
      </View>

      {payments.map((item, index) => {
        const status = STATUS_META[item.status];
        return (
          <Pressable
            key={item.id}
            onPress={() => onPaymentPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.memberName} ödeme detayı`}
            style={({ pressed }) => [styles.row, index === payments.length - 1 && styles.rowLast, pressed && styles.rowPressed]}
          >
            <View style={[styles.memberCell, columnStyles.member]}>
              <Avatar initials={item.avatarInitials} size={32} />
              <Text style={styles.name} numberOfLines={1}>{item.memberName}</Text>
            </View>
            <Text style={[styles.cellText, columnStyles.description]} numberOfLines={1}>{item.description}</Text>
            <Text style={[styles.cellText, styles.amount, columnStyles.amount]}>{formatCurrency(item.amount)}</Text>
            <Text style={[styles.cellText, columnStyles.method]} numberOfLines={1}>{PAYMENT_METHOD_LABEL[item.method]}</Text>
            <Text style={[styles.cellText, columnStyles.date]} numberOfLines={1}>{item.date}</Text>
            <View style={columnStyles.status}>
              <Badge label={status.label} tone={status.tone} />
            </View>
            <View style={[columnStyles.menu, styles.menuButton]}>
              <AppIcon name="ellipsis-vertical" size={16} color={colors.textSecondary} />
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  member: { flex: 1.7 },
  description: { flex: 1.8 },
  amount: { flex: 1 },
  method: { flex: 1.2 },
  date: { flex: 1.3 },
  status: { flex: 1.2 },
  menu: { width: 32, alignItems: 'center' },
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
  menuButton: {
    height: 32,
    borderRadius: radii.sm,
    justifyContent: 'center',
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

import { useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS, formatDateLabel, parseDateLabel } from '@/utils/date';
import { PAYMENT_METHOD_LABEL } from '@/types/payments';
import type { Payment } from '@/types/payments';

interface PaymentReportModalProps {
  visible: boolean;
  payments: Payment[];
  onClose: () => void;
  onExport: () => void;
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

type DatePick = { year: number; month: number; day: number };

function toDate(pick: DatePick): Date {
  return new Date(pick.year, pick.month, pick.day);
}

const STATUS_LABEL: Record<Payment['status'], string> = {
  'tahsil-edildi': 'Tahsil Edildi',
  bekliyor: 'Bekliyor',
  gecikti: 'Gecikti',
};

export function PaymentReportModal({ visible, payments, onClose, onExport }: PaymentReportModalProps) {
  const today = useMemo(() => new Date(), []);
  const [step, setStep] = useState<'range' | 'preview'>('range');
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [start, setStart] = useState<DatePick | null>(null);
  const [end, setEnd] = useState<DatePick | null>(null);

  const cells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const result: ({ day: number } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push(null);
    for (let day = 1; day <= daysInMonth; day++) result.push({ day });
    return result;
  }, [viewYear, viewMonth]);

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const picked = { year: viewYear, month: viewMonth, day };
    if (!start || (start && end)) {
      setStart(picked);
      setEnd(null);
      return;
    }
    const pickedTime = toDate(picked).getTime();
    const startTime = toDate(start).getTime();
    if (pickedTime < startTime) {
      setStart(picked);
      setEnd(null);
    } else {
      setEnd(picked);
    }
  };

  const isInRange = (day: number) => {
    if (!start) return false;
    const time = new Date(viewYear, viewMonth, day).getTime();
    const startTime = toDate(start).getTime();
    if (!end) return time === startTime;
    const endTime = toDate(end).getTime();
    return time >= startTime && time <= endTime;
  };

  const isEdge = (day: number) => {
    const time = new Date(viewYear, viewMonth, day).getTime();
    return (start && time === toDate(start).getTime()) || (end && time === toDate(end).getTime());
  };

  const filteredPayments = useMemo(() => {
    if (!start || !end) return [];
    const startTime = toDate(start).getTime();
    const endTime = toDate(end).getTime() + 24 * 60 * 60 * 1000 - 1;
    return payments.filter((payment) => {
      const paymentDate = parseDateLabel(payment.date);
      if (!paymentDate) return false;
      const time = paymentDate.getTime();
      return time >= startTime && time <= endTime;
    });
  }, [payments, start, end]);

  const totals = useMemo(() => {
    const collected = filteredPayments.filter((p) => p.status === 'tahsil-edildi').reduce((sum, p) => sum + p.amount, 0);
    const pending = filteredPayments.filter((p) => p.status === 'bekliyor').reduce((sum, p) => sum + p.amount, 0);
    const overdue = filteredPayments.filter((p) => p.status === 'gecikti').reduce((sum, p) => sum + p.amount, 0);
    return { collected, pending, overdue };
  }, [filteredPayments]);

  const resetState = () => {
    setStep('range');
    setStart(null);
    setEnd(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleApplyRange = () => {
    if (!start || !end) return;
    setStep('preview');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{step === 'range' ? 'Tarih Aralığı Seç' : 'Ödeme Raporu'}</Text>
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

          {step === 'range' ? (
            <>
              <View style={styles.monthNav}>
                <Pressable
                  onPress={goToPreviousMonth}
                  accessibilityRole="button"
                  accessibilityLabel="Önceki ay"
                  hitSlop={8}
                  style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
                >
                  <AppIcon name="chevron-back" size={16} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.monthLabel}>{TURKISH_MONTHS[viewMonth]} {viewYear}</Text>
                <Pressable
                  onPress={goToNextMonth}
                  accessibilityRole="button"
                  accessibilityLabel="Sonraki ay"
                  hitSlop={8}
                  style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
                >
                  <AppIcon name="chevron-forward" size={16} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.weekdayLabel}>{label}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {cells.map((cell, index) => {
                  if (!cell) return <View key={index} style={styles.dayCell} />;
                  const inRange = isInRange(cell.day);
                  const edge = isEdge(cell.day);
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleDayPress(cell.day)}
                      accessibilityRole="button"
                      accessibilityLabel={`${cell.day} ${TURKISH_MONTHS[viewMonth]} ${viewYear}`}
                      style={styles.dayCell}
                    >
                      <View style={[styles.dayInner, inRange && styles.dayInnerInRange, edge && styles.dayInnerEdge]}>
                        <Text style={[styles.dayText, inRange && styles.dayTextInRange, edge && styles.dayTextEdge]}>
                          {cell.day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.footer}>
                <Text style={styles.rangeSummary}>
                  {start ? formatDateLabel(toDate(start)) : 'Başlangıç'} – {end ? formatDateLabel(toDate(end)) : 'Bitiş'}
                </Text>
                <Pressable
                  onPress={handleApplyRange}
                  disabled={!start || !end}
                  accessibilityRole="button"
                  accessibilityLabel="Devam et"
                  style={({ pressed }) => [
                    styles.applyButton,
                    (!start || !end) && styles.applyButtonDisabled,
                    pressed && start && end && styles.applyButtonPressed,
                  ]}
                >
                  <Text style={styles.applyLabel}>Devam Et</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.rangeSummary}>
                {start ? formatDateLabel(toDate(start)) : ''} – {end ? formatDateLabel(toDate(end)) : ''}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Tahsil Edilen</Text>
                  <Text style={styles.statValue}>₺{totals.collected.toLocaleString('tr-TR')}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Bekleyen</Text>
                  <Text style={styles.statValue}>₺{totals.pending.toLocaleString('tr-TR')}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Geciken</Text>
                  <Text style={[styles.statValue, { color: colors.critical }]}>₺{totals.overdue.toLocaleString('tr-TR')}</Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>{filteredPayments.length} işlem bulundu</Text>

              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {filteredPayments.length === 0 ? (
                  <Text style={styles.emptyText}>Bu tarih aralığında işlem yok.</Text>
                ) : (
                  filteredPayments.map((payment) => (
                    <View key={payment.id} style={styles.paymentRow}>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentName} numberOfLines={1}>{payment.memberName}</Text>
                        <Text style={styles.paymentMeta} numberOfLines={1}>
                          {payment.description} · {PAYMENT_METHOD_LABEL[payment.method]} · {payment.date}
                        </Text>
                      </View>
                      <Text style={styles.paymentAmount}>₺{payment.amount.toLocaleString('tr-TR')}</Text>
                      <Badge
                        label={STATUS_LABEL[payment.status]}
                        tone={payment.status === 'tahsil-edildi' ? 'mint' : payment.status === 'gecikti' ? 'critical' : 'warning'}
                      />
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.previewFooter}>
                <Pressable
                  onPress={() => setStep('range')}
                  accessibilityRole="button"
                  accessibilityLabel="Tarihi değiştir"
                  style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                >
                  <Text style={styles.backLabel}>Tarihi Değiştir</Text>
                </Pressable>
                <Pressable
                  onPress={onExport}
                  accessibilityRole="button"
                  accessibilityLabel="PDF olarak indir"
                  style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
                >
                  <AppIcon name="download-outline" size={16} color={colors.white} />
                  <Text style={styles.applyLabel}>PDF Olarak İndir</Text>
                </Pressable>
              </View>
            </>
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
    width: 420,
    maxWidth: '92%',
    maxHeight: '85%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  monthLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerInRange: {
    backgroundColor: colors.mintLight,
  },
  dayInnerEdge: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  dayTextInRange: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  dayTextEdge: {
    color: colors.white,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rangeSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  applyButtonDisabled: {
    backgroundColor: colors.border,
  },
  applyButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  applyLabel: {
    ...typography.button,
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    gap: 2,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  list: {
    maxHeight: 260,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  paymentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  paymentAmount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  previewFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backButton: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  backLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
});

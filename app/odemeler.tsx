import { useMemo, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PaymentTable } from '@/components/payments/PaymentTable';
import { RecordPaymentModal, type RecordPaymentInput } from '@/components/payments/RecordPaymentModal';
import { PaymentReportModal } from '@/components/payments/PaymentReportModal';
import { PaymentFilterModal } from '@/components/payments/PaymentFilterModal';
import { PaymentDetailModal } from '@/components/payments/PaymentDetailModal';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { spacing } from '@/theme';
import { payments as initialPayments, paymentKpis } from '@/mock/payments';
import { members } from '@/mock/members';
import { packageTemplates } from '@/mock/settings';
import { PAYMENT_METHOD_LABEL } from '@/types/payments';
import type { Payment, PaymentStatus } from '@/types/payments';

export default function PaymentsScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilters, setStatusFilters] = useState<PaymentStatus[]>([]);
  const [detailPaymentId, setDetailPaymentId] = useState<string | null>(null);
  const { message, visible, show } = useToast();

  const detailPayment = payments.find((item) => item.id === detailPaymentId) ?? null;

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    return payments.filter((item) => {
      const matchesQuery =
        !query ||
        item.memberName.toLocaleLowerCase('tr').includes(query) ||
        item.description.toLocaleLowerCase('tr').includes(query) ||
        PAYMENT_METHOD_LABEL[item.method].toLocaleLowerCase('tr').includes(query);
      if (!matchesQuery) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(item.status)) return false;
      return true;
    });
  }, [payments, search, statusFilters]);

  const handleRecordPayment = (input: RecordPaymentInput) => {
    const newPayment: Payment = { id: `pay-${Date.now()}`, ...input };
    setPayments((current) => [newPayment, ...current]);
    show(`${newPayment.memberName} için ödeme kaydedildi.`);
  };

  const handleExportReport = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
    show('Rapor PDF olarak indiriliyor...');
    setReportModalVisible(false);
  };

  const handleSavePayment = (updated: Payment) => {
    setPayments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    show(`${updated.memberName} ödeme kaydı güncellendi.`);
  };

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  return (
    <AppShell activeId="payments">
      <ListPageHeader
        title="Ödemeler"
        subtitle="Tahsilatları takip et, gecikmeleri yönet ve ödeme geçmişini gör."
        searchPlaceholder="Ara (isim, açıklama, yöntem...)"
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={() => setFilterModalVisible(true)}
        filterCount={statusFilters.length}
        secondaryActionLabel="Rapor İndir"
        secondaryActionIcon="download-outline"
        onSecondaryAction={() => setReportModalVisible(true)}
        primaryActionLabel="Ödeme Kaydet"
        primaryActionIcon="add"
        onPrimaryAction={() => setRecordModalVisible(true)}
      />

      <View style={styles.kpiGrid}>
        {paymentKpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      <PaymentTable payments={filteredPayments} onPaymentPress={(payment) => setDetailPaymentId(payment.id)} />

      <RecordPaymentModal
        visible={recordModalVisible}
        onClose={() => setRecordModalVisible(false)}
        onCreate={handleRecordPayment}
        members={members}
        packages={packageTemplates}
      />

      <PaymentReportModal
        visible={reportModalVisible}
        payments={payments}
        onClose={() => setReportModalVisible(false)}
        onExport={handleExportReport}
      />

      <PaymentFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        statuses={statusFilters}
        onChange={setStatusFilters}
      />

      <PaymentDetailModal
        key={detailPaymentId ?? 'none'}
        visible={detailPaymentId !== null}
        payment={detailPayment}
        onClose={() => setDetailPaymentId(null)}
        onSave={handleSavePayment}
      />

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  kpiItem: {
    flexGrow: 1,
    minWidth: 150,
  },
});

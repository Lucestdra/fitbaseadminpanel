import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { ListPageHeader } from '@/components/shared/ListPageHeader';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PaymentTable } from '@/components/payments/PaymentTable';
import { ReceivablesTable } from '@/components/payments/ReceivablesTable';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { CreateChargeModal } from '@/components/payments/CreateChargeModal';
import { PaymentReportModal } from '@/components/payments/PaymentReportModal';
import {
  PaymentFilterModal,
  EMPTY_PAYMENT_FILTERS,
  countPaymentFilters,
  type PaymentFilters,
} from '@/components/payments/PaymentFilterModal';
import { PaymentDetailModal } from '@/components/payments/PaymentDetailModal';
import { useToast } from '@/context/ToastContext';
import { useExport } from '@/hooks/useExport';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { usePayments, useReceivables } from '@/hooks/usePayments';
import { useAuth } from '@/context/AuthContext';
import { formatMoney } from '@/utils/money';
import { colors, spacing, typography, radii } from '@/theme';
import type { PaymentListItem } from '@/api/finance';
import type { KpiItem } from '@/types/dashboard';

type Tab = 'payments' | 'receivables';

const tabOptions: SegmentOption<Tab>[] = [
  { value: 'payments', label: 'Tahsilatlar' },
  { value: 'receivables', label: 'Alacaklar' },
];

/**
 * The money, on real data.
 *
 * <b>Two tabs, because there are two questions.</b> The panel had one list holding both — money
 * that arrived and money that had not — with `gecikti` as a payment status. That is what made its
 * "Bekleyen Ödemeler: ₺67.850" a hardcoded constant: a payment that has not happened is not the
 * same thing as money owed, and there was nothing in its model to sum for the second question.
 *
 * <b>Nothing on this screen decides what is late.</b> Overdue is computed server-side against the
 * studio's own today and its own grace period (ADR-0033), and the receivables response says which
 * grace period it used. Five of the panel's KPI tiles were literals; these four come back with the
 * page from the same predicate as the rows.
 */
export default function PaymentsScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { timeZoneId, permissions } = useAuth();
  const { show } = useToast();
  const { exporting, download } = useExport(show);

  const [tab, setTab] = useState<Tab>('payments');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>(EMPTY_PAYMENT_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [recordVisible, setRecordVisible] = useState(false);
  const [chargeVisible, setChargeVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [detail, setDetail] = useState<PaymentListItem | null>(null);
  const [prefill, setPrefill] = useState<{ id: string; name: string } | null>(null);

  const canManage = permissions['finance.payments.manage'] !== undefined;
  const canRefund = permissions['finance.payments.refund'] !== undefined;

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      method: filters.methods.length > 0 ? filters.methods : undefined,
      status: filters.statuses.length > 0 ? filters.statuses : undefined,
      limit: 25,
    }),
    [search, filters],
  );

  const payments = usePayments(query);
  const receivables = useReceivables({ limit: 50 });

  // From the response, not from the rows on screen. Summing the page would report what the first
  // twenty-five payments came to and label it "this month".
  const kpis: KpiItem[] = [
    {
      id: 'collected',
      title: 'Tahsil Edilen',
      value: formatMoney(payments.counters.collected, 'TRY') ?? '—',
      icon: 'wallet-outline',
    },
    {
      id: 'outstanding',
      title: 'Bekleyen Alacak',
      value: formatMoney(payments.counters.outstanding, 'TRY') ?? '—',
      icon: 'time-outline',
    },
    {
      id: 'overdue',
      title: 'Gecikmiş',
      value: formatMoney(payments.counters.overdue, 'TRY') ?? '—',
      icon: 'alert-circle-outline',
    },
    {
      // Reported beside the collections rather than folded into them. A month that took ₺300.000
      // and gave ₺40.000 back is a different month, and the panel could not show the second number
      // at all — it had no concept of a refund.
      id: 'refunded',
      title: 'İade Edilen',
      value: formatMoney(payments.counters.refunded, 'TRY') ?? '—',
      icon: 'return-down-back-outline',
    },
  ];

  const kpiBasis = isMobile ? '47%' : isTablet ? '48%' : '24%';

  const reload = () => {
    payments.reload();
    receivables.reload();
  };

  const active = tab === 'payments' ? payments.status : receivables.status;

  return (
    <AppShell activeId="payments">
      <ListPageHeader
        title="Ödemeler"
        subtitle="Tahsilatları takip et, alacakları gör ve gecikmeleri yönet."
        searchPlaceholder="Referansa göre ara..."
        searchValue={search}
        onSearchChange={setSearch}
        onFilterPress={tab === 'payments' ? () => setFilterVisible(true) : undefined}
        filterCount={countPaymentFilters(filters)}
        secondaryActionLabel="Rapor"
        secondaryActionIcon="download-outline"
        onSecondaryAction={() => setReportVisible(true)}
        primaryActionLabel={canManage ? 'Ödeme Kaydet' : undefined}
        primaryActionIcon="add"
        onPrimaryAction={
          canManage
            ? () => {
                setPrefill(null);
                setRecordVisible(true);
              }
            : undefined
        }
      />

      <View style={styles.kpiGrid}>
        {kpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      <View style={styles.tabRow}>
        <SegmentedControl options={tabOptions} value={tab} onChange={setTab} />

        {/* Receivables have their own CSV, and it is a different question from the payment report:
            what is owed, by whom, as of today — not what moved over a range. `Receivables` has been
            a registered export kind with no way to ask for it, which is a feature that exists only
            in the contract. No date range, because the list has none: an instalment is outstanding
            now or it is not (ADR-0033). */}
        {tab === 'receivables' ? (
          <Pressable
            onPress={() => void download('Receivables', null, null)}
            disabled={exporting || receivables.items.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Alacakları indir"
            accessibilityState={{ disabled: exporting || receivables.items.length === 0 }}
            style={({ pressed }) => [
              styles.chargeButton,
              pressed && styles.chargePressed,
              (exporting || receivables.items.length === 0) && styles.disabledButton,
            ]}
          >
            <Text style={styles.chargeLabel}>{exporting ? 'Hazırlanıyor...' : 'CSV İndir'}</Text>
          </Pressable>
        ) : null}

        {/* The action the panel has no equivalent of. Without a way to raise a charge, a
            receivables list is permanently empty and the whole model is unreachable from the UI. */}
        {canManage ? (
          <Pressable
            onPress={() => setChargeVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Borç oluştur"
            style={({ pressed }) => [styles.chargeButton, pressed && styles.chargePressed]}
          >
            <Text style={styles.chargeLabel}>Borç Oluştur</Text>
          </Pressable>
        ) : null}
      </View>

      {active === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : active === 'error' ? (
        <Text style={styles.stateText}>Bilgiler alınamadı. Sayfayı yenile.</Text>
      ) : tab === 'payments' ? (
        payments.items.length === 0 ? (
          <Text style={styles.stateText}>Bu filtreyle eşleşen tahsilat yok.</Text>
        ) : (
          <>
            <PaymentTable
              payments={payments.items}
              timeZoneId={timeZoneId}
              onPaymentPress={setDetail}
            />

            {payments.hasMore ? (
              <Pressable
                onPress={payments.loadMore}
                accessibilityRole="button"
                accessibilityLabel="Daha fazla göster"
                style={({ pressed }) => [styles.moreButton, pressed && styles.morePressed]}
              >
                <Text style={styles.moreLabel}>
                  {payments.loadingMore ? 'Yükleniyor...' : 'Daha Fazla'}
                </Text>
              </Pressable>
            ) : null}
          </>
        )
      ) : receivables.items.length === 0 ? (
        <Text style={styles.stateText}>Bekleyen alacak yok.</Text>
      ) : (
        <ReceivablesTable
          items={receivables.items}
          graceDays={receivables.graceDays}
          onCollect={(item) => {
            setPrefill({ id: item.memberId, name: item.memberName ?? 'Üye' });
            setRecordVisible(true);
          }}
        />
      )}

      <RecordPaymentModal
        visible={recordVisible}
        initialMemberId={prefill?.id ?? null}
        initialMemberName={prefill?.name ?? null}
        onClose={() => setRecordVisible(false)}
        onRecorded={(text) => {
          show(text);
          reload();
        }}
        onError={show}
      />

      <CreateChargeModal
        visible={chargeVisible}
        onClose={() => setChargeVisible(false)}
        onCreated={(text) => {
          show(text);
          reload();
        }}
        onError={show}
      />

      <PaymentReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onNotify={show}
      />

      <PaymentFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onChange={setFilters}
      />

      <PaymentDetailModal
        key={detail?.id ?? 'none'}
        visible={detail !== null}
        payment={detail}
        timeZoneId={timeZoneId}
        canRefund={canRefund}
        canManage={canManage}
        onClose={() => setDetail(null)}
        onChanged={(text) => {
          show(text);
          reload();
        }}
        onError={show}
      />

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
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  chargeButton: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargePressed: {
    backgroundColor: colors.mintLight,
  },
  disabledButton: {
    opacity: 0.5,
  },
  chargeLabel: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  loading: {
    paddingVertical: spacing.xxl,
  },
  stateText: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.xxl,
    textAlign: 'center',
  },
  moreButton: {
    alignSelf: 'center',
    height: 40,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePressed: {
    backgroundColor: colors.pageBackground,
  },
  moreLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
});

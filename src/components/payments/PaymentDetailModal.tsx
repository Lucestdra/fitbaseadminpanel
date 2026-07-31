import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { colors, spacing, typography, radii } from '@/theme';
import { formatDateLabel, parseDateLabel } from '@/utils/date';
import { PAYMENT_METHOD_LABEL } from '@/types/payments';
import type { Payment, PaymentMethod, PaymentStatus } from '@/types/payments';

interface PaymentDetailModalProps {
  visible: boolean;
  payment: Payment | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

const STATUS_META: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  'tahsil-edildi': { label: 'Tahsil Edildi', tone: 'mint' },
  bekliyor: { label: 'Bekliyor', tone: 'warning' },
  gecikti: { label: 'Gecikti', tone: 'critical' },
};

const STATUS_OPTIONS: PaymentStatus[] = ['tahsil-edildi', 'bekliyor', 'gecikti'];
const METHOD_OPTIONS: PaymentMethod[] = ['kredi-karti', 'nakit', 'havale', 'diger'];

function formatCurrency(value: number) {
  return `₺${value.toLocaleString('tr-TR')}`;
}

type DropdownField = 'status' | 'method' | null;

export function PaymentDetailModal({ visible, payment, onClose, onSave }: PaymentDetailModalProps) {
  const [draft, setDraft] = useState<Payment | null>(payment);
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  if (!draft) return null;

  const status = STATUS_META[draft.status];

  const handleClose = () => {
    setOpenDropdown(null);
    setDatePickerVisible(false);
    onClose();
  };

  const handleSave = () => {
    onSave(draft);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Avatar initials={draft.avatarInitials} size={40} />
              <View style={styles.headerTextGroup}>
                <Text style={styles.name} numberOfLines={1}>{draft.memberName}</Text>
                <Text style={styles.description} numberOfLines={1}>{draft.description}</Text>
              </View>
              <Badge label={status.label} tone={status.tone} />
            </View>
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

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Tutar</Text>
            <Text style={styles.amountValue}>{formatCurrency(draft.amount)}</Text>
          </View>

          <Text style={styles.fieldLabel}>Ödeme Yöntemi</Text>
          <DropdownSelect
            placeholder="Yöntem seç"
            options={METHOD_OPTIONS.map((option) => ({ id: option, label: PAYMENT_METHOD_LABEL[option] }))}
            selectedId={draft.method}
            onSelect={(id) => {
              setDraft({ ...draft, method: (id as PaymentMethod) ?? draft.method });
              setOpenDropdown(null);
            }}
            open={openDropdown === 'method'}
            onToggle={() => setOpenDropdown((current) => (current === 'method' ? null : 'method'))}
          />

          <Text style={styles.fieldLabel}>Tarih</Text>
          <Pressable
            onPress={() => setDatePickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Ödeme tarihi seç"
            style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
          >
            <Text style={styles.dateFieldText}>{draft.date}</Text>
            <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.fieldLabel}>Durum</Text>
          <DropdownSelect
            placeholder="Durum seç"
            options={STATUS_OPTIONS.map((option) => ({ id: option, label: STATUS_META[option].label }))}
            selectedId={draft.status}
            onSelect={(id) => {
              setDraft({ ...draft, status: (id as PaymentStatus) ?? draft.status });
              setOpenDropdown(null);
            }}
            open={openDropdown === 'status'}
            onToggle={() => setOpenDropdown((current) => (current === 'status' ? null : 'status'))}
          />

          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Değişiklikleri kaydet"
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          >
            <Text style={styles.submitLabel}>Kaydet</Text>
          </Pressable>
        </View>
      </View>

      <SingleDatePickerModal
        visible={datePickerVisible}
        title="Ödeme Tarihi Seç"
        initialDate={parseDateLabel(draft.date) ?? new Date()}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(picked) => {
          setDraft({ ...draft, date: formatDateLabel(picked) });
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
    width: 400,
    maxWidth: '90%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  amountLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  amountValue: {
    ...typography.pageTitle,
    fontSize: 20,
    color: colors.textPrimary,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
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
    marginTop: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});

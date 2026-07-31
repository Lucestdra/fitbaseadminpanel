import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { colors, spacing, typography, radii } from '@/theme';
import { formatDateLabel } from '@/utils/date';
import { PAYMENT_METHOD_LABEL } from '@/types/payments';
import type { Payment, PaymentMethod } from '@/types/payments';
import type { Member } from '@/types/members';
import type { PackageTemplate } from '@/types/settings';

export interface RecordPaymentInput {
  memberName: string;
  avatarInitials: string;
  description: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: Payment['status'];
}

interface RecordPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: RecordPaymentInput) => void;
  members: Member[];
  packages: PackageTemplate[];
}

const METHOD_OPTIONS: PaymentMethod[] = ['kredi-karti', 'nakit', 'havale', 'diger'];
type DropdownField = 'member' | 'package' | 'method' | null;

export function RecordPaymentModal({ visible, onClose, onCreate, members, packages }: RecordPaymentModalProps) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('kredi-karti');
  const [date, setDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);

  const selectedMember = members.find((member) => member.id === memberId) ?? null;
  const canSubmit = !!selectedMember && description.trim().length > 0 && Number(amount) > 0;

  const resetState = () => {
    setMemberId(null);
    setDescription('');
    setAmount('');
    setMethod('kredi-karti');
    setDate(new Date());
    setOpenDropdown(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedMember) return;
    onCreate({
      memberName: selectedMember.name,
      avatarInitials: selectedMember.avatarInitials,
      description: description.trim(),
      amount: Number(amount),
      method,
      date: formatDateLabel(date),
      status: 'tahsil-edildi',
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Ödeme Kaydet</Text>
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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Üye</Text>
            <DropdownSelect
              placeholder="Üye seç"
              options={members.map((member) => ({ id: member.id, label: member.name, meta: member.packageName }))}
              selectedId={memberId}
              onSelect={(id) => {
                setMemberId(id);
                setOpenDropdown(null);
              }}
              open={openDropdown === 'member'}
              onToggle={() => setOpenDropdown((current) => (current === 'member' ? null : 'member'))}
            />

            <Text style={styles.fieldLabel}>Paket / Açıklama</Text>
            <DropdownSelect
              placeholder="Paket seç"
              options={packages.map((pkg) => ({ id: pkg.name, label: pkg.name, meta: pkg.price }))}
              selectedId={description || null}
              onSelect={(id) => {
                const selectedPackage = packages.find((pkg) => pkg.name === id);
                setDescription(id ?? '');
                if (selectedPackage) {
                  setAmount(selectedPackage.price.replace(/[^0-9]/g, ''));
                }
                setOpenDropdown(null);
              }}
              open={openDropdown === 'package'}
              onToggle={() => setOpenDropdown((current) => (current === 'package' ? null : 'package'))}
            />

            <Text style={styles.fieldLabel}>Tutar (₺)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel="Tutar"
            />

            <Text style={styles.fieldLabel}>Ödeme Yöntemi</Text>
            <DropdownSelect
              placeholder="Yöntem seç"
              options={METHOD_OPTIONS.map((option) => ({ id: option, label: PAYMENT_METHOD_LABEL[option] }))}
              selectedId={method}
              onSelect={(id) => {
                setMethod((id as PaymentMethod) ?? 'kredi-karti');
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
              <Text style={styles.dateFieldText}>{formatDateLabel(date)}</Text>
              <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Ödemeyi kaydet"
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>Kaydet</Text>
          </Pressable>
        </View>
      </View>

      <SingleDatePickerModal
        visible={datePickerVisible}
        title="Ödeme Tarihi Seç"
        initialDate={date}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(picked) => {
          setDate(picked);
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

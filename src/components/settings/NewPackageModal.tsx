import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import type { PackageStatus } from '@/types/settings';

export interface NewPackageInput {
  name: string;
  price: string;
  sessionCount: number | null;
  durationDays: number;
  status: PackageStatus;
}

interface NewPackageModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: NewPackageInput) => void;
}

const STATUS_OPTIONS: { id: PackageStatus; label: string }[] = [
  { id: 'aktif', label: 'Aktif' },
  { id: 'pasif', label: 'Pasif' },
];

export function NewPackageModal({ visible, onClose, onCreate }: NewPackageModalProps) {
  const [name, setName] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [sessionCount, setSessionCount] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [status, setStatus] = useState<PackageStatus>('aktif');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const canSubmit = name.trim().length > 0 && priceAmount.trim().length > 0 && durationDays.trim().length > 0;

  const resetState = () => {
    setName('');
    setPriceAmount('');
    setSessionCount('');
    setDurationDays('30');
    setStatus('aktif');
    setStatusDropdownOpen(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const amount = parseInt(priceAmount, 10);
    const sessions = parseInt(sessionCount, 10);
    const duration = parseInt(durationDays, 10);
    onCreate({
      name: name.trim(),
      price: `₺${(Number.isNaN(amount) ? 0 : amount).toLocaleString('tr-TR')}`,
      sessionCount: Number.isNaN(sessions) ? null : sessions,
      durationDays: Number.isNaN(duration) ? 30 : duration,
      status,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Paket</Text>
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

          <Text style={styles.fieldLabel}>Paket Adı</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ör. Gold Paket"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Paket Adı"
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Fiyat (₺)</Text>
              <TextInput
                value={priceAmount}
                onChangeText={setPriceAmount}
                placeholder="2400"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={styles.input}
                accessibilityLabel="Fiyat"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Seans Sayısı</Text>
              <TextInput
                value={sessionCount}
                onChangeText={setSessionCount}
                placeholder="Sınırsız"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={styles.input}
                accessibilityLabel="Seans Sayısı"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Geçerlilik (Gün)</Text>
              <TextInput
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="number-pad"
                style={styles.input}
                accessibilityLabel="Geçerlilik gün sayısı"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Durum</Text>
              <DropdownSelect
                placeholder="Durum seç"
                options={STATUS_OPTIONS}
                selectedId={status}
                onSelect={(id) => {
                  setStatus((id as PackageStatus) ?? 'aktif');
                  setStatusDropdownOpen(false);
                }}
                open={statusDropdownOpen}
                onToggle={() => setStatusDropdownOpen((current) => !current)}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Paketi kaydet"
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  submitButton: {
    height: 44,
    marginTop: spacing.lg,
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

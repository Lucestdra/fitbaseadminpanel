import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { formatDateLabel, addMonths, addDays } from '@/utils/date';
import type { PackageTemplate, GiftTemplate } from '@/types/settings';

export interface NewMemberInput {
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  packageName?: string;
  sessionsTotal: number | null;
  membershipStartDate: string;
  membershipEndDate: string;
  giftLabel?: string;
}

interface NewMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: NewMemberInput) => void;
  packages: PackageTemplate[];
  gifts: GiftTemplate[];
}

type DurationMode = 'paket' | 'ay' | 'seans';
type DateField = 'birth' | 'start' | 'end' | null;
type DropdownField = 'package' | 'gift' | null;

const DURATION_OPTIONS: SegmentOption<DurationMode>[] = [
  { value: 'paket', label: 'Paketten Otomatik' },
  { value: 'ay', label: 'Ay' },
  { value: 'seans', label: 'Seans' },
];

export function NewMemberModal({ visible, onClose, onCreate, packages, gifts }: NewMemberModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [durationMode, setDurationMode] = useState<DurationMode>('paket');
  const [months, setMonths] = useState('1');
  const [sessions, setSessions] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);
  const [activeDateField, setActiveDateField] = useState<DateField>(null);

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? null;
  const selectedGift = gifts.find((gift) => gift.id === selectedGiftId) ?? null;
  const canSubmit = name.trim().length > 0;

  const resetState = () => {
    setName('');
    setPhone('');
    setEmail('');
    setBirthDate(null);
    setSelectedPackageId(null);
    setDurationMode('paket');
    setMonths('1');
    setSessions('');
    setStartDate(new Date());
    setEndDate(null);
    setGiftEnabled(false);
    setSelectedGiftId(null);
    setOpenDropdown(null);
    setActiveDateField(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSelectPackage = (packageId: string | null) => {
    setSelectedPackageId(packageId);
    setOpenDropdown(null);
    const pkg = packages.find((item) => item.id === packageId) ?? null;
    if (pkg && durationMode === 'paket') {
      setEndDate(addDays(startDate, pkg.durationDays));
      setSessions(pkg.sessionCount !== null ? String(pkg.sessionCount) : '');
    } else if (!pkg) {
      setSessions('');
    }
  };

  const handleSelectGift = (giftId: string | null) => {
    setSelectedGiftId(giftId);
    setOpenDropdown(null);
  };

  const handleChangeDurationMode = (mode: DurationMode) => {
    setDurationMode(mode);
    if (mode === 'paket' && selectedPackage) {
      setEndDate(addDays(startDate, selectedPackage.durationDays));
      setSessions(selectedPackage.sessionCount !== null ? String(selectedPackage.sessionCount) : '');
    } else if (mode === 'ay') {
      const n = parseInt(months, 10);
      if (!Number.isNaN(n)) setEndDate(addMonths(startDate, n));
    }
  };

  const handleChangeMonths = (value: string) => {
    setMonths(value);
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) setEndDate(addMonths(startDate, n));
  };

  const handlePickDate = (date: Date) => {
    if (activeDateField === 'birth') {
      setBirthDate(date);
    } else if (activeDateField === 'start') {
      setStartDate(date);
      if (durationMode === 'paket' && selectedPackage) {
        setEndDate(addDays(date, selectedPackage.durationDays));
      } else if (durationMode === 'ay') {
        const n = parseInt(months, 10);
        if (!Number.isNaN(n)) setEndDate(addMonths(date, n));
      }
    } else if (activeDateField === 'end') {
      setEndDate(date);
    }
    setActiveDateField(null);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const sessionsValue = sessions.trim() ? parseInt(sessions.trim(), 10) : null;
    onCreate({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      birthDate: birthDate ? formatDateLabel(birthDate) : undefined,
      packageName: selectedPackage?.name,
      sessionsTotal: Number.isNaN(sessionsValue as number) ? null : sessionsValue,
      membershipStartDate: formatDateLabel(startDate),
      membershipEndDate: formatDateLabel(endDate ?? startDate),
      giftLabel: giftEnabled ? selectedGift?.name : undefined,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Üye</Text>
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
            <Text style={styles.fieldLabel}>Ad Soyad</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ör. Zeynep Aydın"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Ad Soyad"
            />

            <Text style={styles.fieldLabel}>Cep Telefonu (opsiyonel)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+90 5xx xxx xx xx"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              style={styles.input}
              accessibilityLabel="Cep Telefonu"
            />

            <Text style={styles.fieldLabel}>E-posta (opsiyonel)</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@eposta.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="E-posta"
            />

            <Text style={styles.fieldLabel}>Doğum Tarihi (opsiyonel)</Text>
            <Pressable
              onPress={() => setActiveDateField('birth')}
              accessibilityRole="button"
              accessibilityLabel="Doğum tarihi seç"
              style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
            >
              <Text style={styles.dateFieldText}>{birthDate ? formatDateLabel(birthDate) : 'Tarih seç'}</Text>
              <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
            </Pressable>

            <Text style={styles.fieldLabel}>Paket</Text>
            <DropdownSelect
              placeholder="Paket seç"
              options={packages.map((pkg) => ({ id: pkg.id, label: pkg.name, meta: pkg.price }))}
              selectedId={selectedPackageId}
              onSelect={handleSelectPackage}
              open={openDropdown === 'package'}
              onToggle={() => setOpenDropdown((current) => (current === 'package' ? null : 'package'))}
              clearLabel="Paket Seçilmedi"
            />

            <Text style={styles.fieldLabel}>Süre Türü</Text>
            <SegmentedControl options={DURATION_OPTIONS} value={durationMode} onChange={handleChangeDurationMode} />

            {durationMode === 'ay' ? (
              <>
                <Text style={styles.fieldLabel}>Kaç Ay</Text>
                <TextInput
                  value={months}
                  onChangeText={handleChangeMonths}
                  keyboardType="number-pad"
                  style={styles.input}
                  accessibilityLabel="Kaç ay"
                />
              </>
            ) : null}

            <Text style={styles.fieldLabel}>Seans Sayısı (opsiyonel)</Text>
            <TextInput
              value={sessions}
              onChangeText={setSessions}
              placeholder="Sınırsız"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel="Seans sayısı"
            />

            <View style={styles.dateRow}>
              <View style={styles.dateRowItem}>
                <Text style={styles.fieldLabel}>Üyelik Başlangıç</Text>
                <Pressable
                  onPress={() => setActiveDateField('start')}
                  accessibilityRole="button"
                  accessibilityLabel="Üyelik başlangıç tarihi seç"
                  style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
                >
                  <Text style={styles.dateFieldText}>{formatDateLabel(startDate)}</Text>
                  <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.dateRowItem}>
                <Text style={styles.fieldLabel}>Üyelik Bitiş</Text>
                <Pressable
                  onPress={() => setActiveDateField('end')}
                  accessibilityRole="button"
                  accessibilityLabel="Üyelik bitiş tarihi seç"
                  style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
                >
                  <Text style={styles.dateFieldText}>{endDate ? formatDateLabel(endDate) : 'Tarih seç'}</Text>
                  <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setGiftEnabled((current) => !current);
                setOpenDropdown(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Hediye ekle"
              style={({ pressed }) => [styles.giftToggle, pressed && styles.giftTogglePressed]}
            >
              <View style={[styles.checkbox, giftEnabled && styles.checkboxActive]}>
                {giftEnabled ? <AppIcon name="checkmark" size={13} color={colors.white} /> : null}
              </View>
              <AppIcon name="gift-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.giftToggleLabel}>Hediye Ekle</Text>
            </Pressable>

            {giftEnabled ? (
              <DropdownSelect
                placeholder="Hediye seç"
                options={gifts.map((gift) => ({ id: gift.id, label: gift.name, meta: gift.description }))}
                selectedId={selectedGiftId}
                onSelect={handleSelectGift}
                open={openDropdown === 'gift'}
                onToggle={() => setOpenDropdown((current) => (current === 'gift' ? null : 'gift'))}
              />
            ) : null}
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Üyeyi kaydet"
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
        visible={activeDateField !== null}
        title={
          activeDateField === 'birth' ? 'Doğum Tarihi Seç' : activeDateField === 'start' ? 'Başlangıç Tarihi Seç' : 'Bitiş Tarihi Seç'
        }
        initialDate={
          (activeDateField === 'birth' ? birthDate : activeDateField === 'start' ? startDate : endDate) ?? new Date()
        }
        onClose={() => setActiveDateField(null)}
        onSelect={handlePickDate}
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
    width: 440,
    maxWidth: '90%',
    maxHeight: '88%',
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
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateRowItem: {
    flex: 1,
  },
  giftToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  giftTogglePressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  giftToggleLabel: {
    ...typography.button,
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

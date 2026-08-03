import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { responsibleOptions } from '@/mock/settings';
import { WEEKDAYS, generateTimeOptions } from '@/utils/date';
import type { CalendarSessionType } from '@/types/calendar';

export interface NewAppointmentInput {
  title: string;
  trainer: string;
  day: string;
  time: string;
  capacity: number;
  type: CalendarSessionType;
}

interface NewAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: NewAppointmentInput) => void;
}

const TYPE_OPTIONS: { id: CalendarSessionType; label: string }[] = [
  { id: 'randevu', label: 'Randevu' },
  { id: 'ders', label: 'Ders' },
  { id: 'deneme', label: 'Deneme Dersi' },
];

const TIME_OPTIONS = generateTimeOptions();

type DropdownField = 'trainer' | 'time' | 'type' | null;

export function NewAppointmentModal({ visible, onClose, onCreate }: NewAppointmentModalProps) {
  const responsibles = responsibleOptions;
  const [title, setTitle] = useState('');
  const [trainer, setTrainer] = useState(responsibles[0] ?? '');
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState('09:00');
  const [capacity, setCapacity] = useState('1');
  const [type, setType] = useState<CalendarSessionType>('randevu');
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);

  const canSubmit = title.trim().length > 0 && !!day;

  const resetState = () => {
    setTitle('');
    setTrainer(responsibles[0] ?? '');
    setDay(null);
    setTime('09:00');
    setCapacity('1');
    setType('randevu');
    setOpenDropdown(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit || !day) return;
    const capacityValue = parseInt(capacity, 10);
    onCreate({
      title: title.trim(),
      trainer,
      day,
      time,
      capacity: Number.isNaN(capacityValue) ? 1 : capacityValue,
      type,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Randevu</Text>
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

          <Text style={styles.fieldLabel}>Başlık</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ör. 1-on-1 PT Randevusu"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Başlık"
          />

          <Text style={styles.fieldLabel}>Tür</Text>
          <DropdownSelect
            placeholder="Tür seç"
            options={TYPE_OPTIONS}
            selectedId={type}
            onSelect={(id) => {
              setType((id as CalendarSessionType) ?? 'randevu');
              setOpenDropdown(null);
            }}
            open={openDropdown === 'type'}
            onToggle={() => setOpenDropdown((current) => (current === 'type' ? null : 'type'))}
          />

          <Text style={styles.fieldLabel}>Eğitmen</Text>
          <DropdownSelect
            placeholder="Eğitmen seç"
            options={responsibles.map((option) => ({ id: option, label: option }))}
            selectedId={trainer || null}
            onSelect={(id) => {
              setTrainer(id ?? '');
              setOpenDropdown(null);
            }}
            open={openDropdown === 'trainer'}
            onToggle={() => setOpenDropdown((current) => (current === 'trainer' ? null : 'trainer'))}
          />

          <Text style={styles.fieldLabel}>Gün</Text>
          <View style={styles.dayRow}>
            {WEEKDAYS.map((weekday) => (
              <Pressable
                key={weekday.id}
                onPress={() => setDay(weekday.id)}
                accessibilityRole="button"
                accessibilityLabel={weekday.label}
                style={({ pressed }) => [styles.dayChip, day === weekday.id && styles.dayChipActive, pressed && styles.dayChipPressed]}
              >
                <Text style={[styles.dayChipLabel, day === weekday.id && styles.dayChipLabelActive]}>{weekday.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Saat</Text>
              <DropdownSelect
                placeholder="Saat seç"
                options={TIME_OPTIONS.map((option) => ({ id: option, label: option }))}
                selectedId={time}
                onSelect={(id) => {
                  setTime(id ?? time);
                  setOpenDropdown(null);
                }}
                open={openDropdown === 'time'}
                onToggle={() => setOpenDropdown((current) => (current === 'time' ? null : 'time'))}
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Kapasite</Text>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="number-pad"
                style={styles.input}
                accessibilityLabel="Kapasite"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Randevuyu kaydet"
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
    width: 420,
    maxWidth: '90%',
    maxHeight: '88%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.sm,
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
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayChip: {
    width: 46,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  dayChipPressed: {
    backgroundColor: colors.pageBackground,
  },
  dayChipActive: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  dayChipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dayChipLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
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

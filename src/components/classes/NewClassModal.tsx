import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { useCatalogs } from '@/context/CatalogsContext';
import { WEEKDAYS, generateTimeOptions } from '@/utils/date';
import type { ClassDefinition, ClassScheduleSlot } from '@/types/classes';

export interface NewClassInput {
  name: string;
  category: string;
  trainer: string;
  schedule: string;
  scheduleSlots: ClassScheduleSlot[];
  capacity: number;
}

interface NewClassModalProps {
  visible: boolean;
  editingClass?: ClassDefinition | null;
  onClose: () => void;
  onSubmit: (input: NewClassInput) => void;
}

type DropdownField = 'category' | 'trainer' | 'startTime' | 'endTime' | null;

const TIME_OPTIONS = generateTimeOptions();

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function buildScheduleLabel(days: string[], startTime: string, endTime: string): string {
  const dayLabels = WEEKDAYS.filter((weekday) => days.includes(weekday.id)).map((weekday) => weekday.label);
  const timeLabel = endTime && endTime !== startTime ? `${startTime}-${endTime}` : startTime;
  return `${dayLabels.join(', ')} ${timeLabel}`;
}

function addOneHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const nextHours = Math.min(hours + 1, 22);
  return `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function deriveScheduleState(editingClass: ClassDefinition | null | undefined): {
  days: string[];
  startTime: string;
  endTime: string;
} {
  if (editingClass?.scheduleSlots && editingClass.scheduleSlots.length > 0) {
    return {
      days: editingClass.scheduleSlots.map((slot) => slot.day),
      startTime: editingClass.scheduleSlots[0].startTime,
      endTime: editingClass.scheduleSlots[0].endTime,
    };
  }
  if (editingClass) {
    const timeMatch = editingClass.schedule.match(/(\d{2}:\d{2})(?:-(\d{2}:\d{2}))?/);
    const days = WEEKDAYS.filter((weekday) => editingClass.schedule.includes(weekday.label)).map((weekday) => weekday.id);
    const startTime = timeMatch?.[1] ?? '08:00';
    return {
      days,
      startTime,
      endTime: timeMatch?.[2] ?? addOneHour(startTime),
    };
  }
  return { days: [], startTime: '08:00', endTime: '09:00' };
}

export function NewClassModal({ visible, editingClass = null, onClose, onSubmit }: NewClassModalProps) {
  const { classCategories, responsibles } = useCatalogs();
  const initialSchedule = deriveScheduleState(editingClass);
  const [name, setName] = useState(editingClass?.name ?? '');
  const [category, setCategory] = useState(editingClass?.category ?? classCategories[0] ?? '');
  const [trainer, setTrainer] = useState(editingClass?.trainer ?? responsibles[0] ?? '');
  const [selectedDays, setSelectedDays] = useState<string[]>(initialSchedule.days);
  const [startTime, setStartTime] = useState(initialSchedule.startTime);
  const [endTime, setEndTime] = useState(initialSchedule.endTime);
  const [capacity, setCapacity] = useState(editingClass ? String(editingClass.capacity) : '10');
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);

  const canSubmit = name.trim().length > 0 && selectedDays.length > 0 && startTime < endTime;

  const resetState = () => {
    const reset = deriveScheduleState(editingClass);
    setName(editingClass?.name ?? '');
    setCategory(editingClass?.category ?? classCategories[0] ?? '');
    setTrainer(editingClass?.trainer ?? responsibles[0] ?? '');
    setSelectedDays(reset.days);
    setStartTime(reset.startTime);
    setEndTime(reset.endTime);
    setCapacity(editingClass ? String(editingClass.capacity) : '10');
    setOpenDropdown(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const capacityValue = parseInt(capacity, 10);
    const scheduleSlots: ClassScheduleSlot[] = selectedDays.map((day) => ({ day, startTime, endTime }));
    onSubmit({
      name: name.trim(),
      category,
      trainer,
      schedule: buildScheduleLabel(selectedDays, startTime, endTime),
      scheduleSlots,
      capacity: Number.isNaN(capacityValue) ? 10 : capacityValue,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{editingClass ? 'Dersi Düzenle' : 'Yeni Ders'}</Text>
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
            <Text style={styles.fieldLabel}>Ders Adı</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ör. Reformer Pilates"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Ders Adı"
            />

            <Text style={styles.fieldLabel}>Kategori</Text>
            <DropdownSelect
              placeholder="Kategori seç"
              options={classCategories.map((option) => ({ id: option, label: option }))}
              selectedId={category || null}
              onSelect={(id) => {
                setCategory(id ?? '');
                setOpenDropdown(null);
              }}
              open={openDropdown === 'category'}
              onToggle={() => setOpenDropdown((current) => (current === 'category' ? null : 'category'))}
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

            <Text style={styles.fieldLabel}>Günler</Text>
            <View style={styles.dayRow}>
              {WEEKDAYS.map((weekday) => {
                const active = selectedDays.includes(weekday.id);
                return (
                  <Pressable
                    key={weekday.id}
                    onPress={() => setSelectedDays((current) => toggleValue(current, weekday.id))}
                    accessibilityRole="button"
                    accessibilityLabel={weekday.label}
                    style={({ pressed }) => [styles.dayChip, active && styles.dayChipActive, pressed && styles.dayChipPressed]}
                  >
                    <Text style={[styles.dayChipLabel, active && styles.dayChipLabelActive]}>{weekday.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeRowItem}>
                <Text style={styles.fieldLabel}>Başlangıç Saati</Text>
                <DropdownSelect
                  placeholder="Saat seç"
                  options={TIME_OPTIONS.map((option) => ({ id: option, label: option }))}
                  selectedId={startTime}
                  onSelect={(id) => {
                    setStartTime(id ?? startTime);
                    setOpenDropdown(null);
                  }}
                  open={openDropdown === 'startTime'}
                  onToggle={() => setOpenDropdown((current) => (current === 'startTime' ? null : 'startTime'))}
                />
              </View>
              <View style={styles.timeRowItem}>
                <Text style={styles.fieldLabel}>Bitiş Saati</Text>
                <DropdownSelect
                  placeholder="Saat seç"
                  options={TIME_OPTIONS.map((option) => ({ id: option, label: option }))}
                  selectedId={endTime}
                  onSelect={(id) => {
                    setEndTime(id ?? endTime);
                    setOpenDropdown(null);
                  }}
                  open={openDropdown === 'endTime'}
                  onToggle={() => setOpenDropdown((current) => (current === 'endTime' ? null : 'endTime'))}
                />
              </View>
            </View>
            {startTime >= endTime ? <Text style={styles.errorText}>Bitiş saati başlangıçtan sonra olmalı.</Text> : null}

            <Text style={styles.fieldLabel}>Kapasite</Text>
            <TextInput
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel="Kapasite"
            />
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Dersi kaydet"
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
  timeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeRowItem: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.critical,
    marginTop: spacing.xs,
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

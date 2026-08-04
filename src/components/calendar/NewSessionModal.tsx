import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { colors, spacing, typography, radii } from '@/theme';
import { fromIsoDate, generateTimeOptions, toIsoDate } from '@/utils/date';
import { formatDayLabel, toInstant } from '@/utils/calendar';
import * as schedulingApi from '@/api/scheduling';
import type { StaffMemberSummary } from '@/api/staff';

interface NewSessionModalProps {
  visible: boolean;
  staff: StaffMemberSummary[];
  /** The date the calendar is showing, so the form opens on the day being looked at. */
  defaultDate: string;
  timeZoneId: string;
  onClose: () => void;
  onCreated: (title: string) => void;
  onError: (message: string) => void;
}

const TIME_OPTIONS = generateTimeOptions();

type DropdownField = 'coach' | 'time' | null;

/**
 * Adds one session to the calendar.
 *
 * <b>Replaces a form that wrote to React state.</b> The version this supersedes collected a weekday
 * and a time, pushed a row into a context, and lost it on reload — it also picked a trainer from
 * `responsibleOptions`, a free-text name list duplicated from the team screen, so the assignment
 * could never be resolved back to a person.
 *
 * The coach is a roster id (ADR-0016) and the instant is assembled from the studio's zone rather
 * than the device's — a session created at 23:30 from a laptop in London must land on the studio's
 * evening, not the following morning.
 *
 * A coach who is already teaching something that overlaps is refused by the database, and the
 * message says so. That check is not repeated here: two people can open this form at once, and only
 * one of the two attempts can be right about what the calendar contains.
 */
export function NewSessionModal({
  visible,
  staff,
  defaultDate,
  timeZoneId,
  onClose,
  onCreated,
  onError,
}: NewSessionModalProps) {
  const [title, setTitle] = useState('');
  const [coachId, setCoachId] = useState<string | null>(null);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('50');
  const [capacity, setCapacity] = useState('1');
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Only people currently working. A session cannot be assigned to somebody who has left, though
  // the roster carries them so existing assignments still render a name.
  const active = staff.filter((member) => member.status !== 'Inactive');

  const durationMinutes = Number.parseInt(duration, 10);
  const seats = Number.parseInt(capacity, 10);

  const canSubmit =
    title.trim().length > 0 &&
    Number.isFinite(durationMinutes) &&
    durationMinutes > 0 &&
    Number.isFinite(seats) &&
    seats > 0 &&
    !saving;

  const submit = () => {
    if (!canSubmit) return;

    setSaving(true);

    void (async () => {
      try {
        await schedulingApi.createSession({
          title: title.trim(),
          startsAt: toInstant(date, time, timeZoneId),
          durationMinutes,
          capacity: seats,
          coachStaffMemberId: coachId,
          classDefinitionId: null,
          notes: null,
        });

        onCreated(title.trim());
        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Ders eklenemedi.');
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Ders</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={8}>
              <AppIcon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Başlık</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Örn. Özel Ders — Selin"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tarih</Text>
            <Pressable
              onPress={() => setPickingDate(true)}
              accessibilityRole="button"
              style={styles.input}
            >
              <Text style={styles.inputText}>{formatDayLabel(date)}</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Saat</Text>
              <DropdownSelect
                placeholder="Saat seç"
                selectedId={time}
                options={TIME_OPTIONS.map((option) => ({ id: option, label: option }))}
                open={openDropdown === 'time'}
                onToggle={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
                onSelect={(id) => {
                  if (id) setTime(id);
                  setOpenDropdown(null);
                }}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Süre (dk)</Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                inputMode="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Kontenjan</Text>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                inputMode="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Eğitmen</Text>
            <DropdownSelect
              placeholder="Eğitmen seç"
              clearLabel="Eğitmen atama"
              selectedId={coachId}
              options={active.map((member) => ({ id: member.id, label: member.fullName }))}
              open={openDropdown === 'coach'}
              onToggle={() => setOpenDropdown(openDropdown === 'coach' ? null : 'coach')}
              onSelect={(id) => {
                setCoachId(id);
                setOpenDropdown(null);
              }}
            />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.secondaryButton}>
              <Text style={styles.secondaryLabel}>Vazgeç</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              accessibilityRole="button"
              style={[styles.primaryButton, !canSubmit && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryLabel}>Ekle</Text>
              )}
            </Pressable>
          </View>

          <SingleDatePickerModal
            visible={pickingDate}
            initialDate={fromIsoDate(date) ?? undefined}
            onClose={() => setPickingDate(false)}
            onSelect={(next) => {
              setDate(toIsoDate(next));
              setPickingDate(false);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  field: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  inputText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});

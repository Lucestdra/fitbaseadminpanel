import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { generateTimeOptions } from '@/utils/date';
import { WEEKDAY_ORDER, shortTime, shortWeekday } from '@/utils/calendar';
import * as schedulingApi from '@/api/scheduling';
import type { ClassSummary } from '@/api/scheduling';
import type { LabelledEntry } from '@/api/catalogs';
import type { StaffMemberSummary } from '@/api/staff';

interface ClassFormModalProps {
  /** Null when adding. */
  editing: ClassSummary | null;
  categories: LabelledEntry[];
  staff: StaffMemberSummary[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

const TIME_OPTIONS = generateTimeOptions();

type DropdownField = 'category' | 'coach' | 'slotDay' | 'slotTime' | 'slotCoach' | null;

/**
 * A class and the weekly slots it runs on.
 *
 * <b>Slots are the half the panel never had.</b> It stored `schedule: 'Pzt, Sal, Çar, Cum 08:00'`
 * as a typed string — unparseable, undrawable on a calendar, and free to drift from whatever the
 * class actually ran. Here each slot is a row the server materialises into dated occurrences the
 * moment it is added, so the calendar shows the new Tuesdays before this dialog closes.
 *
 * <b>Adding a slot saves immediately; it is not part of the form's submit.</b> That is not laziness
 * about batching: adding one writes up to twelve sessions and ending one cancels bookings and
 * refunds credits. Those are not edits to be silently rolled up into a "Kaydet" press — each is an
 * act with its own consequence, and each gets its own.
 */
export function ClassFormModal({
  editing,
  categories,
  staff,
  onClose,
  onSaved,
  onError,
}: ClassFormModalProps) {
  const [name, setName] = useState(editing?.name ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [capacity, setCapacity] = useState(String(editing?.defaultCapacity ?? 10));
  const [duration, setDuration] = useState(String(editing?.defaultDurationMinutes ?? 50));
  const [coachId, setCoachId] = useState<string | null>(editing?.defaultCoachStaffMemberId ?? null);

  // The saved class, so slots can be added the moment it exists. Adding slots to a class that has
  // not been created yet would mean holding them client-side and replaying them on submit — which
  // is a second, worse implementation of what the server already does transactionally.
  const [saved, setSaved] = useState<ClassSummary | null>(editing);

  const [slotDay, setSlotDay] = useState<string>('Monday');
  const [slotTime, setSlotTime] = useState('09:00');
  const [slotCoachId, setSlotCoachId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);
  const [busy, setBusy] = useState(false);

  const active = staff.filter((member) => member.status !== 'Inactive');

  const seats = Number.parseInt(capacity, 10);
  const minutes = Number.parseInt(duration, 10);

  const canSubmit =
    name.trim().length > 0 &&
    Number.isFinite(seats) &&
    seats > 0 &&
    Number.isFinite(minutes) &&
    minutes > 0 &&
    !busy;

  const body = (): schedulingApi.ClassBody => ({
    name: name.trim(),
    categoryId,
    description: description.trim() || null,
    defaultCapacity: seats,
    defaultDurationMinutes: minutes,
    defaultCoachStaffMemberId: coachId,
  });

  const run = (work: () => Promise<string>) => {
    if (busy) return;

    setBusy(true);

    void (async () => {
      try {
        onSaved(await work());
      } catch (error) {
        onError(error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const submit = () =>
    run(async () => {
      const result = saved
        ? await schedulingApi.updateClass(saved.id, body())
        : await schedulingApi.createClass(body());

      setSaved(result);

      return saved ? `${result.name} güncellendi.` : `${result.name} eklendi.`;
    });

  const addSlot = () =>
    run(async () => {
      if (!saved) throw new Error('Önce dersi kaydet.');

      const result = await schedulingApi.addSlot(saved.id, {
        dayOfWeek: slotDay as schedulingApi.SlotBody['dayOfWeek'],
        startsAtLocal: `${slotTime}:00`,
        durationMinutes: null,
        capacity: null,
        coachStaffMemberId: slotCoachId,
        intervalWeeks: null,
        validFrom: null,
        validTo: null,
      });

      setSaved(result);

      return `${shortWeekday(slotDay)} ${slotTime} programa eklendi ve takvim oluşturuldu.`;
    });

  const endSlot = (slotId: string, label: string) =>
    run(async () => {
      if (!saved) throw new Error('Ders bulunamadı.');

      const result = await schedulingApi.endSlot(saved.id, slotId);
      setSaved(result);

      return `${label} programdan kaldırıldı. Kayıtlı üyeler varsa iade edildi.`;
    });

  const toggleActive = () =>
    run(async () => {
      if (!saved) throw new Error('Ders bulunamadı.');

      const result = await schedulingApi.setClassActive(saved.id, !saved.isActive);
      setSaved(result);

      return result.isActive ? `${result.name} tekrar aktif.` : `${result.name} pasife alındı.`;
    });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Dersi Düzenle' : 'Yeni Ders'}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={8}>
              <AppIcon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.label}>Ders Adı</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Örn. Reformer Pilates"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kategori</Text>
              <DropdownSelect
                placeholder="Kategori seç"
                clearLabel="Kategorisiz"
                selectedId={categoryId}
                options={categories.map((entry) => ({ id: entry.id, label: entry.label }))}
                open={openDropdown === 'category'}
                onToggle={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                onSelect={(id) => {
                  setCategoryId(id);
                  setOpenDropdown(null);
                }}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.label}>Kapasite</Text>
                <TextInput
                  value={capacity}
                  onChangeText={setCapacity}
                  inputMode="numeric"
                  style={styles.input}
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
            </View>

            <Text style={styles.hint}>
              Kapasite ve süre, yeni oluşturulan seanslara kopyalanır. Geçmiş seanslar kendi
              değerlerini korur.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Varsayılan Eğitmen</Text>
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

            <View style={styles.field}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="İsteğe bağlı"
                placeholderTextColor={colors.textSecondary}
                multiline
                style={[styles.input, styles.multiline]}
              />
            </View>

            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              accessibilityRole="button"
              style={[styles.primaryButton, !canSubmit && styles.disabled]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryLabel}>{saved ? 'Değişiklikleri Kaydet' : 'Dersi Oluştur'}</Text>
              )}
            </Pressable>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Haftalık Program</Text>

            {!saved ? (
              <Text style={styles.hint}>
                Ders saatlerini eklemek için önce dersi oluştur.
              </Text>
            ) : (
              <>
                {saved.slots.length === 0 ? (
                  <Text style={styles.hint}>Henüz ders saati eklenmedi; bu ders takvimde görünmez.</Text>
                ) : (
                  saved.slots.map((slot) => {
                    const label = `${shortWeekday(slot.dayOfWeek)} ${shortTime(slot.startsAtLocal)}`;

                    return (
                      <View key={slot.id} style={styles.slotRow}>
                        <View style={styles.slotText}>
                          <Text style={styles.slotLabel}>{label}</Text>
                          <Text style={styles.slotMeta}>
                            {slot.capacity} kişi · {slot.durationMinutes} dk ·{' '}
                            {slot.coachName ?? 'Eğitmen atanmadı'}
                            {slot.intervalWeeks > 1 ? ` · ${slot.intervalWeeks} haftada bir` : ''}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => endSlot(slot.id, label)}
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel={`${label} saatini programdan kaldır`}
                          hitSlop={8}
                        >
                          <AppIcon name="trash-outline" size={16} color={colors.critical} />
                        </Pressable>
                      </View>
                    );
                  })
                )}

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.label}>Gün</Text>
                    <DropdownSelect
                      placeholder="Gün seç"
                      selectedId={slotDay}
                      options={WEEKDAY_ORDER.map((day) => ({ id: day, label: shortWeekday(day) }))}
                      open={openDropdown === 'slotDay'}
                      onToggle={() => setOpenDropdown(openDropdown === 'slotDay' ? null : 'slotDay')}
                      onSelect={(id) => {
                        if (id) setSlotDay(id);
                        setOpenDropdown(null);
                      }}
                    />
                  </View>

                  <View style={styles.flex}>
                    <Text style={styles.label}>Saat</Text>
                    <DropdownSelect
                      placeholder="Saat seç"
                      selectedId={slotTime}
                      options={TIME_OPTIONS.map((option) => ({ id: option, label: option }))}
                      open={openDropdown === 'slotTime'}
                      onToggle={() => setOpenDropdown(openDropdown === 'slotTime' ? null : 'slotTime')}
                      onSelect={(id) => {
                        if (id) setSlotTime(id);
                        setOpenDropdown(null);
                      }}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Bu saatin eğitmeni</Text>
                  <DropdownSelect
                    placeholder="Varsayılanı kullan"
                    clearLabel="Varsayılanı kullan"
                    selectedId={slotCoachId}
                    options={active.map((member) => ({ id: member.id, label: member.fullName }))}
                    open={openDropdown === 'slotCoach'}
                    onToggle={() => setOpenDropdown(openDropdown === 'slotCoach' ? null : 'slotCoach')}
                    onSelect={(id) => {
                      setSlotCoachId(id);
                      setOpenDropdown(null);
                    }}
                  />
                </View>

                <Pressable
                  onPress={addSlot}
                  disabled={busy}
                  accessibilityRole="button"
                  style={[styles.secondaryButton, busy && styles.disabled]}
                >
                  <AppIcon name="add" size={16} color={colors.textPrimary} />
                  <Text style={styles.secondaryLabel}>Ders Saati Ekle</Text>
                </Pressable>

                <View style={styles.divider} />

                {/*
                  Retire, never delete. Removing a class would take every session it produced with
                  it — and with those, every attendance record and every occupancy figure that ever
                  referenced them.
                */}
                <Pressable
                  onPress={toggleActive}
                  disabled={busy}
                  accessibilityRole="button"
                  style={[styles.secondaryButton, busy && styles.disabled]}
                >
                  <Text style={styles.secondaryLabel}>
                    {saved.isActive ? 'Dersi Pasife Al' : 'Dersi Tekrar Aktifleştir'}
                  </Text>
                </Pressable>

                <Text style={styles.hint}>
                  Pasife alınan ders yeni programa eklenmez; geçmiş seansları ve kayıtları korunur.
                </Text>
              </>
            )}
          </ScrollView>
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
    maxWidth: 560,
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  body: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
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
  hint: {
    ...typography.caption,
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
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  slotText: {
    flexShrink: 1,
    gap: 2,
  },
  slotLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  slotMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  secondaryLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});

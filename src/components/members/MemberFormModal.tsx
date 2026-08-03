import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { useCatalogs, activeOnly } from '@/context/CatalogsContext';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import { coachesAmong } from '@/api/staff';
import { formatIsoDateLabel, fromIsoDate, toIsoDate, todayIn } from '@/utils/date';
import { colors, spacing, typography, radii } from '@/theme';
import type { MemberBody, MemberDetail } from '@/api/members';

interface MemberFormModalProps {
  visible: boolean;
  /** The member being edited, or null to create one. */
  editing: MemberDetail | null;
  /** The studio's IANA zone, for what "today" means. */
  timeZoneId: string;
  onSubmit: (body: MemberBody) => Promise<void>;
  onClose: () => void;
  busy: boolean;
  /** A failed save, already turned into a sentence. Null while there is nothing to say. */
  error: string | null;
}

/**
 * Creates or edits a member.
 *
 * <b>Every field here is a field the server has.</b> The panel's version wrote seven more that no
 * longer exist: a package and a session count typed into the same form that created the person —
 * which is a sale, and a sale is a membership with a price snapshot and a ledger entry behind it,
 * not two text boxes. Selling is its own action in the drawer.
 *
 * <b>`renewalDaysLeft` is gone too</b>, and it is the clearest example of what this rewrite is for.
 * The panel stored it, hardcoded to 30 on create, and never recomputed it — so every new member
 * showed "30 gün kaldı" indefinitely, including after their package expired. It is derived from
 * `endsOn` server-side now and cannot be typed at all.
 */
export function MemberFormModal({
  visible,
  editing,
  timeZoneId,
  onSubmit,
  onClose,
  busy,
  error,
}: MemberFormModalProps) {
  const { interests, status: catalogStatus } = useCatalogs();
  const { roster, status: rosterStatus } = useStaffRoster();

  // Seeded once at mount. The parent keys this by the member being edited and mounts it only while
  // open, so it remounts with the right values rather than an effect racing the person's typing.
  const [fullName, setFullName] = useState(editing?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(editing?.phoneNumber ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [birthDate, setBirthDate] = useState<string | null>(editing?.birthDate ?? null);
  const [joinedOn, setJoinedOn] = useState<string>(editing?.joinedOn ?? todayIn(timeZoneId));
  const [coachId, setCoachId] = useState<string | null>(editing?.primaryCoachStaffMemberId ?? null);
  const [interestIds, setInterestIds] = useState<string[]>(editing?.interestIds ?? []);
  const [notes, setNotes] = useState(editing?.notes ?? '');

  const [coachOpen, setCoachOpen] = useState(false);
  const [picking, setPicking] = useState<'birthDate' | 'joinedOn' | null>(null);

  // Only entries still offered for new work. A retired interest stays resolvable on the members
  // who already carry it — that is what makes deactivating a safe alternative to deleting — but it
  // must not appear here, or a studio that retired it would carry on assigning it.
  const offeredInterests = activeOnly(interests);

  // Inactive staff are filtered out of the picker but not out of `roster`: a member whose coach
  // left keeps that coach until somebody changes it, and the drawer needs the name to say so.
  const coaches = coachesAmong(roster).filter(
    (coach) => coach.status !== 'Inactive' || coach.id === coachId,
  );

  const trimmedName = fullName.trim();
  const canSubmit = trimmedName.length > 0 && !busy;

  const submit = () => {
    if (!canSubmit) return;

    void onSubmit({
      fullName: trimmedName,

      // Empty strings become null. A member with `phoneNumber: ''` is a member the server thinks
      // has a phone number, and `''` is what a TextInput leaves behind when somebody clears it.
      phoneNumber: phoneNumber.trim() || null,
      email: email.trim() || null,
      birthDate,
      primaryCoachStaffMemberId: coachId,
      joinedOn,
      notes: notes.trim() || null,
      interestIds,
    });
  };

  const toggleInterest = (id: string) => {
    setInterestIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Üyeyi Düzenle' : 'Yeni Üye'}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>Ad Soyad</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ör. Ayşe Yılmaz"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Ad Soyad"
              autoFocus
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.fieldLabel}>Telefon</Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="0532 000 00 00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  style={styles.input}
                  accessibilityLabel="Telefon"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.fieldLabel}>E-posta</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ayse@example.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  accessibilityLabel="E-posta"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.fieldLabel}>Doğum Tarihi</Text>
                <DateField
                  value={birthDate}
                  placeholder="Seçilmedi"
                  onPress={() => setPicking('birthDate')}
                  onClear={() => setBirthDate(null)}
                  accessibilityLabel="Doğum Tarihi"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.fieldLabel}>Katılım Tarihi</Text>
                <DateField
                  value={joinedOn}
                  placeholder="Bugün"
                  onPress={() => setPicking('joinedOn')}
                  accessibilityLabel="Katılım Tarihi"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Sorumlu Eğitmen</Text>
            {rosterStatus === 'error' ? (
              <Text style={styles.hint}>
                Ekip listesi yüklenemedi. Eğitmeni sonra atayabilirsin.
              </Text>
            ) : (
              <DropdownSelect
                placeholder={rosterStatus === 'loading' ? 'Yükleniyor…' : 'Eğitmen seç'}
                options={coaches.map((coach) => ({
                  id: coach.id,
                  label: coach.fullName,
                  meta: coach.status === 'Invited' ? 'davet edildi' : undefined,
                }))}
                selectedId={coachId}
                onSelect={(id) => {
                  setCoachId(id);
                  setCoachOpen(false);
                }}
                open={coachOpen}
                onToggle={() => setCoachOpen((current) => !current)}
                clearLabel="Atanmamış"
              />
            )}

            <Text style={styles.fieldLabel}>İlgi Alanları</Text>
            {catalogStatus === 'error' ? (
              <Text style={styles.hint}>İlgi alanları yüklenemedi.</Text>
            ) : offeredInterests.length === 0 ? (
              <Text style={styles.hint}>
                Henüz ilgi alanı tanımlanmamış. Ayarlar ekranından ekleyebilirsin.
              </Text>
            ) : (
              <View style={styles.chipRow}>
                {offeredInterests.map((interest) => {
                  const selected = interestIds.includes(interest.id);
                  return (
                    <Pressable
                      key={interest.id}
                      onPress={() => toggleInterest(interest.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={interest.label}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipSelected,
                        pressed && styles.chipPressed,
                      ]}
                    >
                      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                        {interest.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={styles.fieldLabel}>Not</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Sakatlık, hedef, tercih — stüdyonun kendi notu."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.multiline]}
              accessibilityLabel="Not"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Üyeyi kaydet' : 'Üyeyi oluştur'}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>
              {busy ? 'Kaydediliyor…' : editing ? 'Kaydet' : 'Üyeyi Oluştur'}
            </Text>
          </Pressable>
        </View>
      </View>

      <SingleDatePickerModal
        visible={picking !== null}
        title={picking === 'birthDate' ? 'Doğum Tarihi' : 'Katılım Tarihi'}
        initialDate={
          (picking === 'birthDate' ? fromIsoDate(birthDate ?? '') : fromIsoDate(joinedOn)) ??
          undefined
        }
        onClose={() => setPicking(null)}
        onSelect={(date) => {
          if (picking === 'birthDate') setBirthDate(toIsoDate(date));
          if (picking === 'joinedOn') setJoinedOn(toIsoDate(date));
          setPicking(null);
        }}
      />
    </Modal>
  );
}

/**
 * A date, shown the way a person reads one and sent the way the server takes one.
 *
 * `toIsoDate` builds the string from local calendar parts rather than `toISOString()`. Anywhere
 * east of UTC, a date picked as the 1st becomes the 31st of the previous month once it is
 * serialised through UTC — which is every birthday in Istanbul, off by one, silently.
 */
function DateField({
  value,
  placeholder,
  onPress,
  onClear,
  accessibilityLabel,
}: {
  value: string | null;
  placeholder: string;
  onPress: () => void;
  onClear?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.dateField}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.dateTrigger, pressed && styles.dateTriggerPressed]}
      >
        <Text style={[styles.dateText, !value && styles.datePlaceholder]}>
          {value ? formatIsoDateLabel(value) : placeholder}
        </Text>
        <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
      </Pressable>
      {value && onClear ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabel} temizle`}
          hitSlop={8}
          style={styles.dateClear}
        >
          <AppIcon name="close" size={14} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.cardBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    ...typography.body,
    color: colors.textPrimary,
  },
  multiline: {
    height: 84,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  dateTriggerPressed: {
    backgroundColor: colors.cardBackground,
  },
  dateText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    color: colors.textSecondary,
  },
  dateClear: {
    width: 24,
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  chipPressed: {
    backgroundColor: colors.pageBackground,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  error: {
    ...typography.caption,
    color: colors.critical,
    marginTop: spacing.xs,
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
    opacity: 0.5,
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});

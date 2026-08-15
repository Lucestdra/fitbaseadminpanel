import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { EmptyStateNotice } from '@/components/ui/EmptyStateNotice';
import { PhoneField } from '@/components/ui/PhoneField';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { useCatalogs, activeOnly } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import { coachesAmong } from '@/api/staff';
import { formatIsoDateLabel, fromIsoDate, toIsoDate, todayIn } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { PAYMENT_METHOD_LABELS } from '@/api/enums';
import { colors, spacing, typography, radii } from '@/theme';
import type { PaymentMethod } from '@/api/finance';
import type { PackageTemplateEntry } from '@/api/catalogs';
import type { MemberBody, MemberDetail } from '@/api/members';

/**
 * The sale that starts alongside the member, when there is one.
 *
 * <b>Separate from `MemberBody` on purpose.</b> Creating a person and selling them a package are
 * two writes against two modules — the server has no endpoint that does both, and inventing one
 * client-side field that pretends otherwise would hide which half failed. The caller runs them in
 * order and reports honestly.
 */
export interface MemberOnboarding {
  packageTemplateId: string;
  /** Organization-local `YYYY-MM-DD`. */
  startsOn: string;
  /** What was actually charged, when it differs from the package's list price. */
  priceOverride: number | null;
  /** The money taken at the desk, or null when nothing was collected yet. */
  payment: { amount: number; method: NonNullable<PaymentMethod> } | null;
}

interface MemberFormModalProps {
  visible: boolean;
  /** The member being edited, or null to create one. */
  editing: MemberDetail | null;
  /** The studio's IANA zone, for what "today" means. */
  timeZoneId: string;
  onSubmit: (body: MemberBody, onboarding: MemberOnboarding | null) => Promise<void>;
  onClose: () => void;
  busy: boolean;
  /** A failed save, already turned into a sentence. Null while there is nothing to say. */
  error: string | null;
}

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as NonNullable<PaymentMethod>[];

const DATE_FIELD_TITLES = {
  birthDate: 'Doğum Tarihi',
  joinedOn: 'Katılım Tarihi',
  startsOn: 'Üyelik Başlangıcı',
} as const;

/**
 * Creates or edits a member.
 *
 * <b>Every field here is a field the server has.</b> The panel's version wrote seven more that no
 * longer exist — including a session count typed into a text box, which is a ledger entry and not
 * a number somebody types.
 *
 * <b>Creating a member usually means a membership starting.</b> Making the sale a second trip —
 * create the person, close the form, find them in the list, open the drawer, press Paket Sat — put
 * four steps between "she signed up" and the system knowing it, and the studios that skipped them
 * ended up with members carrying no package at all. The membership block below is optional and
 * folded into this form; it is still three separate writes underneath, and
 * <b>each is reported by name if it fails</b>, because a member created without their package is a
 * different situation from one created with a package and no payment.
 *
 * <b>`renewalDaysLeft` is gone</b>, and it is the clearest example of what this rewrite is for.
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
  const { interests, packages, status: catalogStatus } = useCatalogs();
  const { roster, status: rosterStatus } = useStaffRoster();
  const { permissions } = useAuth();

  // A coach may create a member and may not sell them anything. Hiding the block is the client half
  // of a 403 the server would return anyway — and better than a form that collects a sale it cannot
  // make, then reports it half-done.
  const canSell = permissions['members.membership.manage'] !== undefined;
  const canCollect = permissions['finance.payments.manage'] !== undefined;

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
  const [picking, setPicking] = useState<'birthDate' | 'joinedOn' | 'startsOn' | null>(null);

  // The optional sale. Only offered while creating: an existing member's membership is managed in
  // the drawer, where freezing, cancelling and renewing live together.
  const [packageId, setPackageId] = useState<string | null>(null);
  const [packageOpen, setPackageOpen] = useState(false);
  const [startsOn, setStartsOn] = useState<string>(todayIn(timeZoneId));
  const [priceOverride, setPriceOverride] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<NonNullable<PaymentMethod>>('Cash');

  // Only entries still offered for new work. A retired interest stays resolvable on the members
  // who already carry it — that is what makes deactivating a safe alternative to deleting — but it
  // must not appear here, or a studio that retired it would carry on assigning it.
  const offeredInterests = activeOnly(interests);

  // Inactive staff are filtered out of the picker but not out of `roster`: a member whose coach
  // left keeps that coach until somebody changes it, and the drawer needs the name to say so.
  const coaches = coachesAmong(roster).filter(
    (coach) => coach.status !== 'Inactive' || coach.id === coachId,
  );

  // Only what is still sold. A withdrawn package is refused by the server anyway; offering it here
  // would turn that refusal into a mystery halfway through creating somebody.
  const offeredPackages = editing === null && canSell ? activeOnly(packages) : [];
  const selectedPackage = offeredPackages.find((entry) => entry.id === packageId) ?? null;

  const parsedOverride = priceOverride.trim() === '' ? null : Number(priceOverride.replace(',', '.'));
  const overrideValid =
    parsedOverride === null || (Number.isFinite(parsedOverride) && parsedOverride >= 0);

  // What the sale comes to, so the payment box can default to it and the summary can name it.
  const saleTotal = selectedPackage ? parsedOverride ?? selectedPackage.price ?? null : null;

  const parsedPayment = paymentAmount.trim() === '' ? null : Number(paymentAmount.replace(',', '.'));
  const paymentValid =
    !collecting ||
    (parsedPayment !== null && Number.isFinite(parsedPayment) && parsedPayment > 0);

  const trimmedName = fullName.trim();
  const canSubmit = trimmedName.length > 0 && overrideValid && paymentValid && !busy;

  const submit = () => {
    if (!canSubmit) return;

    const body: MemberBody = {
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
    };

    const onboarding: MemberOnboarding | null =
      selectedPackage === null
        ? null
        : {
            packageTemplateId: selectedPackage.id,
            startsOn,
            priceOverride: parsedOverride,
            payment:
              collecting && parsedPayment !== null
                ? { amount: parsedPayment, method: paymentMethod }
                : null,
          };

    void onSubmit(body, onboarding);
  };

  /** Selecting a package pre-fills the amount, because "paid in full" is the common case. */
  const choosePackage = (id: string | null) => {
    setPackageId(id);
    setPackageOpen(false);

    const entry = offeredPackages.find((candidate) => candidate.id === id);
    setPaymentAmount(entry?.price != null ? String(entry.price) : '');

    if (id === null) {
      setCollecting(false);
      setPriceOverride('');
    }
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
                {/* The one phone field in the app with a country picker. Members arrive from
                    abroad; a coach's mobile and the studio's own line do not. */}
                <PhoneField
                  value={phoneNumber}
                  onChange={(next) => setPhoneNumber(next ?? '')}
                  selectableCountry
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
              <EmptyStateNotice
                message="Henüz ilgi alanı tanımlanmamış."
                actionLabel="İlgi Alanı Tanımla"
                actionSection="interests"
              />
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

            {editing === null && canSell ? (
              <MembershipStep
                status={catalogStatus}
                packages={offeredPackages}
                selected={selectedPackage}
                onSelectPackage={choosePackage}
                pickerOpen={packageOpen}
                onTogglePicker={() => setPackageOpen((current) => !current)}
                startsOn={startsOn}
                onPickStart={() => setPicking('startsOn')}
                priceOverride={priceOverride}
                onPriceOverride={setPriceOverride}
                overrideValid={overrideValid}
                canCollect={canCollect}
                collecting={collecting}
                onToggleCollecting={() => setCollecting((current) => !current)}
                paymentAmount={paymentAmount}
                onPaymentAmount={setPaymentAmount}
                paymentMethod={paymentMethod}
                onPaymentMethod={setPaymentMethod}
                paymentValid={paymentValid}
                remaining={
                  saleTotal !== null && parsedPayment !== null && Number.isFinite(parsedPayment)
                    ? saleTotal - parsedPayment
                    : null
                }
              />
            ) : null}

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
              {busy
                ? 'Kaydediliyor…'
                : editing
                  ? 'Kaydet'
                  : selectedPackage
                    ? 'Üyeyi Oluştur ve Üyeliği Başlat'
                    : 'Üyeyi Oluştur'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Keyed and mounted only while open. Left mounted, the picker keeps the year and month it
          was last on, so opening the joining date after a birth date started in 1988. */}
      {picking !== null ? (
        <SingleDatePickerModal
          key={picking}
          visible
          title={DATE_FIELD_TITLES[picking]}
          // A birth date is decades back; the other two are around today. Opening on the year grid
          // for the first turns thirty back-arrows into two taps.
          initialMode={picking === 'birthDate' ? 'year' : 'day'}
          maxYear={picking === 'birthDate' ? new Date().getFullYear() : undefined}
          initialDate={
            fromIsoDate(
              picking === 'birthDate' ? birthDate ?? '' : picking === 'joinedOn' ? joinedOn : startsOn,
            ) ?? undefined
          }
          onClose={() => setPicking(null)}
          onSelect={(date) => {
            const iso = toIsoDate(date);
            if (picking === 'birthDate') setBirthDate(iso);
            if (picking === 'joinedOn') setJoinedOn(iso);
            if (picking === 'startsOn') setStartsOn(iso);
            setPicking(null);
          }}
        />
      ) : null}
    </Modal>
  );
}

/**
 * The optional sale, folded into the create form.
 *
 * Every value is held by the form above and passed down, so the sale and the person submit together
 * and the caller sees one payload. Split out only because three optional blocks nested inside a
 * scroll view inside a modal is a shape nobody can read.
 */
function MembershipStep({
  status,
  packages,
  selected,
  onSelectPackage,
  pickerOpen,
  onTogglePicker,
  startsOn,
  onPickStart,
  priceOverride,
  onPriceOverride,
  overrideValid,
  canCollect,
  collecting,
  onToggleCollecting,
  paymentAmount,
  onPaymentAmount,
  paymentMethod,
  onPaymentMethod,
  paymentValid,
  remaining,
}: {
  status: 'loading' | 'ready' | 'error';
  packages: PackageTemplateEntry[];
  selected: PackageTemplateEntry | null;
  onSelectPackage: (id: string | null) => void;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  startsOn: string;
  onPickStart: () => void;
  priceOverride: string;
  onPriceOverride: (value: string) => void;
  overrideValid: boolean;
  canCollect: boolean;
  collecting: boolean;
  onToggleCollecting: () => void;
  paymentAmount: string;
  onPaymentAmount: (value: string) => void;
  paymentMethod: NonNullable<PaymentMethod>;
  onPaymentMethod: (method: NonNullable<PaymentMethod>) => void;
  paymentValid: boolean;
  /** What is left owing after the collection, or null when there is nothing to compare. */
  remaining: number | null;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Üyelik</Text>
        <Text style={styles.sectionCaption}>İsteğe bağlı</Text>
      </View>

      {status === 'error' ? (
        <Text style={styles.hint}>Paketler yüklenemedi. Üyeyi kaydedip paketi sonra satabilirsin.</Text>
      ) : packages.length === 0 ? (
        <EmptyStateNotice
          message="Satılabilir paket yok. Paket tanımlarsan üyeliği buradan başlatabilirsin."
          actionLabel="Paket Tanımla"
          actionSection="packages"
        />
      ) : (
        <>
          <Text style={styles.fieldLabel}>Paket</Text>
          <DropdownSelect
            placeholder={status === 'loading' ? 'Yükleniyor…' : 'Paket seç'}
            clearLabel="Şimdi üyelik başlatma"
            options={packages.map((entry) => ({
              id: entry.id,
              label: entry.name,
              meta:
                entry.sessionCount === null
                  ? `Sınırsız · ${entry.durationDays} gün`
                  : `${entry.sessionCount} seans · ${entry.durationDays} gün`,
            }))}
            selectedId={selected?.id ?? null}
            onSelect={onSelectPackage}
            open={pickerOpen}
            onToggle={onTogglePicker}
          />
        </>
      )}

      {selected ? (
        <>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Üyelik Başlangıcı</Text>
              <DateField
                value={startsOn}
                placeholder="Bugün"
                onPress={onPickStart}
                accessibilityLabel="Üyelik Başlangıcı"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>
                Ücret
                {formatMoney(selected.price, selected.currency)
                  ? ` (liste: ${formatMoney(selected.price, selected.currency)})`
                  : ''}
              </Text>
              <TextInput
                value={priceOverride}
                onChangeText={onPriceOverride}
                placeholder="Liste fiyatı"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={styles.input}
                accessibilityLabel="Ücret"
              />
            </View>
          </View>

          {!overrideValid ? (
            <Text style={styles.error}>Ücret geçerli bir tutar olmalı.</Text>
          ) : null}

          {canCollect ? (
            <>
              {/* Collecting is opt-in rather than assumed. A membership sold on account is normal,
                  and pre-ticking this would record money that never arrived. */}
              <Pressable
                onPress={onToggleCollecting}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: collecting }}
                accessibilityLabel="Ödemeyi şimdi kaydet"
                style={styles.checkRow}
              >
                <View style={[styles.checkBox, collecting && styles.checkBoxOn]}>
                  {collecting ? <AppIcon name="checkmark" size={13} color={colors.white} /> : null}
                </View>
                <Text style={styles.checkLabel}>Ödemeyi şimdi kaydet</Text>
              </Pressable>

              {collecting ? (
                <>
                  <View style={styles.row}>
                    <View style={styles.rowItem}>
                      <Text style={styles.fieldLabel}>Tahsil Edilen</Text>
                      <TextInput
                        value={paymentAmount}
                        onChangeText={onPaymentAmount}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                        accessibilityLabel="Tahsil Edilen"
                      />
                    </View>
                    <View style={styles.rowItem}>
                      <Text style={styles.fieldLabel}>Yöntem</Text>
                      <View style={styles.chipRow}>
                        {PAYMENT_METHODS.map((method) => {
                          const on = method === paymentMethod;

                          return (
                            <Pressable
                              key={method}
                              onPress={() => onPaymentMethod(method)}
                              accessibilityRole="radio"
                              accessibilityState={{ selected: on }}
                              accessibilityLabel={PAYMENT_METHOD_LABELS[method]}
                              style={({ pressed }) => [
                                styles.chip,
                                on && styles.chipSelected,
                                pressed && styles.chipPressed,
                              ]}
                            >
                              <Text style={[styles.chipLabel, on && styles.chipLabelSelected]}>
                                {PAYMENT_METHOD_LABELS[method]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  {!paymentValid ? (
                    <Text style={styles.error}>Tahsilat tutarı sıfırdan büyük olmalı.</Text>
                  ) : null}

                  {/* Said out loud, because part-payment is the case people get wrong. The rest is
                      a receivable and shows up on the payments screen either way. */}
                  {remaining !== null && remaining > 0 ? (
                    <Text style={styles.hint}>
                      Kalan {formatMoney(remaining, selected.currency) ?? ''} borç olarak kaydedilir
                      ve Ödemeler ekranında görünür.
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.hint}>
                  Ücret, ödenmemiş borç olarak kaydedilir. Tahsilatı sonra Ödemeler ekranından
                  girebilirsin.
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.hint}>
              Ücret, ödenmemiş borç olarak kaydedilir. Tahsilatı, yetkisi olan biri Ödemeler
              ekranından girer.
            </Text>
          )}
        </>
      ) : null}
    </View>
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
  section: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  sectionCaption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
  },
  checkBoxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkLabel: {
    ...typography.body,
    color: colors.textPrimary,
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

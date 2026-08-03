import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { colors, spacing, typography, radii } from '@/theme';
import type { OrganizationLocalization } from '@/api/settings';

type DayOfWeek = OrganizationLocalization['weekStartDay'];

interface LocalizationCardProps {
  localization: OrganizationLocalization;
  onSave: (localization: OrganizationLocalization) => Promise<void>;
  busy: boolean;
}

/**
 * The zones a studio using this product plausibly sits in.
 *
 * <b>Not the whole IANA database.</b> The server accepts any zone the platform knows, and a support
 * agent can set one outside this list — so the current value is always offered even when it is not
 * here, rather than the dropdown quietly replacing it with Istanbul on the next save.
 */
const TIME_ZONES: { id: string; label: string }[] = [
  { id: 'Europe/Istanbul', label: 'İstanbul (Türkiye)' },
  { id: 'Europe/Nicosia', label: 'Lefkoşa (Kıbrıs)' },
  { id: 'Europe/Berlin', label: 'Berlin (Almanya)' },
  { id: 'Europe/Amsterdam', label: 'Amsterdam (Hollanda)' },
  { id: 'Europe/London', label: 'Londra (Birleşik Krallık)' },
  { id: 'Asia/Dubai', label: 'Dubai (BAE)' },
];

const LOCALES: { id: string; label: string }[] = [
  { id: 'tr-TR', label: 'Türkçe (Türkiye)' },
  { id: 'en-US', label: 'İngilizce (ABD)' },
  { id: 'en-GB', label: 'İngilizce (Birleşik Krallık)' },
  { id: 'de-DE', label: 'Almanca (Almanya)' },
];

const WEEK_START: { value: DayOfWeek; label: string }[] = [
  { value: 'Monday', label: 'Pzt' },
  { value: 'Tuesday', label: 'Sal' },
  { value: 'Wednesday', label: 'Çar' },
  { value: 'Thursday', label: 'Per' },
  { value: 'Friday', label: 'Cum' },
  { value: 'Saturday', label: 'Cmt' },
  { value: 'Sunday', label: 'Paz' },
];

/**
 * What the clock reads in a zone right now, or null if the runtime cannot resolve it.
 *
 * This is the only way the studio can check the answer. "Europe/Istanbul" is a string nobody can
 * verify by looking at it; "3.08.2026 17:42" either matches the wall clock or it does not.
 */
function nowIn(timeZoneId: string): string | null {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: timeZoneId,
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());
  } catch {
    return null;
  }
}

/**
 * Time zone, language and week start.
 *
 * <b>The panel had none of this.</b> Every date it showed came from the device clock, so "bugünkü
 * seanslar" meant something different for a coach whose laptop was in another zone, and the program
 * month rolled over at the wrong midnight. These four values are what the server answers those
 * questions from.
 *
 * Currency is displayed but not editable: the column ships from day one so multi-currency is not a
 * migration later, and the server refuses anything but TRY today. A dropdown whose every other
 * option returns an error is worse than a locked field with the reason next to it.
 */
export function LocalizationCard({ localization, onSave, busy }: LocalizationCardProps) {
  // Seeded at mount. The settings screen mounts this card only while its section is open, so
  // reopening after a save picks up the server's copy without an effect watching the prop.
  const [timeZoneId, setTimeZoneId] = useState(localization.timeZoneId);
  const [locale, setLocale] = useState(localization.locale);
  const [weekStartDay, setWeekStartDay] = useState<DayOfWeek>(localization.weekStartDay);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);

  const withCurrent = (options: { id: string; label: string }[], current: string) =>
    options.some((option) => option.id === current)
      ? options
      : [...options, { id: current, label: current }];

  const clock = nowIn(timeZoneId);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Bölge ve Dil" icon="globe-outline" />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Saat Dilimi</Text>
        <DropdownSelect
          placeholder="Saat dilimi seç"
          options={withCurrent(TIME_ZONES, localization.timeZoneId)}
          selectedId={timeZoneId}
          onSelect={(id) => {
            if (id) setTimeZoneId(id);
            setZoneOpen(false);
          }}
          open={zoneOpen}
          onToggle={() => setZoneOpen((current) => !current)}
        />
        <Text style={styles.hint}>
          {clock
            ? `Seçili dilimde şu an: ${clock}. Stüdyonun saatiyle aynı değilse yanlış dilim seçili.`
            : 'Günlük raporlar, program ayı ve "bugünün seansları" bu dilime göre hesaplanır.'}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Dil ve Biçim</Text>
        <DropdownSelect
          placeholder="Dil seç"
          options={withCurrent(LOCALES, localization.locale)}
          selectedId={locale}
          onSelect={(id) => {
            if (id) setLocale(id);
            setLocaleOpen(false);
          }}
          open={localeOpen}
          onToggle={() => setLocaleOpen((current) => !current)}
        />
        <Text style={styles.hint}>Tarih ve sayı biçimlerinde kullanılır.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Haftanın İlk Günü</Text>
        <SegmentedControl
          options={WEEK_START}
          value={weekStartDay}
          onChange={(value) => setWeekStartDay(value)}
        />
        <Text style={styles.hint}>Takvimin ilk sütunu.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Para Birimi</Text>
        <View style={styles.lockedValue}>
          <Text style={styles.lockedText}>{localization.currency}</Text>
        </View>
        <Text style={styles.hint}>
          İlk sürümde yalnızca TRY destekleniyor. Paketler ve ödemeler bu birimde tutulur.
        </Text>
      </View>

      <Pressable
        onPress={() =>
          void onSave({
            timeZoneId,
            locale,
            currency: localization.currency,
            weekStartDay,
          })
        }
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Bölge ayarlarını kaydet"
        style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
      >
        <Text style={styles.saveLabel}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  lockedValue: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  lockedText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  saveButton: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveLabel: {
    ...typography.button,
    color: colors.white,
  },
});

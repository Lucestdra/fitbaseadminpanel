import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import {
  COUNTRIES,
  acceptNationalInput,
  composePhone,
  findCountry,
  formatNational,
  parsePhone,
} from '@/utils/phone';
import { colors, spacing, typography, radii } from '@/theme';

interface PhoneFieldProps {
  /** The stored number, as the API holds it. */
  value: string | null;
  /** Called with the composed number, or null when the field is emptied. */
  onChange: (value: string | null) => void;
  /**
   * Lets the person change the country.
   *
   * Off by default. A studio's own contact number and a coach's mobile are domestic, and a picker
   * there is a control with one useful setting. Member intake turns it on — a Turkish studio does
   * get members with German and Dutch numbers, and the old free-text field lost the country every
   * time somebody typed one without a plus.
   */
  selectableCountry?: boolean;
  accessibilityLabel: string;
  placeholder?: string;
  editable?: boolean;
}

/**
 * A phone number with its country attached.
 *
 * <b>Replaces a bare `TextInput` that stored whatever was typed.</b> Four screens each had their
 * own placeholder — `0532 000 00 00` on one, `+90 5xx xxx xx xx` on another — so the same person
 * was stored three ways depending on where they were entered.
 *
 * The country is never guessed from what is typed after the fact: it is a value the field holds and
 * writes into the string, which is what makes `+49` survive a round trip through the API.
 */
export function PhoneField({
  value,
  onChange,
  selectableCountry = false,
  accessibilityLabel,
  placeholder,
  editable = true,
}: PhoneFieldProps) {
  const parsed = useMemo(() => parsePhone(value), [value]);

  // Held locally so the country survives clearing the digits. Derived from `value` alone, emptying
  // the field would snap the picker back to Türkiye mid-edit.
  const [countryCode, setCountryCode] = useState(parsed.country.code);
  const [pickerOpen, setPickerOpen] = useState(false);

  const country = findCountry(countryCode);
  const national = parsed.national;

  const handleText = (raw: string) => {
    const digits = acceptNationalInput(country, raw);
    onChange(composePhone(country, digits));
  };

  const handleCountry = (id: string | null) => {
    const next = findCountry(id ?? country.code);
    setCountryCode(next.code);
    setPickerOpen(false);

    // Re-composed so the stored string carries the new dial code immediately, rather than only
    // once somebody also edits the digits.
    onChange(composePhone(next, acceptNationalInput(next, national)));
  };

  return (
    <View style={styles.row}>
      {selectableCountry ? (
        <View style={styles.picker}>
          <DropdownSelect
            placeholder="Ülke"
            options={COUNTRIES.map((entry) => ({
              id: entry.code,
              label: `${entry.flag} +${entry.dial}`,
              meta: entry.name,
            }))}
            selectedId={country.code}
            onSelect={handleCountry}
            open={pickerOpen}
            onToggle={() => setPickerOpen((current) => !current)}
            disabled={!editable}
            panelMinWidth={260}
          />
        </View>
      ) : (
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>
            {country.flag} +{country.dial}
          </Text>
        </View>
      )}

      <TextInput
        value={formatNational(country, national)}
        onChangeText={handleText}
        placeholder={placeholder ?? (country.code === 'TR' ? '5xx xxx xx xx' : 'Numara')}
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        inputMode="tel"
        editable={editable}
        style={[styles.input, !editable && styles.inputDisabled]}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  picker: {
    width: 116,
  },
  prefix: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  prefixText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.6,
  },
});

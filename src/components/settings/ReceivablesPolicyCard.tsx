import { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { colors, spacing, typography, radii } from '@/theme';
import type { ReceivablesPolicy } from '@/api/settings';

interface ReceivablesPolicyCardProps {
  receivables: ReceivablesPolicy;
  onSave: (overdueGraceDays: number) => Promise<void>;
  busy: boolean;
}

/**
 * The choices a studio actually makes, rather than a free number field.
 *
 * <b>Zero is on the list on purpose.</b> "Due today, late tomorrow" is a real policy — it is what a
 * studio collecting in advance means — and a picker starting at three would make it unreachable
 * while the server accepts it. The upper end stops at fourteen because beyond that the question
 * stops being "grace" and becomes "when do we write it off", which this setting does not answer.
 */
const CHOICES = [0, 3, 7, 14].map((days) => ({
  // SegmentedControl keys on a string, so the days travel as one and are parsed on the way back.
  // The alternative is a numeric control nothing else in the panel uses.
  value: String(days),
  label: days === 0 ? 'Aynı gün' : `${days} gün`,
}));

/**
 * How long an unpaid instalment has before it reads as late.
 *
 * <b>One number that decides what a word means on two screens.</b> The receivables list marks a row
 * <i>gecikti</i>, and the dashboard's "Gecikmiş" tile sums what is past due — both against this. It
 * has been settable through the API since Phase 2.5 and reachable from nowhere, so every studio has
 * been on the seven-day default whether or not it suited them, while the receivables table displayed
 * that seven back to them as though somebody had chosen it.
 *
 * <b>Nothing is recalculated when this changes.</b> Overdue is derived at read time rather than
 * stored (backend ADR-0033), so the next read of either screen simply answers differently. There is
 * no job to run, nothing to backfill, and no window during which the two screens disagree.
 */
export function ReceivablesPolicyCard({ receivables, onSave, busy }: ReceivablesPolicyCardProps) {
  // Seeded at mount, matching the other cards: the settings screen mounts this only while its
  // section is open, so reopening after a save picks up the server's copy without an effect.
  const [graceDays, setGraceDays] = useState(String(receivables.overdueGraceDays));

  const days = Number(graceDays);
  const changed = days !== receivables.overdueGraceDays;

  // A value a support agent set outside this list — the server takes anything from 0 to 90 — is
  // offered rather than silently replaced by the nearest choice on the next save.
  const current = String(receivables.overdueGraceDays);

  const options = CHOICES.some((choice) => choice.value === current)
    ? CHOICES
    : [...CHOICES, { value: current, label: `${current} gün` }].sort(
        (left, right) => Number(left.value) - Number(right.value),
      );

  return (
    <Card style={styles.card}>
      <SectionHeader title="Gecikme Süresi" icon="time-outline" />

      <Text style={styles.intro}>
        Vadesi geçen bir taksitin kaç gün sonra <Text style={styles.emphasis}>gecikmiş</Text> sayılacağı.
      </Text>

      <SegmentedControl options={options} value={graceDays} onChange={setGraceDays} />

      <Text style={styles.hint}>
        {days === 0
          ? 'Vadesi dün olan bir taksit bugün gecikmiş görünür.'
          : `Vadesinden ${days} gün sonra gecikmiş görünür. Bu süre içinde alacak listesinde bekliyor olarak kalır.`}
      </Text>

      <Text style={styles.note}>
        Bu ayar Ödemeler ekranındaki alacak listesini ve panodaki “Gecikmiş” kartını aynı anda
        etkiler. Geçmiş kayıtlar yeniden hesaplanmaz — gecikme her okumada anlık hesaplanır.
      </Text>

      <Pressable
        onPress={() => void onSave(days)}
        disabled={!changed || busy}
        accessibilityRole="button"
        accessibilityLabel="Gecikme süresini kaydet"
        accessibilityState={{ disabled: !changed || busy }}
        style={({ pressed }) => [
          styles.save,
          pressed && styles.savePressed,
          (!changed || busy) && styles.saveDisabled,
        ]}
      >
        <Text style={styles.saveLabel}>{busy ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emphasis: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.mintLight,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  save: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },
  savePressed: {
    opacity: 0.85,
  },
  saveDisabled: {
    opacity: 0.5,
  },
  saveLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});

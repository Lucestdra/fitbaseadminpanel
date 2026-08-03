import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import * as membersApi from '@/api/members';
import { ApiError } from '@/api/problem';
import { SESSION_REASON_LABELS } from '@/api/enums';
import { formatDateTimeLabel } from '@/utils/date';
import { colors, spacing, typography, radii } from '@/theme';
import type { SessionLedgerEntry } from '@/api/members';

interface SessionLedgerPanelProps {
  memberId: string;
  /** The last page, which came back with the member. Paging continues from here. */
  initialEntries: SessionLedgerEntry[];
  canAdjust: boolean;
  onChanged: () => Promise<void>;
  onNotify: (message: string) => void;
}

/**
 * Where the sessions went.
 *
 * <b>A ledger, not a counter.</b> The panel keeps `sessionsRemaining` as a number it decrements,
 * so "I paid for ten and I have six" has no answer beyond the number itself. Every row here is an
 * append-only fact with the balance it produced — and the table is `REVOKE UPDATE, DELETE` from
 * the application role, so no code path can quietly edit one afterwards.
 *
 * That is also why a manual correction requires a note. An unexplained adjustment is the row
 * nobody can defend when the member asks about it, and it cannot be annotated later.
 */
export function SessionLedgerPanel({
  memberId,
  initialEntries,
  canAdjust,
  onChanged,
  onNotify,
}: SessionLedgerPanelProps) {
  const [entries, setEntries] = useState<SessionLedgerEntry[]>(initialEntries);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedMore, setLoadedMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadMore = async () => {
    setLoading(true);

    try {
      const page = await membersApi.listMemberSessions(memberId, cursor ?? undefined);

      // The first press replaces rather than appends: `initialEntries` is the server's "recent"
      // slice, and appending page one to it would show the newest rows twice.
      setEntries((existing) => (loadedMore ? [...existing, ...page.items] : page.items));
      setCursor(page.nextCursor ?? null);
      setLoadedMore(true);
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'Seans geçmişi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const adjust = async (delta: number, note: string) => {
    setBusy(true);

    try {
      await membersApi.adjustSessionCredits(memberId, { delta, note });
      setAdjusting(false);

      // Re-read from the top rather than pushing the new row on. The correction lands with a
      // server-assigned time and a balance the server computed, and guessing either would put a
      // number on screen that the ledger does not agree with.
      setEntries([]);
      setCursor(null);
      setLoadedMore(false);
      await onChanged();
      onNotify('Bakiye düzeltildi.');
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'Düzeltme uygulanamadı.');
    } finally {
      setBusy(false);
    }
  };

  const shown = loadedMore ? entries : initialEntries;

  return (
    <View style={styles.container}>
      {canAdjust ? (
        <Pressable
          onPress={() => setAdjusting(true)}
          accessibilityRole="button"
          accessibilityLabel="Bakiyeyi düzelt"
          style={({ pressed }) => [styles.adjustButton, pressed && styles.adjustPressed]}
        >
          <Text style={styles.adjustLabel}>Bakiyeyi Düzelt</Text>
        </Pressable>
      ) : null}

      {shown.length === 0 ? (
        <Text style={styles.hint}>Henüz seans hareketi yok.</Text>
      ) : (
        shown.map((entry) => <LedgerRow key={entry.id} entry={entry} />)
      )}

      {cursor !== null || (!loadedMore && shown.length > 0) ? (
        <Pressable
          onPress={() => void loadMore()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Daha fazla hareket yükle"
          style={({ pressed }) => [styles.loadMore, pressed && styles.loadMorePressed]}
        >
          <Text style={styles.loadMoreLabel}>{loading ? 'Yükleniyor…' : 'Daha fazla göster'}</Text>
        </Pressable>
      ) : null}

      {adjusting ? (
        <AdjustDialog
          busy={busy}
          onClose={() => setAdjusting(false)}
          onSubmit={(delta, note) => void adjust(delta, note)}
        />
      ) : null}
    </View>
  );
}

function LedgerRow({ entry }: { entry: SessionLedgerEntry }) {
  const positive = entry.delta > 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowPrimary}>{SESSION_REASON_LABELS[entry.reason]}</Text>
        <Text style={styles.rowSecondary}>
          {formatDateTimeLabel(new Date(entry.occurredAt))}
          {entry.note ? ` · ${entry.note}` : ''}
        </Text>
      </View>
      <View style={styles.rowNumbers}>
        <Text style={[styles.delta, positive ? styles.deltaPositive : styles.deltaNegative]}>
          {positive ? `+${entry.delta}` : entry.delta}
        </Text>
        <Text style={styles.balance}>bakiye {entry.balanceAfter}</Text>
      </View>
    </View>
  );
}

/** A manual correction. The note is required by the server, and this says why. */
function AdjustDialog({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (delta: number, note: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [note, setNote] = useState('');

  const parsed = Number.parseInt(amount, 10);
  const valid = Number.isInteger(parsed) && parsed > 0 && note.trim().length > 0;

  // Its own Modal: the drawer's body scrolls, and an overlay rendered inside it would scroll
  // away with the ledger rows underneath it.
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.dialogPanel}>
          <Text style={styles.dialogTitle}>Bakiyeyi Düzelt</Text>

          <View style={styles.directionRow}>
            {([1, -1] as const).map((option) => {
              const active = direction === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setDirection(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option === 1 ? 'Seans ekle' : 'Seans düş'}
                  style={[styles.directionOption, active && styles.directionActive]}
                >
                  <Text style={[styles.directionLabel, active && styles.directionLabelActive]}>
                    {option === 1 ? 'Ekle' : 'Düş'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Seans Sayısı</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="1"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel="Seans sayısı"
          />

          <Text style={styles.fieldLabel}>Açıklama</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ör. yanlış işlenen rezervasyon düzeltmesi"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Açıklama"
          />
          <Text style={styles.hint}>
            Zorunlu. Seans geçmişi sonradan düzenlenemez, bu yüzden düzeltmenin sebebi burada
            kalmalı.
          </Text>

          <Pressable
            onPress={() => onSubmit(direction * parsed, note.trim())}
            disabled={!valid || busy}
            accessibilityRole="button"
            accessibilityLabel="Düzeltmeyi uygula"
            style={({ pressed }) => [
              styles.submitButton,
              (!valid || busy) && styles.submitDisabled,
              pressed && styles.submitPressed,
            ]}
          >
            <Text style={styles.submitLabel}>{busy ? 'İşleniyor…' : 'Uygula'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  adjustButton: {
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  adjustPressed: {
    backgroundColor: colors.pageBackground,
  },
  adjustLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowPrimary: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  rowSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowNumbers: {
    alignItems: 'flex-end',
  },
  delta: {
    ...typography.bodyStrong,
  },
  deltaPositive: {
    color: colors.primaryDark,
  },
  deltaNegative: {
    color: colors.textPrimary,
  },
  balance: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loadMore: {
    alignSelf: 'center',
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loadMorePressed: {
    backgroundColor: colors.pageBackground,
  },
  loadMoreLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  dialogOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  dialogPanel: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.cardBackground,
  },
  dialogTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  directionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  directionOption: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionActive: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  directionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  directionLabelActive: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  fieldLabel: {
    ...typography.captionStrong,
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
  submitButton: {
    height: 44,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});

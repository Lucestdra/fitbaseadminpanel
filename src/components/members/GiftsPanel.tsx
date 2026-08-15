import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { EmptyStateNotice } from '@/components/ui/EmptyStateNotice';
import { useCatalogs, activeOnly } from '@/context/CatalogsContext';
import * as membersApi from '@/api/members';
import { ApiError } from '@/api/problem';
import { formatIsoDateLabel } from '@/utils/date';
import { colors, spacing, typography, radii } from '@/theme';
import type { GiftSummary } from '@/api/members';
import type { GiftEffectType } from '@/api/catalogs';

interface GiftsPanelProps {
  memberId: string;
  gifts: GiftSummary[];
  onChanged: () => Promise<void>;
  onNotify: (message: string) => void;
}

/** What each effect does to the member, said in the units it is counted in. */
const EFFECT_LABELS: Record<GiftEffectType, (amount: number) => string> = {
  ExtendDays: (amount) => `${amount} gün süre uzatma`,
  AddSessions: (amount) => `${amount} seans eklendi`,
  FreeSession: (amount) => `${amount} ücretsiz seans`,
};

/**
 * Gifts, and what granting one actually did.
 *
 * <b>Granting a gift changes the member, not a list.</b> The panel's gift is a name and a prose
 * description — "Üyeliğin bitiş tarihine 1 ay ekler" — so awarding "3 Seans Hediye" appended a row
 * and nothing else: the member still had the balance they started with, and nobody found out until
 * they tried to book. The effect is structured now and the server applies it in the same
 * transaction that records it, which is why this list shows the effect rather than the sentence
 * somebody typed when they created the template.
 */
export function GiftsPanel({ memberId, gifts, onChanged, onNotify }: GiftsPanelProps) {
  const { gifts: templates } = useCatalogs();
  const offered = activeOnly(templates);

  const [granting, setGranting] = useState(false);
  const [busy, setBusy] = useState(false);

  const grant = async (giftTemplateId: string, note: string | null) => {
    setBusy(true);

    try {
      const granted = await membersApi.grantGift(memberId, { giftTemplateId, note });
      setGranting(false);
      await onChanged();
      onNotify(`${granted.giftName} verildi.`);
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'Hediye verilemedi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* No disabled "Hediye Ver" above an explanation of why it is disabled. With no templates
          the only useful action is defining one, and that is the button the panel shows. */}
      {offered.length === 0 ? (
        <EmptyStateNotice
          message="Tanımlı hediye yok. Hediye verebilmek için önce bir hediye tanımla."
          actionLabel="Hediye Tanımla"
          actionSection="gifts"
        />
      ) : (
        <Pressable
          onPress={() => setGranting(true)}
          accessibilityRole="button"
          accessibilityLabel="Hediye ver"
          style={({ pressed }) => [styles.grantButton, pressed && styles.grantPressed]}
        >
          <Text style={styles.grantLabel}>Hediye Ver</Text>
        </Pressable>
      )}

      {gifts.length === 0 ? (
        offered.length > 0 ? (
          <EmptyStateNotice
            message="Bu üyeye henüz hediye verilmemiş."
            actionLabel="Hediye Ver"
            onAction={() => setGranting(true)}
            icon="gift-outline"
          />
        ) : null
      ) : (
        gifts.map((gift) => (
          <View key={gift.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowPrimary} numberOfLines={1}>
                {gift.giftName}
              </Text>
              <Text style={styles.rowSecondary}>
                {formatIsoDateLabel(gift.grantedOn)} ·{' '}
                {EFFECT_LABELS[gift.effectType](gift.effectAmount)}
                {gift.note ? ` · ${gift.note}` : ''}
              </Text>
            </View>

            {/* Only for gifts that are consumed. An ExtendDays gift has no remaining count —
                it happened once and the end date moved. */}
            {gift.remainingUses !== null ? (
              <Text style={styles.remaining}>{gift.remainingUses} kalan</Text>
            ) : null}
          </View>
        ))
      )}

      {granting ? (
        <GrantDialog
          busy={busy}
          options={offered.map((template) => ({
            id: template.id,
            label: template.name,
            meta: EFFECT_LABELS[template.effectType](template.effectAmount),
          }))}
          onClose={() => setGranting(false)}
          onSubmit={(id, note) => void grant(id, note)}
        />
      ) : null}
    </View>
  );
}

function GrantDialog({
  busy,
  options,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  options: { id: string; label: string; meta: string }[];
  onClose: () => void;
  onSubmit: (giftTemplateId: string, note: string | null) => void;
}) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  // Its own Modal, for the same reason the adjust dialog is one: the drawer body scrolls.
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
          <Text style={styles.dialogTitle}>Hediye Ver</Text>

          <Text style={styles.fieldLabel}>Hediye</Text>
          <DropdownSelect
            placeholder="Hediye seç"
            options={options}
            selectedId={templateId}
            onSelect={(id) => {
              setTemplateId(id);
              setOpen(false);
            }}
            open={open}
            onToggle={() => setOpen((current) => !current)}
          />

          <Text style={styles.fieldLabel}>Not (opsiyonel)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ör. yıl dönümü"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Not"
          />

          <Text style={styles.hint}>
            Hediyenin etkisi anında uygulanır — süre uzatması bitiş tarihine, seans hediyesi
            bakiyeye işler.
          </Text>

          <Pressable
            onPress={() => templateId && onSubmit(templateId, note.trim() || null)}
            disabled={templateId === null || busy}
            accessibilityRole="button"
            accessibilityLabel="Hediyeyi ver"
            style={({ pressed }) => [
              styles.submitButton,
              (templateId === null || busy) && styles.submitDisabled,
              pressed && styles.submitPressed,
            ]}
          >
            <Text style={styles.submitLabel}>{busy ? 'İşleniyor…' : 'Ver'}</Text>
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
  grantButton: {
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
  grantPressed: {
    backgroundColor: colors.pageBackground,
  },
  grantLabel: {
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
  remaining: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
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

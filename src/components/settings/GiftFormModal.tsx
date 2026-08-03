import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import type { GiftEffectType, GiftTemplateEntry } from '@/api/catalogs';

export interface GiftDraft {
  name: string;
  effectType: GiftEffectType;
  effectAmount: number;
  description: string | null;
}

interface GiftFormModalProps {
  visible: boolean;
  editing: GiftTemplateEntry | null;
  onSubmit: (draft: GiftDraft) => Promise<void>;
  onClose: () => void;
  busy: boolean;
}

/**
 * What each effect does, and what its amount is counted in.
 *
 * The unit is part of the option rather than a separate field, because "3" means nothing without
 * it — and the panel's free-text description is exactly what happens when the unit lives only in a
 * sentence.
 */
const EFFECTS: {
  id: GiftEffectType;
  label: string;
  unit: string;
  hint: string;
}[] = [
  {
    id: 'ExtendDays',
    label: 'Süre uzatır',
    unit: 'gün',
    hint: 'Üyeliğin bitiş tarihine gün ekler.',
  },
  {
    id: 'AddSessions',
    label: 'Seans ekler',
    unit: 'seans',
    hint: 'Üyenin seans bakiyesine eklenir.',
  },
  {
    id: 'FreeSession',
    label: 'Ücretsiz seans',
    unit: 'seans',
    hint: 'Bakiyeden düşmeyen, ücretsiz seans hakkı.',
  },
];

/**
 * Creates or edits a gift template.
 *
 * <b>The effect is structured.</b> The panel stored it as prose — "Üyeliğin bitiş tarihine 1 ay
 * ekler" — which no code can act on, so granting a gift changed a list and nothing else. A member
 * who was given three sessions still had the balance they started with, and nobody would notice
 * until they tried to book.
 *
 * So the studio picks what it does and how much, and Phase 2.2 applies it. The description stays
 * as a note the studio writes for itself; nothing reads it.
 */
export function GiftFormModal({ visible, editing, onSubmit, onClose, busy }: GiftFormModalProps) {
  // Seeded once, at mount — the parent mounts this only while open and keys it by the entry being
  // edited, so it remounts with the right values instead of an effect re-seeding them.
  const [name, setName] = useState(editing?.name ?? '');
  const [effectType, setEffectType] = useState<GiftEffectType>(
    editing?.effectType ?? 'AddSessions',
  );
  const [amount, setAmount] = useState(
    editing?.effectAmount != null ? String(editing.effectAmount) : '',
  );
  const [description, setDescription] = useState(editing?.description ?? '');
  const [effectOpen, setEffectOpen] = useState(false);

  const effect = EFFECTS.find((option) => option.id === effectType) ?? EFFECTS[1];
  const parsedAmount = Number.parseInt(amount, 10);

  const canSubmit = name.trim().length > 0 && Number.isInteger(parsedAmount) && parsedAmount > 0;

  const submit = () => {
    if (!canSubmit || busy) return;

    void onSubmit({
      name: name.trim(),
      effectType,
      effectAmount: parsedAmount,
      description: description.trim() || null,
    });
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
            <Text style={styles.title}>{editing ? 'Hediyeyi Düzenle' : 'Yeni Hediye'}</Text>
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

          <Text style={styles.fieldLabel}>Hediye Adı</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ör. 3 Seans Hediye"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Hediye Adı"
          />

          <Text style={styles.fieldLabel}>Ne yapar?</Text>
          <DropdownSelect
            placeholder="Etki seç"
            options={EFFECTS.map((option) => ({
              id: option.id,
              label: option.label,
            }))}
            selectedId={effectType}
            onSelect={(id) => {
              if (id) setEffectType(id as GiftEffectType);
              setEffectOpen(false);
            }}
            open={effectOpen}
            onToggle={() => setEffectOpen((current) => !current)}
          />
          <Text style={styles.hint}>{effect.hint}</Text>

          <Text style={styles.fieldLabel}>Miktar ({effect.unit})</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="3"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel="Miktar"
          />

          <Text style={styles.fieldLabel}>Açıklama (opsiyonel)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Kendi notun. Hediyeyi bu metin değil, yukarıdaki etki belirler."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={2}
            style={[styles.input, styles.multiline]}
            accessibilityLabel="Açıklama"
          />

          <Pressable
            onPress={submit}
            disabled={!canSubmit || busy}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Hediyeyi kaydet' : 'Hediyeyi oluştur'}
            style={({ pressed }) => [
              styles.submitButton,
              (!canSubmit || busy) && styles.submitButtonDisabled,
              pressed && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>
              {busy ? 'Kaydediliyor…' : editing ? 'Kaydet' : 'Oluştur'}
            </Text>
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
    padding: spacing.lg,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.cardBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
    height: 72,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  submitButton: {
    height: 44,
    marginTop: spacing.md,
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

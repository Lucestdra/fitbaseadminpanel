import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { PackageTemplateEntry } from '@/api/catalogs';

export interface PackageDraft {
  name: string;
  price: number;
  sessionCount: number | null;
  durationDays: number;
}

interface PackageFormModalProps {
  visible: boolean;

  /** The entry being edited, or null to create one. */
  editing: PackageTemplateEntry | null;

  onSubmit: (draft: PackageDraft) => Promise<void>;
  onClose: () => void;
  busy: boolean;
}

/**
 * Creates or edits a package template.
 *
 * <b>One modal for both</b>, because the panel had a create form and an "Düzenle" button that
 * showed a toast saying editing would arrive later. A studio that cannot correct a price it typed
 * wrong has to delete the package and make a new one — losing the entry every membership already
 * sold points at.
 *
 * <b>Price is a number.</b> The old form built a string — <c>₺{amount.toLocaleString('tr-TR')}</c>
 * — and the payment screen parsed it back by stripping non-digits, which reads ₺2.400,50 as
 * 240050. Formatting is the client's job at render time and nowhere else.
 *
 * <b>Blank session count means unlimited</b>, which is a real package shape ("Gold Paket"), not
 * missing input. Zero is refused by the server, because a package nobody can ever book against
 * looks like a data problem rather than a configuration one.
 */
export function PackageFormModal({
  visible,
  editing,
  onSubmit,
  onClose,
  busy,
}: PackageFormModalProps) {
  // Seeded once, at mount. <b>The parent mounts this only while it is open and keys it by the
  // entry being edited</b>, so switching from "Gold" to "Premium" remounts with Premium's values
  // rather than needing an effect to re-seed — which is React's own answer to resetting state on a
  // prop change, and avoids the extra render an effect would cost.
  const [name, setName] = useState(editing?.name ?? '');
  const [price, setPrice] = useState(editing?.price != null ? String(editing.price) : '');
  const [sessionCount, setSessionCount] = useState(
    editing?.sessionCount != null ? String(editing.sessionCount) : '',
  );
  const [durationDays, setDurationDays] = useState(
    editing?.durationDays != null ? String(editing.durationDays) : '30',
  );

  const parsedPrice = Number(price.replace(',', '.'));
  const parsedDuration = Number.parseInt(durationDays, 10);
  const parsedSessions = sessionCount.trim() === '' ? null : Number.parseInt(sessionCount, 10);

  const canSubmit =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    Number.isFinite(parsedPrice) &&
    parsedPrice >= 0 &&
    Number.isInteger(parsedDuration) &&
    parsedDuration > 0 &&
    (parsedSessions === null || (Number.isInteger(parsedSessions) && parsedSessions > 0));

  const submit = () => {
    if (!canSubmit || busy) return;

    void onSubmit({
      name: name.trim(),
      price: parsedPrice,
      sessionCount: parsedSessions,
      durationDays: parsedDuration,
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
            <Text style={styles.title}>{editing ? 'Paketi Düzenle' : 'Yeni Paket'}</Text>
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

          <Text style={styles.fieldLabel}>Paket Adı</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ör. Gold Paket"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Paket Adı"
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Fiyat (₺)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="2400"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={styles.input}
                accessibilityLabel="Fiyat"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.fieldLabel}>Seans Sayısı</Text>
              <TextInput
                value={sessionCount}
                onChangeText={setSessionCount}
                placeholder="Sınırsız"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={styles.input}
                accessibilityLabel="Seans Sayısı"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Süre (gün)</Text>
          <TextInput
            value={durationDays}
            onChangeText={setDurationDays}
            placeholder="30"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel="Süre"
          />

          {editing ? (
            <Text style={styles.notice}>
              Bu paketle daha önce satılan üyelikler kendi koşullarını korur. Değişiklik yalnızca
              bundan sonra satılacaklar için geçerlidir.
            </Text>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={!canSubmit || busy}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Paketi kaydet' : 'Paketi oluştur'}
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
    gap: spacing.sm,
  },
  notice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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

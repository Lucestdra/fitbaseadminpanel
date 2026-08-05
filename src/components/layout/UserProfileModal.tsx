import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { initialsOf } from '@/utils/name';
import type { AuthUser } from '@/types/auth';

interface UserProfileModalProps {
  visible: boolean;
  user: AuthUser;
  roleLabel: string;
  onClose: () => void;
  /** Saves the name to the server and refreshes the session. Throws to be shown in the form. */
  onSave: (fullName: string) => Promise<void>;
}

/**
 * The caller's own profile.
 *
 * <b>Save reaches a server now.</b> Until this commit it wrote to `useState`: the name changed on
 * screen, changed nothing anywhere else, and reverted on the next reload.
 *
 * <b>Email and role are shown and not editable, for two different reasons.</b> Changing the address
 * somebody signs in with has to prove they still hold the new one — a verification flow, not a
 * field on a form, and a form that offered it would let somebody lock themselves out with a typo.
 * A role is changed by a colleague through the Ekip screen, because a caller who could set their
 * own would grant themselves the manager matrix in one request.
 */
export function UserProfileModal({ visible, user, roleLabel, onClose, onSave }: UserProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const changed = trimmed.length > 0 && trimmed !== user.name;

  const handleClose = () => {
    setName(user.name);
    setSubmitting(false);
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    if (!changed || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSave(trimmed);
      handleClose();
    } catch (cause) {
      // The form stays open holding what was typed. A name the server refuses as too long is
      // recoverable, and closing would make them retype it to find out why.
      setSubmitting(false);
      setError(cause instanceof Error ? cause.message : 'Değişiklik kaydedilemedi.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Avatar initials={initialsOf(trimmed || user.name)} size={44} />
              <View style={styles.headerTextGroup}>
                <Text style={styles.title} numberOfLines={1}>{trimmed || user.name}</Text>
                <Text style={styles.roleLabel}>{roleLabel}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>Ad Soyad</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            accessibilityLabel="Ad Soyad"
          />

          <Text style={styles.fieldLabel}>E-posta</Text>
          {/* Read-only, and said out loud. Changing a sign-in address needs to prove the new one
              is held; an editable box here would be one somebody could lock themselves out with. */}
          <View style={styles.roleField}>
            <Text style={styles.roleFieldText} numberOfLines={1}>{user.email}</Text>
          </View>
          <Text style={styles.hint}>
            E-posta adresini değiştirmek için stüdyo yöneticinle iletişime geç.
          </Text>

          <Text style={styles.fieldLabel}>Rol</Text>
          <View style={styles.roleField}>
            <Text style={styles.roleFieldText}>{roleLabel}</Text>
          </View>
          <Text style={styles.hint}>Rolünü ancak başka bir yönetici değiştirebilir.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => void handleSave()}
            disabled={!changed || submitting}
            accessibilityRole="button"
            accessibilityLabel="Değişiklikleri kaydet"
            style={({ pressed }) => [
              styles.submitButton,
              (!changed || submitting) && styles.submitButtonDisabled,
              pressed && changed && !submitting && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>{submitting ? 'Kaydediliyor…' : 'Kaydet'}</Text>
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
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: 400,
    maxWidth: '90%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.critical,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  roleLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 28,
    height: 28,
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
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  roleField: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  roleFieldText: {
    ...typography.body,
    color: colors.textSecondary,
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
    backgroundColor: colors.border,
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});

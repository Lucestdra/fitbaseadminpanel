import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { AuthUser } from '@/types/auth';

interface UserProfileModalProps {
  visible: boolean;
  user: AuthUser;
  roleLabel: string;
  onClose: () => void;
  onSave: (user: AuthUser) => void;
}

export function UserProfileModal({ visible, user, roleLabel, onClose, onSave }: UserProfileModalProps) {
  const [draft, setDraft] = useState<AuthUser>(user);

  const handleClose = () => {
    setDraft(user);
    onClose();
  };

  const handleSave = () => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) return;
    const initials = trimmedName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toLocaleUpperCase('tr');
    onSave({ ...draft, name: trimmedName, avatarInitials: initials });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Avatar initials={draft.avatarInitials} size={44} />
              <View style={styles.headerTextGroup}>
                <Text style={styles.title} numberOfLines={1}>{draft.name}</Text>
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
            value={draft.name}
            onChangeText={(value) => setDraft({ ...draft, name: value })}
            style={styles.input}
            accessibilityLabel="Ad Soyad"
          />

          <Text style={styles.fieldLabel}>E-posta</Text>
          <TextInput
            value={draft.email}
            onChangeText={(value) => setDraft({ ...draft, email: value })}
            placeholder="ornek@eposta.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            accessibilityLabel="E-posta"
          />

          <Text style={styles.fieldLabel}>Rol</Text>
          <View style={styles.roleField}>
            <Text style={styles.roleFieldText}>{roleLabel}</Text>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!draft.name.trim()}
            accessibilityRole="button"
            accessibilityLabel="Değişiklikleri kaydet"
            style={({ pressed }) => [
              styles.submitButton,
              !draft.name.trim() && styles.submitButtonDisabled,
              pressed && !!draft.name.trim() && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>Kaydet</Text>
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

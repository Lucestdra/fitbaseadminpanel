import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { ROLE_META } from '@/utils/staff';
import type { InviteStaffMemberBody, StaffRole } from '@/api/staff';

interface InviteStaffMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (body: InviteStaffMemberBody) => Promise<void>;
}

const ROLE_OPTIONS = (Object.keys(ROLE_META) as StaffRole[]).map((role) => ({
  id: role,
  label: ROLE_META[role].label,
}));

/**
 * Invites somebody onto the roster.
 *
 * <b>An invitation, not a row.</b> The panel's version built a team member in local state with a
 * `Date.now()` id — never emailed, never persisted, gone on refresh, and unable to sign in. This
 * sends the invitation the server owns; the person appears on the roster at once, marked
 * "Davet Bekliyor", and becomes active when they accept.
 *
 * <b>Speciality is gone.</b> `staff_member` has no such column and inventing one in the client
 * would produce a field that survives until the next reload.
 */
export function InviteStaffMemberModal({ visible, onClose, onInvite }: InviteStaffMemberModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('Coach');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !submitting;

  const resetState = () => {
    setName('');
    setRole('Coach');
    setEmail('');
    setPhone('');
    setRoleDropdownOpen(false);
    setSubmitting(false);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await onInvite({
        fullName: name.trim(),
        email: email.trim(),
        role,
        phoneNumber: phone.trim() || null,
      });

      handleClose();
    } catch (cause) {
      // The modal stays open holding what was typed. A duplicate email is the common refusal and
      // it is recoverable — closing on failure would make them type it all again to find out.
      setSubmitting(false);
      setError(cause instanceof Error ? cause.message : 'Davet gönderilemedi.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Ekibe Davet Et</Text>
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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Ad Soyad</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ör. Ece Yıldız"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Ad Soyad"
            />

            <Text style={styles.fieldLabel}>Rol</Text>
            <DropdownSelect
              placeholder="Rol seç"
              options={ROLE_OPTIONS.map((option) => ({ id: option.id, label: option.label }))}
              selectedId={role}
              onSelect={(id) => {
                setRole((id as StaffRole) ?? 'Coach');
                setRoleDropdownOpen(false);
              }}
              open={roleDropdownOpen}
              onToggle={() => setRoleDropdownOpen((current) => !current)}
            />

            <Text style={styles.fieldLabel}>E-posta</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@fitbase.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="E-posta"
            />

            <Text style={styles.fieldLabel}>Cep Telefonu (opsiyonel)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+90 5xx xxx xx xx"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              style={styles.input}
              accessibilityLabel="Cep Telefonu"
            />
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => void handleSubmit()}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Daveti gönder"
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>{submitting ? 'Gönderiliyor…' : 'Davet Gönder'}</Text>
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
    maxHeight: '85%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
  body: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.critical,
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
  submitButton: {
    height: 44,
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

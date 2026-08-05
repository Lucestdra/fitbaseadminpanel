import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { ROLE_META, STATUS_META } from '@/utils/staff';
import type {
  StaffMemberSummary,
  StaffRole,
  StaffStatus,
  UpdateStaffMemberBody,
} from '@/api/staff';

interface EditStaffMemberModalProps {
  member: StaffMemberSummary | null;
  onClose: () => void;
  onSave: (staffMemberId: string, body: UpdateStaffMemberBody) => Promise<void>;
}

const ROLE_OPTIONS = (Object.keys(ROLE_META) as StaffRole[]).map((role) => ({
  id: role,
  label: ROLE_META[role].label,
}));

/**
 * Assignable statuses.
 *
 * <b>`Invited` is absent.</b> It is a state the invitation flow owns — set when an invitation is
 * issued, cleared when it is accepted — and the server refuses it with
 * `organizations.staff.status_not_assignable`. Offering it here would be offering a button whose
 * only outcome is an error.
 */
const STATUS_OPTIONS = (['Active', 'OnLeave', 'Inactive'] as StaffStatus[]).map((status) => ({
  id: status,
  label: STATUS_META[status].label,
}));

/**
 * Changes what somebody is.
 *
 * <b>The refusals are the server's and are shown, not pre-empted.</b> This form does not try to
 * work out whether the caller is editing themselves, or whether the row is the owner's — those are
 * four distinct rules with four distinct codes, and a client that guessed at them would be a second
 * implementation that drifts. It sends the change and renders whichever sentence comes back.
 *
 * The one thing it does withhold is `Invited`, because that is not a rule about the caller — the
 * value is simply not assignable by anyone.
 */
export function EditStaffMemberModal({ member, onClose, onSave }: EditStaffMemberModalProps) {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [status, setStatus] = useState<StaffStatus | null>(null);
  const [openDropdown, setOpenDropdown] = useState<'role' | 'status' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (member === null) return null;

  const selectedRole = role ?? member.role;
  const selectedStatus = status ?? member.status;
  const changed = selectedRole !== member.role || selectedStatus !== member.status;

  const handleClose = () => {
    setRole(null);
    setStatus(null);
    setOpenDropdown(null);
    setSubmitting(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!changed || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Only what actually moved. The server treats an omitted field as "leave it", so a form that
      // sent both would reassert whichever one the studio had not touched.
      await onSave(member.id, {
        role: selectedRole === member.role ? null : selectedRole,
        status: selectedStatus === member.status ? null : selectedStatus,
      });

      handleClose();
    } catch (cause) {
      setSubmitting(false);
      setError(cause instanceof Error ? cause.message : 'Değişiklik kaydedilemedi.');
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />

        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {member.fullName}
            </Text>
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

          <Text style={styles.fieldLabel}>Rol</Text>
          <DropdownSelect
            placeholder="Rol seç"
            options={ROLE_OPTIONS}
            selectedId={selectedRole}
            onSelect={(id) => {
              setRole((id as StaffRole) ?? member.role);
              setOpenDropdown(null);
            }}
            open={openDropdown === 'role'}
            onToggle={() => setOpenDropdown((current) => (current === 'role' ? null : 'role'))}
          />

          <Text style={styles.fieldLabel}>Durum</Text>
          <DropdownSelect
            placeholder="Durum seç"
            options={STATUS_OPTIONS}
            selectedId={selectedStatus}
            onSelect={(id) => {
              setStatus((id as StaffStatus) ?? member.status);
              setOpenDropdown(null);
            }}
            open={openDropdown === 'status'}
            onToggle={() => setOpenDropdown((current) => (current === 'status' ? null : 'status'))}
          />

          {/* A role change signs the person out of their current token on their next request
              (ADR-0018). Worth saying: a manager who does not expect it reads it as a bug. */}
          {selectedRole !== member.role ? (
            <Text style={styles.hint}>
              Rol değişince bu kişinin oturumu yenilenir ve yeni yetkileri hemen geçerli olur.
            </Text>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => void handleSubmit()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
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
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.critical,
    marginTop: spacing.sm,
  },
  submitButton: {
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
});

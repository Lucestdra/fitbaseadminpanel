import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import type { TeamMember, TeamRole, TeamStatus } from '@/types/team';

interface TeamMemberDetailModalProps {
  visible: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
}

const ROLE_OPTIONS: { id: TeamRole; label: string }[] = [
  { id: 'yonetici', label: 'Yönetici' },
  { id: 'egitmen', label: 'Eğitmen' },
  { id: 'satis', label: 'Satış' },
];

const STATUS_OPTIONS: { id: TeamStatus; label: string }[] = [
  { id: 'aktif', label: 'Aktif' },
  { id: 'izinli', label: 'İzinli' },
  { id: 'pasif', label: 'Pasif' },
];

type DropdownField = 'role' | 'status' | null;

export function TeamMemberDetailModal({ visible, member, onClose, onSave }: TeamMemberDetailModalProps) {
  const [draft, setDraft] = useState<TeamMember | null>(member);
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);

  if (!draft) return null;

  const handleClose = () => {
    setOpenDropdown(null);
    onClose();
  };

  const handleSave = () => {
    onSave(draft);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Avatar initials={draft.avatarInitials} size={40} />
              <Text style={styles.title} numberOfLines={1}>{draft.name}</Text>
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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Ad Soyad</Text>
            <TextInput
              value={draft.name}
              onChangeText={(value) => setDraft({ ...draft, name: value })}
              style={styles.input}
              accessibilityLabel="Ad Soyad"
            />

            <Text style={styles.fieldLabel}>Rol</Text>
            <DropdownSelect
              placeholder="Rol seç"
              options={ROLE_OPTIONS.map((option) => ({ id: option.id, label: option.label }))}
              selectedId={draft.role}
              onSelect={(id) => {
                setDraft({ ...draft, role: (id as TeamRole) ?? draft.role });
                setOpenDropdown(null);
              }}
              open={openDropdown === 'role'}
              onToggle={() => setOpenDropdown((current) => (current === 'role' ? null : 'role'))}
            />

            <Text style={styles.fieldLabel}>Uzmanlık</Text>
            <TextInput
              value={draft.specialty ?? ''}
              onChangeText={(value) => setDraft({ ...draft, specialty: value || null })}
              placeholder="Ör. Reformer Pilates"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Uzmanlık"
            />

            <Text style={styles.fieldLabel}>E-posta</Text>
            <TextInput
              value={draft.email}
              onChangeText={(value) => setDraft({ ...draft, email: value })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="E-posta"
            />

            <Text style={styles.fieldLabel}>Cep Telefonu</Text>
            <TextInput
              value={draft.phone}
              onChangeText={(value) => setDraft({ ...draft, phone: value })}
              keyboardType="phone-pad"
              style={styles.input}
              accessibilityLabel="Cep Telefonu"
            />

            <Text style={styles.fieldLabel}>Durum</Text>
            <DropdownSelect
              placeholder="Durum seç"
              options={STATUS_OPTIONS.map((option) => ({ id: option.id, label: option.label }))}
              selectedId={draft.status}
              onSelect={(id) => {
                setDraft({ ...draft, status: (id as TeamStatus) ?? draft.status });
                setOpenDropdown(null);
              }}
              open={openDropdown === 'status'}
              onToggle={() => setOpenDropdown((current) => (current === 'status' ? null : 'status'))}
            />
          </ScrollView>

          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Değişiklikleri kaydet"
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
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
    width: 420,
    maxWidth: '90%',
    maxHeight: '88%',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
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
  body: {
    gap: spacing.sm,
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
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});

import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import type { TeamRole } from '@/types/team';

export interface NewTeamMemberInput {
  name: string;
  role: TeamRole;
  specialty: string;
  email: string;
  phone: string;
}

interface NewTeamMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: NewTeamMemberInput) => void;
}

const ROLE_OPTIONS: { id: TeamRole; label: string }[] = [
  { id: 'yonetici', label: 'Yönetici' },
  { id: 'egitmen', label: 'Eğitmen' },
  { id: 'satis', label: 'Satış' },
];

export function NewTeamMemberModal({ visible, onClose, onCreate }: NewTeamMemberModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<TeamRole>('egitmen');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  const resetState = () => {
    setName('');
    setRole('egitmen');
    setSpecialty('');
    setEmail('');
    setPhone('');
    setRoleDropdownOpen(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({ name: name.trim(), role, specialty: specialty.trim(), email: email.trim(), phone: phone.trim() });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Ekip Üyesi</Text>
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
                setRole((id as TeamRole) ?? 'egitmen');
                setRoleDropdownOpen(false);
              }}
              open={roleDropdownOpen}
              onToggle={() => setRoleDropdownOpen((current) => !current)}
            />

            <Text style={styles.fieldLabel}>Uzmanlık (opsiyonel)</Text>
            <TextInput
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="Ör. Reformer Pilates"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Uzmanlık"
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

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Ekip üyesini kaydet"
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.submitButtonPressed,
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

import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { responsibleOptions } from '@/mock/settings';
import { useCatalogs } from '@/context/CatalogsContext';
import type { Lead, LeadSource } from '@/types/leads';

interface NewLeadModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (lead: Omit<Lead, 'id' | 'stage' | 'statusLabel' | 'dateLabel' | 'notes'> & { note?: string }) => void;
}

type DropdownField = 'source' | 'interest' | 'trainer' | null;

export function NewLeadModal({ visible, onClose, onCreate }: NewLeadModalProps) {
  const { leadSources, interests } = useCatalogs();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [source, setSource] = useState<LeadSource>(leadSources[0]?.id ?? '');
  const [interest, setInterest] = useState(interests[0]?.label ?? '');
  const [trainer, setTrainer] = useState(responsibleOptions[0] ?? '');
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);

  const canSubmit = name.trim().length > 0;

  const handleClose = () => {
    setName('');
    setPhone('');
    setEmail('');
    setNote('');
    setSource(leadSources[0]?.id ?? '');
    setInterest(interests[0]?.label ?? '');
    setTrainer(responsibleOptions[0] ?? '');
    setOpenDropdown(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      source,
      interest,
      assignedTrainer: trainer,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      note: note.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Müşteri Adayı</Text>
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
              placeholder="Ör. Zeynep Arslan"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Ad Soyad"
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

            <Text style={styles.fieldLabel}>E-posta (opsiyonel)</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@eposta.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="E-posta"
            />

            <Text style={styles.fieldLabel}>Kaynak</Text>
            <DropdownSelect
              placeholder="Kaynak seç"
              options={leadSources.map((option) => ({ id: option.id, label: option.label }))}
              selectedId={source || null}
              onSelect={(id) => {
                setSource(id ?? '');
                setOpenDropdown(null);
              }}
              open={openDropdown === 'source'}
              onToggle={() => setOpenDropdown((current) => (current === 'source' ? null : 'source'))}
            />

            <Text style={styles.fieldLabel}>İlgi</Text>
            <DropdownSelect
              placeholder="İlgi alanı seç"
              options={interests.map((option) => ({ id: option.label, label: option.label }))}
              selectedId={interest || null}
              onSelect={(id) => {
                setInterest(id ?? '');
                setOpenDropdown(null);
              }}
              open={openDropdown === 'interest'}
              onToggle={() => setOpenDropdown((current) => (current === 'interest' ? null : 'interest'))}
            />

            <Text style={styles.fieldLabel}>Sorumlu</Text>
            <DropdownSelect
              placeholder="Sorumlu seç"
              options={responsibleOptions.map((option) => ({ id: option, label: option }))}
              selectedId={trainer || null}
              onSelect={(id) => {
                setTrainer(id ?? '');
                setOpenDropdown(null);
              }}
              open={openDropdown === 'trainer'}
              onToggle={() => setOpenDropdown((current) => (current === 'trainer' ? null : 'trainer'))}
            />

            <Text style={styles.fieldLabel}>Not (opsiyonel)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Bu müşteri adayıyla ilgili not ekle..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.noteInput]}
              accessibilityLabel="Not"
            />
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Müşteri adayını kaydet"
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
  noteInput: {
    height: 76,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
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

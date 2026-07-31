import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FormField } from '@/components/ui/FormField';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { studioProfile } from '@/mock/settings';

interface StudioProfileCardProps {
  onSave: () => void;
}

export function StudioProfileCard({ onSave }: StudioProfileCardProps) {
  const [name, setName] = useState(studioProfile.name);
  const [address, setAddress] = useState(studioProfile.address);
  const [phone, setPhone] = useState(studioProfile.phone);
  const [contactPerson, setContactPerson] = useState(studioProfile.contactPerson);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Stüdyo Bilgileri" icon="business-outline" />

      <View style={styles.logoRow}>
        <View style={styles.logoPreview}>
          <AppIcon name="image-outline" size={22} color={colors.textSecondary} />
        </View>
        <View style={styles.logoTextGroup}>
          <Text style={styles.logoTitle}>Stüdyo Logosu</Text>
          <Text style={styles.logoCaption}>PNG veya JPG, en az 256x256px</Text>
        </View>
        <Pressable
          onPress={onSave}
          accessibilityRole="button"
          accessibilityLabel="Logo yükle"
          style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}
        >
          <AppIcon name="cloud-upload-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.uploadLabel}>Yükle</Text>
        </Pressable>
      </View>

      <View style={styles.fieldsRow}>
        <FormField label="Stüdyo Adı" value={name} onChangeText={setName} placeholder="Stüdyo adı" />
        <FormField label="İlgili Kişi" value={contactPerson} onChangeText={setContactPerson} placeholder="İlgili kişi" />
        <FormField label="İletişim Numarası" value={phone} onChangeText={setPhone} placeholder="+90 5xx xxx xx xx" keyboardType="phone-pad" />
        <FormField label="Adres" value={address} onChangeText={setAddress} placeholder="Stüdyo adresi" />
      </View>

      <Pressable
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel="Stüdyo bilgilerini kaydet"
        style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
      >
        <Text style={styles.saveLabel}>Kaydet</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  logoPreview: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextGroup: {
    flex: 1,
    gap: 2,
  },
  logoTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  logoCaption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  uploadButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  uploadLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  fieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  saveButton: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveLabel: {
    ...typography.button,
    color: colors.white,
  },
});

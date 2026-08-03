import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FormField } from '@/components/ui/FormField';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { OrganizationProfile } from '@/api/settings';

interface StudioProfileCardProps {
  profile: OrganizationProfile;

  /** Rejects with an `ApiError` the caller renders. */
  onSave: (draft: {
    name: string;
    address: string | null;
    phoneNumber: string | null;
    contactPersonName: string | null;
  }) => Promise<void>;

  onUploadLogo: () => void;
  busy: boolean;
}

/**
 * The studio's own details.
 *
 * The name here is <b>the</b> studio name. The panel used to keep three copies — this card,
 * `AuthContext` and the nav mock — so renaming the studio changed one of them.
 */
export function StudioProfileCard({ profile, onSave, onUploadLogo, busy }: StudioProfileCardProps) {
  const [name, setName] = useState(profile.name);
  const [address, setAddress] = useState(profile.address ?? '');
  const [phone, setPhone] = useState(profile.phoneNumber ?? '');
  const [contactPerson, setContactPerson] = useState(profile.contactPersonName ?? '');

  const submit = () =>
    void onSave({
      name: name.trim(),

      // Empty means "not set", not "set to an empty string". Sending '' would store a blank
      // address that renders as a present-but-empty line rather than as absent.
      address: address.trim() || null,
      phoneNumber: phone.trim() || null,
      contactPersonName: contactPerson.trim() || null,
    });

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
          onPress={onUploadLogo}
          accessibilityRole="button"
          accessibilityLabel="Logo yükle"
          style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}
        >
          <AppIcon name="cloud-upload-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.uploadLabel}>Yükle</Text>
        </Pressable>
      </View>

      <View style={styles.fieldsRow}>
        <FormField
          label="Stüdyo Adı"
          value={name}
          onChangeText={setName}
          placeholder="Stüdyo adı"
        />
        <FormField
          label="İlgili Kişi"
          value={contactPerson}
          onChangeText={setContactPerson}
          placeholder="İlgili kişi"
        />
        <FormField
          label="İletişim Numarası"
          value={phone}
          onChangeText={setPhone}
          placeholder="+90 5xx xxx xx xx"
          keyboardType="phone-pad"
        />
        <FormField
          label="Adres"
          value={address}
          onChangeText={setAddress}
          placeholder="Stüdyo adresi"
        />
      </View>

      <Pressable
        onPress={submit}
        disabled={busy || name.trim().length === 0}
        accessibilityRole="button"
        accessibilityLabel="Stüdyo bilgilerini kaydet"
        style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
      >
        <Text style={styles.saveLabel}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Text>
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

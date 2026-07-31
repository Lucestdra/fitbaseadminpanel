import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FormField } from '@/components/ui/FormField';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { taxInfo } from '@/mock/settings';

interface TaxBillingCardProps {
  onSave: () => void;
  onUploadDocument: () => void;
}

export function TaxBillingCard({ onSave, onUploadDocument }: TaxBillingCardProps) {
  const [companyTitle, setCompanyTitle] = useState(taxInfo.companyTitle);
  const [taxOffice, setTaxOffice] = useState(taxInfo.taxOffice);
  const [taxNumber, setTaxNumber] = useState(taxInfo.taxNumber);
  const [billingAddress, setBillingAddress] = useState(taxInfo.billingAddress);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Vergi ve Fatura Bilgileri" icon="document-text-outline" />

      <View style={styles.fieldsRow}>
        <FormField label="Şirket Unvanı" value={companyTitle} onChangeText={setCompanyTitle} />
        <FormField label="Vergi Dairesi" value={taxOffice} onChangeText={setTaxOffice} />
        <FormField label="Vergi Numarası" value={taxNumber} onChangeText={setTaxNumber} keyboardType="numeric" />
        <FormField label="Fatura Adresi" value={billingAddress} onChangeText={setBillingAddress} />
      </View>

      <View style={styles.documentRow}>
        <View style={styles.documentIcon}>
          <AppIcon name="document-attach-outline" size={20} color={colors.primaryDark} />
        </View>
        <View style={styles.documentTextGroup}>
          <Text style={styles.documentTitle}>Vergi Levhası</Text>
          <Text style={styles.documentCaption}>
            {taxInfo.documentName ? taxInfo.documentName : 'Henüz dosya yüklenmedi'}
          </Text>
        </View>
        <Pressable
          onPress={onUploadDocument}
          accessibilityRole="button"
          accessibilityLabel="Vergi levhası yükle"
          style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}
        >
          <AppIcon name="cloud-upload-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.uploadLabel}>{taxInfo.documentName ? 'Değiştir' : 'Yükle'}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel="Fatura bilgilerini kaydet"
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
  fieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTextGroup: {
    flex: 1,
    gap: 2,
  },
  documentTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  documentCaption: {
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

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FormField } from '@/components/ui/FormField';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { TaxProfileSummary } from '@/api/settings';

interface TaxBillingCardProps {
  tax: TaxProfileSummary;

  onSave: (draft: {
    companyTitle: string | null;
    taxOffice: string | null;
    taxIdentifier: string | null;
    billingAddress: string | null;
  }) => Promise<void>;

  onUploadDocument: () => void;
  busy: boolean;
}

/**
 * Tax and billing details.
 *
 * <b>The tax number is never loaded.</b> A VKN — or, for a sole trader, an 11-digit TCKN — is
 * special-category data under KVKK, so the server stores it encrypted and answers with its last
 * two digits and a flag. This field therefore starts empty even when one is stored, and the
 * placeholder shows what is on file.
 *
 * That makes it three-valued on save: left blank it sends `null`, meaning "leave the stored one
 * alone", which is what lets somebody correct the company title without erasing a number they were
 * never shown.
 */
export function TaxBillingCard({ tax, onSave, onUploadDocument, busy }: TaxBillingCardProps) {
  const [companyTitle, setCompanyTitle] = useState(tax.companyTitle ?? '');
  const [taxOffice, setTaxOffice] = useState(tax.taxOffice ?? '');
  const [taxNumber, setTaxNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState(tax.billingAddress ?? '');

  const storedHint = tax.hasTaxIdentifier
    ? `Kayıtlı: •••••••• ${tax.taxIdentifierLastDigits}`
    : 'Henüz girilmedi';

  const submit = () =>
    void onSave({
      companyTitle: companyTitle.trim() || null,
      taxOffice: taxOffice.trim() || null,
      taxIdentifier: taxNumber.trim() || null,
      billingAddress: billingAddress.trim() || null,
    });

  return (
    <Card style={styles.card}>
      <SectionHeader title="Vergi ve Fatura Bilgileri" icon="document-text-outline" />

      <View style={styles.fieldsRow}>
        <FormField label="Şirket Unvanı" value={companyTitle} onChangeText={setCompanyTitle} />
        <FormField label="Vergi Dairesi" value={taxOffice} onChangeText={setTaxOffice} />
        <FormField
          label="Vergi Numarası"
          value={taxNumber}
          onChangeText={setTaxNumber}
          placeholder={storedHint}
          keyboardType="numeric"
        />
        <FormField label="Fatura Adresi" value={billingAddress} onChangeText={setBillingAddress} />
      </View>

      <View style={styles.documentRow}>
        <View style={styles.documentIcon}>
          <AppIcon name="document-attach-outline" size={20} color={colors.primaryDark} />
        </View>
        <View style={styles.documentTextGroup}>
          <Text style={styles.documentTitle}>Vergi Levhası</Text>
          <Text style={styles.documentCaption}>
            {tax.certificateObjectKey ? 'Yüklendi' : 'Henüz dosya yüklenmedi'}
          </Text>
        </View>
        <Pressable
          onPress={onUploadDocument}
          accessibilityRole="button"
          accessibilityLabel="Vergi levhası yükle"
          style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}
        >
          <AppIcon name="cloud-upload-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.uploadLabel}>{tax.certificateObjectKey ? 'Değiştir' : 'Yükle'}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={submit}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Fatura bilgilerini kaydet"
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

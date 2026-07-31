import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { LogoMark } from '@/components/ui/LogoMark';
import { useAuth } from '@/context/AuthContext';
import { getLandingRoute } from '@/utils/permissions';
import { colors, radii, spacing, typography, cardShadow } from '@/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [studioName, setStudioName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const canSubmit = studioName.trim().length > 0 && name.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const created = signUp({ studioName, name, email, phone });
    router.replace(getLandingRoute(created.role) as never);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <LogoMark size={30} />
            <Text style={styles.brand}>fitbase</Text>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>Stüdyonu Kaydet</Text>
            <Text style={styles.subtitle}>Hesabını oluştur, stüdyo yöneticisi olarak başla.</Text>
          </View>

          <Text style={styles.fieldLabel}>Stüdyo Adı</Text>
          <TextInput
            value={studioName}
            onChangeText={setStudioName}
            placeholder="Ör. Fitbase Studio"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Stüdyo Adı"
          />

          <Text style={styles.fieldLabel}>Ad Soyad</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ör. Selin Yılmaz"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Ad Soyad"
          />

          <Text style={styles.fieldLabel}>E-posta</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@fitbase.studio"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            accessibilityLabel="E-posta"
          />

          <Text style={styles.fieldLabel}>Cep Telefonu</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+90 5xx xxx xx xx"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            style={styles.input}
            accessibilityLabel="Cep Telefonu"
          />

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Hesabı oluştur"
            style={({ pressed }) => [
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
              pressed && canSubmit && styles.primaryButtonPressed,
            ]}
          >
            <AppIcon name="checkmark-circle-outline" size={17} color={colors.white} />
            <Text style={styles.primaryLabel}>Hesabı Oluştur</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Zaten hesabın var mı?</Text>
            <Pressable
              onPress={() => router.replace('/giris' as never)}
              accessibilityRole="button"
              accessibilityLabel="Giriş yap"
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Giriş yap</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: 420,
    maxWidth: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    ...cardShadow,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  titleGroup: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.pageTitle,
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    height: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 46,
    marginTop: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

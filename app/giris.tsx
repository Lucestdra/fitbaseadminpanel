import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { LogoMark } from '@/components/ui/LogoMark';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import { getLandingRoute } from '@/utils/permissions';
import { colors, radii, spacing, typography, cardShadow } from '@/theme';
import type { TeamRole } from '@/types/team';
import type { IconName } from '@/types/dashboard';

const DEMO_ROLES: { role: TeamRole; label: string; icon: IconName }[] = [
  { role: 'yonetici', label: 'Yönetici', icon: 'shield-checkmark-outline' },
  { role: 'satis', label: 'Satış', icon: 'briefcase-outline' },
  { role: 'egitmen', label: 'Eğitmen', icon: 'body-outline' },
];

export default function SignInScreen() {
  const router = useRouter();
  const { signInWithEmail, signInAsRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { message, visible, show } = useToast();

  const handleEmailSignIn = () => {
    const signedIn = signInWithEmail(email);
    if (!signedIn) {
      show('Bu e-posta ile kayıtlı bir ekip üyesi bulunamadı.');
      return;
    }
    router.replace(getLandingRoute(signedIn.role) as never);
  };

  const handleRoleSignIn = (role: TeamRole) => {
    const signedIn = signInAsRole(role);
    if (!signedIn) {
      show('Bu rolde aktif bir ekip üyesi bulunamadı.');
      return;
    }
    router.replace(getLandingRoute(signedIn.role) as never);
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
            <Text style={styles.title}>Giriş Yap</Text>
            <Text style={styles.subtitle}>Stüdyo panelini yönetmek için hesabına gir.</Text>
          </View>

          <Text style={styles.fieldLabel}>E-posta</Text>
          <View style={styles.inputRow}>
            <AppIcon name="mail-outline" size={16} color={colors.textSecondary} />
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
          </View>

          <Text style={styles.fieldLabel}>Şifre</Text>
          <View style={styles.inputRow}>
            <AppIcon name="lock-closed-outline" size={16} color={colors.textSecondary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={styles.input}
              accessibilityLabel="Şifre"
            />
          </View>

          <Pressable
            onPress={handleEmailSignIn}
            disabled={!email.trim()}
            accessibilityRole="button"
            accessibilityLabel="Giriş yap"
            style={({ pressed }) => [
              styles.primaryButton,
              !email.trim() && styles.primaryButtonDisabled,
              pressed && !!email.trim() && styles.primaryButtonPressed,
            ]}
          >
            <AppIcon name="log-in-outline" size={17} color={colors.white} />
            <Text style={styles.primaryLabel}>Giriş Yap</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>veya demo hesapla dene</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoRow}>
            {DEMO_ROLES.map((item) => (
              <Pressable
                key={item.role}
                onPress={() => handleRoleSignIn(item.role)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} olarak gir`}
                style={({ pressed }) => [styles.demoButton, pressed && styles.demoButtonPressed]}
              >
                <AppIcon name={item.icon} size={16} color={colors.primaryDark} />
                <Text style={styles.demoLabel} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Hesabın yok mu?</Text>
            <Pressable
              onPress={() => router.replace('/kayit' as never)}
              accessibilityRole="button"
              accessibilityLabel="Kayıt ol"
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Stüdyonu kaydet</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Toast message={message} visible={visible} />
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
    marginBottom: spacing.lg,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  demoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mintLight,
  },
  demoButtonPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  demoLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
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

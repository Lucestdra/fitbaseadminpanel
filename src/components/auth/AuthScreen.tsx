import { type ReactNode } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { LogoMark } from '@/components/ui/LogoMark';
import { colors, radii, spacing, typography, cardShadow } from '@/theme';
import type { IconName } from '@/types/dashboard';

/**
 * The shell every unauthenticated screen shares.
 *
 * Extracted because there are now six of them — sign in, register, verify, forgot, reset, accept —
 * and the alternative is the same two hundred lines of StyleSheet copied six times, which is how
 * five of them end up looking subtly different from the sixth.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <LogoMark size={30} />
            <Text style={styles.brand}>fitbase</Text>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secure = false,
  keyboard = 'default',
  autoComplete,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  icon: IconName;
  secure?: boolean;
  keyboard?: 'default' | 'email-address';
  autoComplete?: 'email' | 'current-password' | 'new-password' | 'name' | 'off';
  onSubmitEditing?: () => void;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <AppIcon name={icon} size={16} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secure}
          keyboardType={keyboard}
          autoCapitalize="none"
          autoComplete={autoComplete}
          onSubmitEditing={onSubmitEditing}
          // So a password manager offers to fill and to save. Without it people choose weaker
          // passwords, which is a security property of a form field.
          textContentType={
            autoComplete === 'current-password' || autoComplete === 'new-password'
              ? 'password'
              : autoComplete === 'email'
                ? 'emailAddress'
                : 'none'
          }
          style={styles.input}
          accessibilityLabel={label}
        />
      </View>
    </>
  );
}

export function AuthButton({
  label,
  icon,
  onPress,
  disabled = false,
  busy = false,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const inactive = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [
        styles.primaryButton,
        inactive && styles.primaryButtonDisabled,
        pressed && !inactive && styles.primaryButtonPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <AppIcon name={icon} size={17} color={colors.white} />
      )}
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

/** A checkbox with a label. Used for the KVKK acknowledgement, which cannot be pre-ticked. */
export function AuthCheckbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkboxRow}
      hitSlop={6}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <AppIcon name="checkmark-outline" size={13} color={colors.white} /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

/** An inline message. `tone` decides whether it reads as a refusal or as a confirmation. */
export function AuthNotice({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  return (
    <View style={[styles.notice, tone === 'error' ? styles.noticeError : styles.noticeSuccess]}>
      <AppIcon
        name={tone === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={16}
        color={tone === 'error' ? colors.critical : colors.primaryDark}
      />
      <Text
        style={[
          styles.noticeText,
          { color: tone === 'error' ? colors.critical : colors.primaryDark },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

export function AuthFooterLink({
  text,
  linkLabel,
  onPress,
}: {
  text: string;
  linkLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>{text}</Text>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={linkLabel} hitSlop={8}>
        <Text style={styles.footerLink}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBackground },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
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
  brand: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  titleGroup: { gap: 4, marginBottom: spacing.lg },
  title: { ...typography.pageTitle, fontSize: 24, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary },
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
  primaryButtonDisabled: { backgroundColor: colors.border },
  primaryButtonPressed: { backgroundColor: colors.primaryDark },
  primaryLabel: { ...typography.button, color: colors.white },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pageBackground,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  noticeError: { borderColor: colors.critical, backgroundColor: colors.criticalLight },
  noticeSuccess: { borderColor: colors.primary, backgroundColor: colors.mintLight },
  noticeText: { ...typography.caption, flex: 1, lineHeight: 18 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    flexWrap: 'wrap',
  },
  footerText: { ...typography.caption, color: colors.textSecondary },
  footerLink: { ...typography.caption, fontWeight: '700', color: colors.primaryDark },
});

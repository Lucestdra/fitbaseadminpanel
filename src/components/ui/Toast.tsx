import { useEffect, useState } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, Easing } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToastStack, type ToastEntry, type ToastTone } from '@/context/ToastContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, radii, spacing, typography, cardShadow } from '@/theme';
import type { IconName } from '@/types/dashboard';

const TONE_ICON: Record<ToastTone, IconName> = {
  neutral: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  critical: 'alert-circle-outline',
};

const TONE_COLOR: Record<ToastTone, string> = {
  neutral: colors.white,
  success: colors.primary,
  critical: colors.critical,
};

/**
 * Where notices appear: bottom-right, small, one line where possible.
 *
 * <b>Replaces a full-width band across the bottom of the screen.</b> "Takvime eklendi" is an
 * acknowledgement, not an alert — it does not need the width of the window, and taking it made
 * every confirmation feel like an interruption.
 *
 * The container does not take touches (`box-none`), so a notice sitting over a button never
 * swallows the press; the notice itself does, to dismiss early.
 */
export function ToastViewport() {
  const { toasts, dismiss } = useToastStack();
  const { isMobile } = useResponsiveLayout();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.viewport, isMobile && styles.viewportMobile]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </View>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastEntry; onDismiss: () => void }) {
  // `useState` rather than `useRef`: the value is read while rendering (it drives the style), and
  // a ref read during render is what the refs lint rule is about.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={`${toast.message} — kapat`}
        style={styles.pressable}
      >
        <AppIcon name={TONE_ICON[toast.tone]} size={16} color={TONE_COLOR[toast.tone]} />
        <Text style={styles.text} numberOfLines={3}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    alignItems: 'flex-end',
    gap: spacing.sm,
    // Above the sidebar and any sheet that shares the screen, below a Modal — a notice raised from
    // inside a dialog is about the dialog and does not need to escape it.
    zIndex: 50,
  },
  viewportMobile: {
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    alignItems: 'stretch',
  },
  card: {
    maxWidth: 360,
    borderRadius: radii.md,
    backgroundColor: colors.textPrimary,
    ...cardShadow,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  text: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.white,
    flexShrink: 1,
  },
});

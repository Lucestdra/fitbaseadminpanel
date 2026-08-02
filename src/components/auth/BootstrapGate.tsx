import { type ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LogoMark } from '@/components/ui/LogoMark';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';

/**
 * Holds the tree until the app knows whether anybody is signed in.
 *
 * <b>There was nothing like this before</b>, because there was nothing to wait for: the mock
 * `AuthProvider` started with `user = null` and every screen could decide immediately. A real
 * session is not known immediately — on web the refresh cookie has to be exchanged, on native the
 * handle has to come out of SecureStore — so without this gate every cold start renders the
 * sign-in screen for a moment and then replaces it, for somebody who was signed in the whole time.
 *
 * It blocks on `loading` only. `signedOut` renders the tree normally, because the sign-in and
 * invitation screens are part of the tree and have to be reachable.
 */
export function BootstrapGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status !== 'loading') {
    return <>{children}</>;
  }

  return (
    <View style={styles.root}>
      <LogoMark size={44} />
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.pageBackground,
  },
});

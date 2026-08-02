import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthScreen,
} from '@/components/auth/AuthScreen';
import { useAuth } from '@/context/AuthContext';
import { ApiError, ProblemCode, describeProblem } from '@/api/problem';
import * as api from '@/api/session';

/**
 * Sign in.
 *
 * <b>The three demo buttons are gone.</b> They called `signInAsRole`, which took a role and
 * returned a session for the first mock team member holding it — no password, no server, no
 * account. Anybody who reached this page could become a manager. It read as a convenience because
 * the data behind it was mock; it was unauthenticated role escalation, and it is why this screen
 * was the first one migrated.
 *
 * The password field was already here and was already ignored: `signInWithEmail` looked the
 * address up in a mock array and never read the password at all.
 */
export default function SignInScreen() {
  const router = useRouter();
  const { signIn, landingRoute } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = () => {
    if (!canSubmit || busy) return;

    setBusy(true);
    setError(null);
    setUnverified(false);

    void (async () => {
      try {
        await signIn(email.trim(), password);

        // The server decided where this person lands, from the permissions it just resolved. The
        // panel no longer has an opinion, so a change to the matrix moves people without a
        // release.
        router.replace(landingRoute as never);
      } catch (thrown) {
        if (thrown instanceof ApiError) {
          // The one refusal with a remedy on this screen: an unverified address needs a new link,
          // not a different password. Everything else — wrong password, unknown address, locked
          // account — is a message and nothing more, deliberately: the server answers all three
          // the same way so that this form cannot be used to discover who has an account.
          setUnverified(thrown.code === ProblemCode.EmailUnverified);
          setError(describeProblem(thrown.problem));
        } else {
          setError('Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.');
        }
      } finally {
        setBusy(false);
      }
    })();
  };

  const handleResend = () => {
    void (async () => {
      await api.resendVerification(email.trim());
      router.push({ pathname: '/dogrulama', params: { sent: '1' } } as never);
    })();
  };

  return (
    <AuthScreen title="Giriş Yap" subtitle="Stüdyo panelini yönetmek için hesabına gir.">
      <AuthField
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@fitbase.studio"
        icon="mail-outline"
        keyboard="email-address"
        autoComplete="email"
      />

      <AuthField
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        icon="lock-closed-outline"
        secure
        autoComplete="current-password"
        onSubmitEditing={handleSubmit}
      />

      {error ? <AuthNotice tone="error" message={error} /> : null}

      <AuthButton
        label="Giriş Yap"
        icon="log-in-outline"
        onPress={handleSubmit}
        disabled={!canSubmit}
        busy={busy}
      />

      {unverified ? (
        <AuthFooterLink
          text="Doğrulama e-postası gelmedi mi?"
          linkLabel="Yeniden gönder"
          onPress={handleResend}
        />
      ) : (
        <AuthFooterLink
          text="Şifreni mi unuttun?"
          linkLabel="Sıfırla"
          onPress={() => router.push('/sifremi-unuttum' as never)}
        />
      )}

      <AuthFooterLink
        text="Hesabın yok mu?"
        linkLabel="Stüdyonu kaydet"
        onPress={() => router.replace('/kayit' as never)}
      />
    </AuthScreen>
  );
}

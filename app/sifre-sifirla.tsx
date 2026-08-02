import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthScreen,
} from '@/components/auth/AuthScreen';
import { ApiError, describeProblem } from '@/api/problem';
import * as api from '@/api/session';

/**
 * Set a new password from a reset link.
 *
 * A successful reset revokes <b>every</b> session on the account, including any this browser
 * held — that is the point of a reset, and it is why this screen ends at sign-in rather than
 * signing anybody in. Saying so on the confirmation matters: somebody resetting from a laptop
 * because they lost a phone needs to know the phone is now signed out.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : null;

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const mismatched = confirmation.length > 0 && confirmation !== password;
  const canSubmit = token !== null && password.length > 0 && confirmation === password;

  const handleSubmit = () => {
    if (!canSubmit || busy || token === null) return;

    setBusy(true);
    setError(null);

    void (async () => {
      try {
        await api.resetPassword(token, password);
        setDone(true);
      } catch (thrown) {
        setError(
          thrown instanceof ApiError
            ? describeProblem(thrown.problem)
            : 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  if (token === null) {
    return (
      <AuthScreen title="Şifre Sıfırlama" subtitle="Bu bağlantı eksik görünüyor.">
        <AuthNotice
          tone="error"
          message="Sıfırlama bağlantısı geçersiz. E-postandaki bağlantıya yeniden tıkla veya yeni bir tane iste."
        />
        <AuthFooterLink
          text="Yeni bağlantı mı gerekiyor?"
          linkLabel="Sıfırlama iste"
          onPress={() => router.replace('/sifremi-unuttum' as never)}
        />
      </AuthScreen>
    );
  }

  if (done) {
    return (
      <AuthScreen title="Şifren Güncellendi" subtitle="Yeni şifrenle giriş yapabilirsin.">
        <AuthNotice
          tone="success"
          message="Güvenlik için tüm oturumların kapatıldı. Diğer cihazlarında yeniden giriş yapman gerekecek."
        />
        <AuthButton
          label="Giriş Yap"
          icon="log-in-outline"
          onPress={() => router.replace('/giris' as never)}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Yeni Şifre Belirle" subtitle="Hesabın için yeni bir şifre seç.">
      <AuthField
        label="Yeni Şifre"
        value={password}
        onChangeText={setPassword}
        placeholder="En az 12 karakter"
        icon="lock-closed-outline"
        secure
        autoComplete="new-password"
      />

      <AuthField
        label="Yeni Şifre (tekrar)"
        value={confirmation}
        onChangeText={setConfirmation}
        placeholder="••••••••"
        icon="lock-closed-outline"
        secure
        autoComplete="new-password"
        onSubmitEditing={handleSubmit}
      />

      {mismatched ? <AuthNotice tone="error" message="Şifreler eşleşmiyor." /> : null}
      {error ? <AuthNotice tone="error" message={error} /> : null}

      <AuthButton
        label="Şifreyi Güncelle"
        icon="checkmark-outline"
        onPress={handleSubmit}
        disabled={!canSubmit}
        busy={busy}
      />
    </AuthScreen>
  );
}

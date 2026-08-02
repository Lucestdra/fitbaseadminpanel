import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AuthButton,
  AuthFooterLink,
  AuthNotice,
  AuthScreen,
} from '@/components/auth/AuthScreen';
import { ApiError, describeProblem } from '@/api/problem';
import * as api from '@/api/session';

type State = 'verifying' | 'verified' | 'failed' | 'awaiting';

/**
 * Where a verification link lands.
 *
 * The token is in the query string because it arrives from a mail client, which cannot POST. That
 * makes it a `GET` whose token is written to whatever log sits in front of this — which is why the
 * link is single-use, short-lived and revocable, and why the *redemption* below is a POST.
 *
 * Also reachable with no token at all, from the "we sent you a mail" state after registering or
 * resending. That case has nothing to verify, so it says so rather than reporting a failure.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; sent?: string }>();
  const token = typeof params.token === 'string' ? params.token : null;

  const [state, setState] = useState<State>(token ? 'verifying' : 'awaiting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      try {
        await api.verifyEmail(token);
        if (!cancelled) setState('verified');
      } catch (thrown) {
        if (cancelled) return;

        setError(
          thrown instanceof ApiError
            ? describeProblem(thrown.problem)
            : 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
        );
        setState('failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === 'awaiting') {
    return (
      <AuthScreen
        title="E-postanı Doğrula"
        subtitle="Sana bir doğrulama bağlantısı gönderdik."
      >
        <AuthNotice
          tone="success"
          message={
            params.sent === '1'
              ? 'Yeni bir doğrulama bağlantısı gönderildi. Gelen kutunu kontrol et.'
              : 'Gelen kutunu kontrol et. Bağlantıya tıkladıktan sonra giriş yapabilirsin.'
          }
        />
        <AuthFooterLink
          text="Doğruladın mı?"
          linkLabel="Giriş yap"
          onPress={() => router.replace('/giris' as never)}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="E-postanı Doğrula"
      subtitle={
        state === 'verified'
          ? 'Adresin doğrulandı.'
          : state === 'failed'
            ? 'Bu bağlantı kullanılamadı.'
            : 'Bağlantı kontrol ediliyor…'
      }
    >
      {state === 'verified' ? (
        <AuthNotice tone="success" message="Artık giriş yapabilirsin." />
      ) : null}

      {state === 'failed' && error ? <AuthNotice tone="error" message={error} /> : null}

      <AuthButton
        label={state === 'verified' ? 'Giriş Yap' : 'Giriş sayfasına dön'}
        icon="log-in-outline"
        onPress={() => router.replace('/giris' as never)}
        busy={state === 'verifying'}
      />
    </AuthScreen>
  );
}

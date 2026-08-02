import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AuthButton,
  AuthCheckbox,
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthScreen,
} from '@/components/auth/AuthScreen';
import { useAuth } from '@/context/AuthContext';
import { ApiError, describeProblem } from '@/api/problem';
import * as api from '@/api/session';

const KVKK_LABEL =
  'KVKK aydınlatma metnini okudum ve kişisel verilerimin işlenmesini kabul ediyorum.';

const ROLE_LABEL: Record<string, string> = {
  OrganizationManager: 'Stüdyo Yöneticisi',
  SalesFinanceConsultant: 'Satış Danışmanı',
  Coach: 'Eğitmen',
};

/**
 * Accept a roster invitation.
 *
 * The token is a path segment rather than a query parameter, matching the link the server mails.
 * Presenting it is the whole authorization — it is a bearer credential exactly like a reset link,
 * single-use, expiring and revocable — so the preview below deliberately says only which studio
 * and which role. It does <b>not</b> say whether the address already has an account, because that
 * would make a forwarded invitation an account-existence oracle for whoever it names.
 *
 * Acceptance has two outcomes. A new account is created and signed in. An address that already
 * has an account is added to the roster and <b>not</b> signed in — accepting an invitation must
 * not be a way to sign in as somebody whose password you do not have — so that path ends at the
 * sign-in screen.
 */
export default function AcceptInvitationScreen() {
  const router = useRouter();
  const { refresh, landingRoute } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : null;

  const [preview, setPreview] = useState<api.InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linked, setLinked] = useState<string | null>(null);

  useEffect(() => {
    // A missing token is derivable from the route, so it is decided during render below rather
    // than by setting state here — an effect that immediately sets state renders twice for a
    // conclusion that was already available.
    if (token === null) return;

    let cancelled = false;

    void (async () => {
      try {
        const found = await api.previewInvitation(token);
        if (cancelled) return;

        setPreview(found);
        setName(found.fullName);
      } catch (thrown) {
        if (cancelled) return;

        setLoadError(
          thrown instanceof ApiError
            ? describeProblem(thrown.problem)
            : 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const mismatched = confirmation.length > 0 && confirmation !== password;

  const canSubmit =
    token !== null &&
    name.trim().length > 0 &&
    password.length > 0 &&
    confirmation === password &&
    acceptedKvkk;

  const handleSubmit = () => {
    if (!canSubmit || busy || token === null) return;

    setBusy(true);
    setError(null);

    void (async () => {
      try {
        const result = await api.acceptInvitation({
          token,
          fullName: name.trim(),
          password,
          acceptedKvkkNotice: acceptedKvkk,
        });

        if (!result.signedIn) {
          setLinked(result.organizationName);
          return;
        }

        await refresh();
        router.replace(landingRoute as never);
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

  const failure = token === null ? 'Davet bağlantısı eksik görünüyor.' : loadError;

  if (failure !== null) {
    return (
      <AuthScreen title="Davet" subtitle="Bu davet kullanılamadı.">
        <AuthNotice tone="error" message={failure} />
        <AuthFooterLink
          text="Hesabın var mı?"
          linkLabel="Giriş yap"
          onPress={() => router.replace('/giris' as never)}
        />
      </AuthScreen>
    );
  }

  if (linked !== null) {
    return (
      <AuthScreen title="Ekibe Eklendin" subtitle={`${linked} ekibine eklendin.`}>
        <AuthNotice
          tone="success"
          message="Bu e-posta adresinin zaten bir hesabı vardı. Mevcut şifrenle giriş yapabilirsin."
        />
        <AuthButton
          label="Giriş Yap"
          icon="log-in-outline"
          onPress={() => router.replace('/giris' as never)}
        />
      </AuthScreen>
    );
  }

  if (preview === null) {
    return (
      <AuthScreen title="Davet" subtitle="Davet kontrol ediliyor…">
        <AuthButton label="Kontrol ediliyor" icon="hourglass-outline" onPress={() => {}} busy />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Ekibe Katıl"
      subtitle={`${preview.organizationName} seni ${ROLE_LABEL[preview.role] ?? preview.role} olarak davet etti.`}
    >
      <AuthField
        label="E-posta"
        value={preview.email}
        onChangeText={() => {}}
        placeholder=""
        icon="mail-outline"
      />

      <AuthField
        label="Ad Soyad"
        value={name}
        onChangeText={setName}
        placeholder="Ör. Mert Kaya"
        icon="person-outline"
        autoComplete="name"
      />

      <AuthField
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        placeholder="En az 12 karakter"
        icon="lock-closed-outline"
        secure
        autoComplete="new-password"
      />

      <AuthField
        label="Şifre (tekrar)"
        value={confirmation}
        onChangeText={setConfirmation}
        placeholder="••••••••"
        icon="lock-closed-outline"
        secure
        autoComplete="new-password"
        onSubmitEditing={handleSubmit}
      />

      <AuthCheckbox
        checked={acceptedKvkk}
        onToggle={() => setAcceptedKvkk((current) => !current)}
        label={KVKK_LABEL}
      />

      {mismatched ? <AuthNotice tone="error" message="Şifreler eşleşmiyor." /> : null}
      {error ? <AuthNotice tone="error" message={error} /> : null}

      <AuthButton
        label="Daveti Kabul Et"
        icon="checkmark-outline"
        onPress={handleSubmit}
        disabled={!canSubmit}
        busy={busy}
      />
    </AuthScreen>
  );
}

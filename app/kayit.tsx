import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  AuthButton,
  AuthCheckbox,
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthScreen,
} from '@/components/auth/AuthScreen';
import { ApiError, describeProblem } from '@/api/problem';
import * as api from '@/api/session';

const KVKK_LABEL =
  'KVKK aydınlatma metnini okudum ve kişisel verilerimin işlenmesini kabul ediyorum.';

/**
 * Register a studio.
 *
 * Three changes from the mock version, each of which the server requires. The form now collects a
 * <b>password</b> — it previously collected a phone number and created an account with no
 * credential at all. It collects a <b>confirmation</b>, because a mistyped password on the one
 * form with no "current password" to fall back on means a reset before the account is ever used.
 * And it collects the <b>KVKK acknowledgement</b>, unticked, because KVKK art. 10 requires the
 * subject be informed before their data is processed and the server refuses registration without
 * it.
 *
 * It no longer signs anybody in. Verification gates the first login (ADR-0020), so the honest end
 * of this flow is "check your mail" rather than a session the server would refuse to renew.
 */
export default function SignUpScreen() {
  const router = useRouter();

  const [studioName, setStudioName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const mismatched = confirmation.length > 0 && confirmation !== password;

  const canSubmit =
    studioName.trim().length > 0 &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmation === password &&
    acceptedKvkk;

  const handleSubmit = () => {
    if (!canSubmit || busy) return;

    setBusy(true);
    setError(null);

    void (async () => {
      try {
        await api.register({
          organizationName: studioName.trim(),
          fullName: name.trim(),
          email: email.trim(),
          password,
          acceptedKvkkNotice: acceptedKvkk,
        });

        // The server answers 202 whether or not the address is already registered, so this screen
        // says the same thing either way. Somebody who already has an account learns that from
        // the mail they receive, not from this form — which is what stops it being a directory of
        // who has signed up.
        setSent(true);
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

  if (sent) {
    return (
      <AuthScreen
        title="E-postanı Doğrula"
        subtitle={`${email.trim()} adresine bir doğrulama bağlantısı gönderdik.`}
      >
        <AuthNotice
          tone="success"
          message="Bağlantıya tıkladıktan sonra giriş yapabilirsin. Bağlantı 3 gün geçerlidir."
        />

        <AuthFooterLink
          text="Bağlantıya tıkladın mı?"
          linkLabel="Giriş yap"
          onPress={() => router.replace('/giris' as never)}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Stüdyonu Kaydet"
      subtitle="Hesabını oluştur, stüdyo yöneticisi olarak başla."
    >
      <AuthField
        label="Stüdyo Adı"
        value={studioName}
        onChangeText={setStudioName}
        placeholder="Ör. Fitbase Studio"
        icon="business-outline"
      />

      <AuthField
        label="Ad Soyad"
        value={name}
        onChangeText={setName}
        placeholder="Ör. Selin Yılmaz"
        icon="person-outline"
        autoComplete="name"
      />

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
        label="Stüdyonu Kaydet"
        icon="checkmark-outline"
        onPress={handleSubmit}
        disabled={!canSubmit}
        busy={busy}
      />

      <AuthFooterLink
        text="Zaten hesabın var mı?"
        linkLabel="Giriş yap"
        onPress={() => router.replace('/giris' as never)}
      />
    </AuthScreen>
  );
}

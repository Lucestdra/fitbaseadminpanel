import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthScreen,
} from '@/components/auth/AuthScreen';
import * as api from '@/api/session';

/**
 * Request a password reset.
 *
 * <b>Says the same thing for every address.</b> The server answers 202 whether or not an account
 * exists, so this screen cannot tell the difference and must not appear to: a form that said
 * "no such account" would be a directory of who has one, checkable at one request per address.
 * Somebody who typed the wrong address learns from the mail that never arrives.
 *
 * That is also why the failure path here shows the same confirmation. The only thing that can go
 * wrong on this call is the network, and reporting *that* differently would leak nothing — but
 * treating any refusal as a reason to say something else is how the guarantee erodes.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (email.trim().length === 0 || busy) return;

    setBusy(true);

    void (async () => {
      try {
        await api.requestPasswordReset(email.trim());
      } finally {
        setBusy(false);
        setSent(true);
      }
    })();
  };

  if (sent) {
    return (
      <AuthScreen
        title="Şifre Sıfırlama"
        subtitle={`${email.trim()} adresi kayıtlıysa bir sıfırlama bağlantısı gönderdik.`}
      >
        <AuthNotice
          tone="success"
          message="Gelen kutunu kontrol et. Bağlantı 1 saat geçerlidir."
        />
        <AuthFooterLink
          text="Şifreni hatırladın mı?"
          linkLabel="Giriş yap"
          onPress={() => router.replace('/giris' as never)}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Şifreni mi Unuttun?"
      subtitle="E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim."
    >
      <AuthField
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@fitbase.studio"
        icon="mail-outline"
        keyboard="email-address"
        autoComplete="email"
        onSubmitEditing={handleSubmit}
      />

      <AuthButton
        label="Sıfırlama Bağlantısı Gönder"
        icon="mail-outline"
        onPress={handleSubmit}
        disabled={email.trim().length === 0}
        busy={busy}
      />

      <AuthFooterLink
        text="Şifreni hatırladın mı?"
        linkLabel="Giriş yap"
        onPress={() => router.replace('/giris' as never)}
      />
    </AuthScreen>
  );
}

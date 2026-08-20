import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { ApiError, describeProblem } from '@/api/problem';
import * as channelsApi from '@/api/channels';
import { CHANNEL_LABELS, CHANNEL_PROVIDERS, type MessagingChannelId } from '@/types/messaging';
import { colors, spacing, typography, radii } from '@/theme';

/**
 * The name our own state travels under.
 *
 * <b>Not `state`, and the backend agrees</b> — `ChannelConnectOptions.StateParameter`. The gateway
 * appends its own parameters to this same query string and `state` is the one name every OAuth
 * implementation reaches for; two of them would leave this screen choosing between a first and a
 * last occurrence, and choosing wrong presents as a session that expired when it did not.
 */
const STATE_PARAM = 'connectionState';

/** What the gateway calls the account it has just connected. */
const ACCOUNT_PARAM = 'accountId';

type Outcome =
  | { kind: 'working' }
  | { kind: 'done'; accountName: string | null; label: string }
  | { kind: 'failed'; message: string };

/**
 * Where a studio lands after authorizing a channel at the provider.
 *
 * <b>This screen finishes the connection; the provider does not.</b> The obvious shape for an OAuth
 * return is an anonymous callback the provider redirects into, and that is deliberately not what
 * this is. The studio comes back to the panel while still signed in, and the panel calls
 * `/connect/complete` with its own bearer token — so the organization the account is filed under
 * comes from the session rather than from a query string that has been through a third party and a
 * browser the studio controls.
 *
 * <b>The state is single-use, so the call must happen exactly once.</b> It is consumed server-side
 * on read (a Redis `GETDEL`), which means a second attempt with the same value is indistinguishable
 * from a replay and is refused as `integrations.signup.session_expired`. A React effect can run
 * twice for one mount — StrictMode in development does it on purpose — so the guard below is what
 * stops a successful connection from reporting a timeout to the person who just made it.
 */
export default function ChannelConnectedScreen() {
  const router = useRouter();
  // No type argument: expo-router types every key as `string | string[]` and this screen's keys
  // are supplied by a third party's redirect, so none of them is guaranteed to be there at all.
  // `single` below is what reconciles that type with what actually arrives.
  const params = useLocalSearchParams();

  const state = single(params[STATE_PARAM]);
  const accountReference = single(params[ACCOUNT_PARAM]);
  const label = labelFor(single(params.provider));

  // <b>An unusable redirect is decided during render, not in an effect.</b> Whether the URL carries
  // what the completion call needs is a pure function of the URL — there is nothing to synchronize
  // with, no request to make, and no cleanup to run — so it is the initial state rather than a
  // `setState` an effect fires on its first pass.
  const [outcome, setOutcome] = useState<Outcome>(() =>
    state && accountReference
      ? { kind: 'working' }
      : {
          kind: 'failed',
          message: missingParameterMessage(state, accountReference, Object.keys(params)),
        },
  );

  // Not state: setting state to guard an effect re-runs the effect. This has to be written and read
  // synchronously within one tick, which is what a ref is.
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current || !state || !accountReference) return;

    submitted.current = true;

    void (async () => {
      try {
        const connection = await channelsApi.completeChannelConnection(state, accountReference);

        setOutcome({ kind: 'done', accountName: connection.displayName, label });
      } catch (thrown) {
        setOutcome({
          kind: 'failed',
          message:
            thrown instanceof ApiError
              ? describeProblem(thrown.problem)
              : 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
        });
      }
    })();
  }, [state, accountReference, label]);

  return (
    <AppShell activeId="messages">
      <View style={styles.header}>
        <Text style={styles.title}>Kanal Bağlantısı</Text>
      </View>

      <Card style={styles.card}>
        {outcome.kind === 'working' && (
          <View style={styles.centred}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.lead}>{label} bağlantısı tamamlanıyor…</Text>
            <Text style={styles.detail}>Bu sayfayı kapatma, birkaç saniye sürüyor.</Text>
          </View>
        )}

        {outcome.kind === 'done' && (
          <View style={styles.centred}>
            <View style={[styles.badge, styles.badgeOk]}>
              <AppIcon name="checkmark-circle-outline" size={28} color={colors.primaryDark} />
            </View>
            <Text style={styles.lead}>{outcome.label} bağlandı.</Text>
            <Text style={styles.detail}>
              {outcome.accountName
                ? `Bağlanan hesap: ${outcome.accountName}.`
                : 'Hesap bağlandı.'}{' '}
              Bundan sonra gelen mesajlar Gelen Kutusu’na düşer. Bağlantıdan önce gelmiş
              konuşmalar da kısa süre içinde görünür.
            </Text>
          </View>
        )}

        {outcome.kind === 'failed' && (
          <View style={styles.centred}>
            <View style={[styles.badge, styles.badgeFail]}>
              <AppIcon name="alert-circle-outline" size={28} color={colors.critical} />
            </View>
            <Text style={styles.lead}>Bağlantı tamamlanamadı.</Text>
            <Text style={styles.detail}>{outcome.message}</Text>
          </View>
        )}

        {outcome.kind !== 'working' && (
          <Pressable
            onPress={() => router.replace('/mesajlar' as never)}
            accessibilityRole="button"
            accessibilityLabel="Mesajlar ekranına dön"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonLabel}>Mesajlar’a Dön</Text>
          </Pressable>
        )}
      </Card>
    </AppShell>
  );
}

/**
 * One value for a query key that may legitimately arrive as several.
 *
 * Expo Router types a repeated key as `string[]`, and a redirect assembled by two parties can
 * produce one. Taking the first is the only defensible choice: ours is written into the redirect URI
 * before the gateway ever sees it, so if a duplicate exists it was appended after.
 */
function single(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;

  return value && value.length > 0 ? value : null;
}

/** The Turkish name of whichever channel the redirect claims to be about. */
function labelFor(provider: string | null): string {
  const id = (Object.keys(CHANNEL_PROVIDERS) as MessagingChannelId[]).find(
    (channel) => CHANNEL_PROVIDERS[channel] === provider,
  );

  // The heading only. The connection is filed under the platform the account actually is — the
  // connector re-reads it from the provider and refuses a mismatch — so a wrong or absent value
  // here costs a word on screen and nothing else.
  return id ? CHANNEL_LABELS[id] : 'Kanal';
}

/**
 * Why the redirect could not be used, in terms somebody can act on.
 *
 * <b>Names the parameters that arrived, not their values.</b> The first real connection is the one
 * most likely to land here, and "bir şeyler ters gitti" would leave nobody able to say whether the
 * gateway changed a parameter name or the studio pressed cancel. The keys are not secrets; the
 * values can be, so they stay out.
 */
function missingParameterMessage(
  state: string | null,
  accountReference: string | null,
  received: readonly string[],
): string {
  if (!state && !accountReference) {
    return 'Sağlayıcıdan bir bağlantı bilgisi gelmedi. Yetkilendirme yarıda kesilmiş olabilir — '
      + 'kanal kartından yeniden başlat.';
  }

  const missing = !state ? 'oturum bilgisi' : 'hesap bilgisi';

  return `Sağlayıcının döndürdüğü adreste ${missing} yok. Gelen alanlar: `
    + `${received.join(', ') || 'yok'}. Kanal kartından yeniden başlat; sürerse destekle paylaş.`;
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.pageTitle,
    color: colors.textPrimary,
  },
  card: {
    gap: spacing.xl,
    alignItems: 'center',
  },
  centred: {
    alignItems: 'center',
    gap: spacing.md,
    maxWidth: 460,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOk: {
    backgroundColor: colors.mintLight,
  },
  badgeFail: {
    backgroundColor: colors.criticalLight,
  },
  lead: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  detail: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonLabel: {
    ...typography.button,
    color: colors.white,
  },
});
